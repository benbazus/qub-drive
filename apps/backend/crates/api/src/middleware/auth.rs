use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use kingshare_domain::services::Claims;
use kingshare_infrastructure::JwtAuthService;
use std::sync::Arc;
use tracing::{info, warn};
use crate::server::AppState;

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            // Create auth service
            let auth_service = Arc::new(JwtAuthService::new(state.config.auth.clone()));

            // Verify token
            match auth_service.verify_token(token).await {
                Ok(claims) => {
                    // Add claims to request extensions
                    request.extensions_mut().insert(claims);
                    
                    info!(
                        user_id = %claims.sub,
                        username = %claims.username,
                        "User authenticated successfully"
                    );
                }
                Err(e) => {
                    warn!(error = %e, "Token verification failed");
                    return Err(StatusCode::UNAUTHORIZED);
                }
            }
        } else {
            warn!("Invalid Authorization header format");
            return Err(StatusCode::UNAUTHORIZED);
        }
    } else {
        warn!("Missing Authorization header");
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(request).await)
}

pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            // Create auth service
            let auth_service = Arc::new(JwtAuthService::new(state.config.auth.clone()));

            // Verify token (but don't fail if invalid)
            if let Ok(claims) = auth_service.verify_token(token).await {
                request.extensions_mut().insert(claims);
                
                info!(
                    user_id = %claims.sub,
                    username = %claims.username,
                    "User authenticated successfully (optional)"
                );
            }
        }
    }

    next.run(request).await
}

// Extension trait to easily extract claims from request
pub trait ClaimsExt {
    fn claims(&self) -> Option<&Claims>;
    fn user_id(&self) -> Option<uuid::Uuid>;
    fn require_user_id(&self) -> Result<uuid::Uuid, StatusCode>;
}

impl ClaimsExt for Request {
    fn claims(&self) -> Option<&Claims> {
        self.extensions().get::<Claims>()
    }

    fn user_id(&self) -> Option<uuid::Uuid> {
        self.claims()
            .and_then(|claims| uuid::Uuid::parse_str(&claims.sub).ok())
    }

    fn require_user_id(&self) -> Result<uuid::Uuid, StatusCode> {
        self.user_id().ok_or(StatusCode::UNAUTHORIZED)
    }
}