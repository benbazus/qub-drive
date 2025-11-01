use async_trait::async_trait;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use kingshare_core::{config::AuthConfig, Error, Id, Result};
use kingshare_domain::services::{AuthService, Claims, TokenPair};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tracing::{info, instrument, warn};

#[derive(Clone)]
pub struct JwtAuthService {
    config: AuthConfig,
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    // In production, use Redis or database for token blacklist
    revoked_tokens: std::sync::Arc<std::sync::RwLock<HashSet<String>>>,
}

impl std::fmt::Debug for JwtAuthService {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("JwtAuthService")
            .field("config", &self.config)
            .field("encoding_key", &"[REDACTED]")
            .field("decoding_key", &"[REDACTED]")
            .field("revoked_tokens", &self.revoked_tokens)
            .finish()
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct RefreshClaims {
    sub: String,
    exp: i64,
    iat: i64,
    token_type: String,
}

impl JwtAuthService {
    pub fn new(config: AuthConfig) -> Self {
        let encoding_key = EncodingKey::from_secret(config.jwt_secret.as_bytes());
        let decoding_key = DecodingKey::from_secret(config.jwt_secret.as_bytes());

        Self {
            config,
            encoding_key,
            decoding_key,
            revoked_tokens: std::sync::Arc::new(std::sync::RwLock::new(HashSet::new())),
        }
    }

    fn is_token_revoked(&self, token: &str) -> bool {
        self.revoked_tokens
            .read()
            .unwrap()
            .contains(token)
    }

    fn revoke_token_internal(&self, token: &str) {
        self.revoked_tokens
            .write()
            .unwrap()
            .insert(token.to_string());
    }
}

#[async_trait]
impl AuthService for JwtAuthService {
    #[instrument(skip(self, password))]
    async fn hash_password(&self, password: &str) -> Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| Error::PasswordHash(e.to_string()))?
            .to_string();

        info!("Password hashed successfully");
        Ok(password_hash)
    }

    #[instrument(skip(self, password, hash))]
    async fn verify_password(&self, password: &str, hash: &str) -> Result<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| Error::PasswordHash(e.to_string()))?;

        let argon2 = Argon2::default();
        
        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(_) => {
                info!("Password verification successful");
                Ok(true)
            }
            Err(_) => {
                warn!("Password verification failed");
                Ok(false)
            }
        }
    }

    #[instrument(skip(self))]
    async fn generate_tokens(
        &self,
        user_id: Id,
        email: &str,
        username: &str,
        role: &str,
    ) -> Result<TokenPair> {
        let now = Utc::now();
        let access_exp = now + Duration::seconds(self.config.jwt_expiration);
        let refresh_exp = now + Duration::seconds(self.config.refresh_token_expiration);

        // Access token claims
        let access_claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            username: username.to_string(),
            role: role.to_string(),
            exp: access_exp.timestamp(),
            iat: now.timestamp(),
        };

        // Refresh token claims
        let refresh_claims = RefreshClaims {
            sub: user_id.to_string(),
            exp: refresh_exp.timestamp(),
            iat: now.timestamp(),
            token_type: "refresh".to_string(),
        };

        let access_token = encode(&Header::default(), &access_claims, &self.encoding_key)
            .map_err(Error::Jwt)?;

        let refresh_token = encode(&Header::default(), &refresh_claims, &self.encoding_key)
            .map_err(Error::Jwt)?;

        info!(user_id = %user_id, "Tokens generated successfully");

        Ok(TokenPair {
            access_token,
            refresh_token,
            expires_in: self.config.jwt_expiration,
        })
    }

    #[instrument(skip(self, token))]
    async fn verify_token(&self, token: &str) -> Result<Claims> {
        if self.is_token_revoked(token) {
            return Err(Error::Authentication("Token has been revoked".to_string()));
        }

        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::default(),
        )
        .map_err(Error::Jwt)?;

        // Check if token is expired
        let now = Utc::now().timestamp();
        if token_data.claims.exp < now {
            return Err(Error::Authentication("Token has expired".to_string()));
        }

        info!(user_id = %token_data.claims.sub, "Token verified successfully");
        Ok(token_data.claims)
    }

    #[instrument(skip(self, refresh_token))]
    async fn refresh_token(&self, refresh_token: &str) -> Result<TokenPair> {
        if self.is_token_revoked(refresh_token) {
            return Err(Error::Authentication("Refresh token has been revoked".to_string()));
        }

        let token_data = decode::<RefreshClaims>(
            refresh_token,
            &self.decoding_key,
            &Validation::default(),
        )
        .map_err(Error::Jwt)?;

        // Check if refresh token is expired
        let now = Utc::now().timestamp();
        if token_data.claims.exp < now {
            return Err(Error::Authentication("Refresh token has expired".to_string()));
        }

        // Verify it's a refresh token
        if token_data.claims.token_type != "refresh" {
            return Err(Error::Authentication("Invalid token type".to_string()));
        }

        // Revoke the old refresh token
        self.revoke_token_internal(refresh_token);

        // For a real implementation, you'd fetch user details from database
        // For now, we'll use placeholder values
        let user_id = uuid::Uuid::parse_str(&token_data.claims.sub)
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Generate new token pair
        self.generate_tokens(
            user_id,
            "user@example.com", // This should come from database
            "username",         // This should come from database
            "User",            // This should come from database
        ).await
    }

    #[instrument(skip(self, token))]
    async fn revoke_token(&self, token: &str) -> Result<()> {
        self.revoke_token_internal(token);
        info!("Token revoked successfully");
        Ok(())
    }
}