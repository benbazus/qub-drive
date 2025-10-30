use async_trait::async_trait;
use kingshare_core::{Error, Id, Result};
use mockall::automock;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub username: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}

#[automock]
#[async_trait]
pub trait AuthService: Send + Sync {
    async fn hash_password(&self, password: &str) -> Result<String>;
    async fn verify_password(&self, password: &str, hash: &str) -> Result<bool>;
    async fn generate_tokens(&self, user_id: Id, email: &str, username: &str, role: &str) -> Result<TokenPair>;
    async fn verify_token(&self, token: &str) -> Result<Claims>;
    async fn refresh_token(&self, refresh_token: &str) -> Result<TokenPair>;
    async fn revoke_token(&self, token: &str) -> Result<()>;
}