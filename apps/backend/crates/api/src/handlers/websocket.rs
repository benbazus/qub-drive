use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use kingshare_core::{Error, Result};
use serde::Deserialize;
use tracing::{info, instrument};
use crate::server::AppState;

#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    token: Option<String>,
}

#[instrument(skip(ws, state))]
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WebSocketQuery>,
    State(state): State<AppState>,
) -> Result<Response> {
    let connection_id = uuid::Uuid::new_v4().to_string();
    
    info!(
        connection_id = %connection_id,
        has_token = params.token.is_some(),
        "WebSocket connection request"
    );

    // Verify token if provided
    let user_id = if let Some(token) = params.token {
        // In a real implementation, you'd verify the JWT token here
        // For now, we'll just parse it as a UUID for demonstration
        match uuid::Uuid::parse_str(&token) {
            Ok(id) => Some(id),
            Err(_) => {
                // Invalid token, but we can still allow anonymous connections
                None
            }
        }
    } else {
        None
    };

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, connection_id, user_id, state)))
}

async fn handle_socket(
    socket: WebSocket,
    connection_id: String,
    user_id: Option<uuid::Uuid>,
    state: AppState,
) {
    if let Err(e) = state.websocket_service.handle_connection(socket, connection_id.clone(), user_id).await {
        tracing::error!(
            connection_id = %connection_id,
            error = %e,
            "WebSocket connection error"
        );
    }

    info!(
        connection_id = %connection_id,
        user_id = ?user_id,
        "WebSocket connection closed"
    );
}

// WebSocket management endpoints
pub async fn get_websocket_stats(
    State(state): State<AppState>,
) -> Result<axum::Json<serde_json::Value>> {
    let stats = state.websocket_service.get_connection_stats().await?;
    
    Ok(axum::Json(serde_json::json!({
        "total_connections": stats.total_connections,
        "unique_users": stats.unique_users,
        "connections_by_user": stats.connections_by_user
    })))
}

pub async fn cleanup_websocket_connections(
    State(state): State<AppState>,
) -> Result<axum::Json<serde_json::Value>> {
    let removed_count = state.websocket_service.cleanup_inactive_connections(300).await?; // 5 minutes timeout
    
    Ok(axum::Json(serde_json::json!({
        "removed_connections": removed_count
    })))
}