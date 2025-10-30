use serde_json::json;
use thiserror::Error;

// Re-export for convenience when axum is available
#[cfg(feature = "axum")]
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Password hash error: {0}")]
    PasswordHash(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),
}

impl Error {
    #[cfg(feature = "axum")]
    pub fn status_code(&self) -> StatusCode {
        match self {
            Error::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Validation(_) => StatusCode::BAD_REQUEST,
            Error::Authentication(_) => StatusCode::UNAUTHORIZED,
            Error::Authorization(_) => StatusCode::FORBIDDEN,
            Error::NotFound(_) => StatusCode::NOT_FOUND,
            Error::Conflict(_) => StatusCode::CONFLICT,
            Error::BadRequest(_) => StatusCode::BAD_REQUEST,
            Error::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Config(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Jwt(_) => StatusCode::UNAUTHORIZED,
            Error::PasswordHash(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Serialization(_) => StatusCode::BAD_REQUEST,
            Error::HttpClient(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn error_code(&self) -> &'static str {
        match self {
            Error::Database(_) => "DATABASE_ERROR",
            Error::Validation(_) => "VALIDATION_ERROR",
            Error::Authentication(_) => "AUTHENTICATION_ERROR",
            Error::Authorization(_) => "AUTHORIZATION_ERROR",
            Error::NotFound(_) => "NOT_FOUND",
            Error::Conflict(_) => "CONFLICT",
            Error::BadRequest(_) => "BAD_REQUEST",
            Error::Internal(_) => "INTERNAL_ERROR",
            Error::Config(_) => "CONFIG_ERROR",
            Error::Jwt(_) => "JWT_ERROR",
            Error::PasswordHash(_) => "PASSWORD_HASH_ERROR",
            Error::Io(_) => "IO_ERROR",
            Error::Serialization(_) => "SERIALIZATION_ERROR",
            Error::HttpClient(_) => "HTTP_CLIENT_ERROR",
        }
    }
}

#[cfg(feature = "axum")]
impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let error_code = self.error_code();
        let message = self.to_string();

        tracing::error!(
            error = %self,
            status_code = %status,
            error_code = error_code,
            "Request failed"
        );

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": message,
                "status": status.as_u16()
            }
        }));

        (status, body).into_response()
    }
}