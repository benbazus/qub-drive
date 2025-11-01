use axum::{extract::State, Json};
use kingshare_core::{ApiResponse, Result};
use serde::{Deserialize, Serialize};
use crate::server::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub database: String,
}

pub async fn health_check(State(state): State<AppState>) -> Result<Json<ApiResponse<HealthResponse>>> {
    // Check database health
    let db_status = match state.database.health_check().await {
        Ok(_) => "healthy".to_string(),
        Err(_) => "unhealthy".to_string(),
    };

    let response = HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: db_status,
    };

    Ok(Json(ApiResponse::success(response)))
}