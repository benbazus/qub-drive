use axum::{extract::State, Json};
use kingshare_core::{ApiResponse, Error, Result};
use kingshare_domain::{
    entities::CreateUserRequest,
    value_objects::Email,
};
use serde::{Deserialize, Serialize};
use tracing::{info, instrument, warn};
use validator::Validate;
use crate::server::AppState;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub username: String,
    pub full_name: String,
    pub role: String,
}

#[instrument(skip(state, payload))]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>> {
    // Validate request
    payload.validate()
        .map_err(|e| Error::Validation(e.to_string()))?;

    // Create user request
    let create_request = CreateUserRequest {
        email: payload.email,
        username: payload.username,
        first_name: payload.first_name,
        last_name: payload.last_name,
        password: payload.password,
    };

    // Create user using the service from app state
    let user_profile = state.user_service.create_user(create_request).await?;

    // Generate tokens using the auth service
    let role_str = match user_profile.role {
        kingshare_domain::entities::UserRole::Admin => "Admin",
        kingshare_domain::entities::UserRole::User => "User",
        kingshare_domain::entities::UserRole::Guest => "Guest",
    };

    // Get auth service from user service (we need to expose it)
    // For now, create a new one - in production, you'd inject it properly
    let auth_service = kingshare_infrastructure::JwtAuthService::new(state.config.auth.clone());
    let tokens = auth_service.generate_tokens(
        user_profile.id,
        &user_profile.email,
        &user_profile.username,
        role_str,
    ).await?;

    let response = AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: UserInfo {
            id: user_profile.id.to_string(),
            email: user_profile.email,
            username: user_profile.username,
            full_name: format!("{} {}", user_profile.first_name, user_profile.last_name),
            role: role_str.to_string(),
        },
    };

    info!(user_id = %user_profile.id, "User registered successfully");
    Ok(Json(ApiResponse::success(response)))
}

#[instrument(skip(state, payload))]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>> {
    // Validate request
    payload.validate()
        .map_err(|e| Error::Validation(e.to_string()))?;

    // Authenticate user using the service
    let user_profile = state.user_service.authenticate_user(&payload.email, &payload.password).await?;

    // Generate tokens
    let role_str = match user_profile.role {
        kingshare_domain::entities::UserRole::Admin => "Admin",
        kingshare_domain::entities::UserRole::User => "User",
        kingshare_domain::entities::UserRole::Guest => "Guest",
    };

    let auth_service = kingshare_infrastructure::JwtAuthService::new(state.config.auth.clone());
    let tokens = auth_service.generate_tokens(
        user_profile.id,
        &user_profile.email,
        &user_profile.username,
        role_str,
    ).await?;

    let response = AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: UserInfo {
            id: user_profile.id.to_string(),
            email: user_profile.email,
            username: user_profile.username,
            full_name: format!("{} {}", user_profile.first_name, user_profile.last_name),
            role: role_str.to_string(),
        },
    };

    info!(user_id = %user_profile.id, "User logged in successfully");
    Ok(Json(ApiResponse::success(response)))
}

#[instrument(skip(state, payload))]
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>> {
    // Create auth service
    let auth_service = kingshare_infrastructure::JwtAuthService::new(state.config.auth.clone());

    // First, verify the refresh token to get user info
    let refresh_claims = auth_service.verify_token(&payload.refresh_token).await
        .map_err(|_| Error::Authentication("Invalid refresh token".to_string()))?;

    // Parse user ID from refresh token
    let user_id = uuid::Uuid::parse_str(&refresh_claims.sub)
        .map_err(|e| Error::Validation(e.to_string()))?;

    // Get user details from database
    let user_profile = state.user_service.get_user_by_id(user_id).await?;

    // Generate new tokens
    let role_str = match user_profile.role {
        kingshare_domain::entities::UserRole::Admin => "Admin",
        kingshare_domain::entities::UserRole::User => "User",
        kingshare_domain::entities::UserRole::Guest => "Guest",
    };

    let tokens = auth_service.generate_tokens(
        user_profile.id,
        &user_profile.email,
        &user_profile.username,
        role_str,
    ).await?;

    let response = AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: UserInfo {
            id: user_profile.id.to_string(),
            email: user_profile.email,
            username: user_profile.username,
            full_name: format!("{} {}", user_profile.first_name, user_profile.last_name),
            role: role_str.to_string(),
        },
    };

    info!(user_id = %user_profile.id, "Token refreshed successfully");
    Ok(Json(ApiResponse::success(response)))
}

#[instrument(skip(state, request))]
pub async fn logout(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> Result<Json<ApiResponse<String>>> {
    // Extract the token from Authorization header
    let auth_header = request
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            // Create auth service and revoke the token
            let auth_service = kingshare_infrastructure::JwtAuthService::new(state.config.auth.clone());
            let _ = auth_service.revoke_token(token).await; // Ignore errors for logout
        }
    }

    info!("User logged out successfully");
    Ok(Json(ApiResponse::success("Logged out successfully".to_string())))
}