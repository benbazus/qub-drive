use axum::{
    extract::{Path, Query, Request, State},
    http::{header, StatusCode},
    response::Response,
    Json,
};
use kingshare_core::{ApiResponse, Id, PaginationParams, Result};
use kingshare_domain::entities::{AccessShareRequest, CreateShareRequest, ShareInfo, UpdateShareRequest};
use serde::Deserialize;
use tracing::{info, instrument};
use validator::Validate;
use crate::{middleware::auth::ClaimsExt, server::AppState};

#[derive(Debug, Deserialize)]
pub struct ShareListQuery {
    #[serde(flatten)]
    pub pagination: PaginationParams,
}

#[instrument(skip(state, request))]
pub async fn list_shares(
    State(state): State<AppState>,
    request: Request,
    Query(query): Query<ShareListQuery>,
) -> Result<Json<ApiResponse<Vec<ShareInfo>>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // List user shares using the service from app state
    let shares = state.share_service.list_user_shares(user_id, query.pagination).await?;

    info!(
        user_id = %user_id,
        count = shares.data.len(),
        "Shares listed"
    );

    Ok(Json(ApiResponse::success(shares.data)))
}

#[instrument(skip(state, request, payload))]
pub async fn create_share(
    State(state): State<AppState>,
    request: Request,
    Json(payload): Json<CreateShareRequest>,
) -> Result<Json<ApiResponse<ShareInfo>>> {
    // Validate payload
    payload.validate()
        .map_err(|e| kingshare_core::Error::Validation(e.to_string()))?;

    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Create share using the service from app state
    let share_info = state.share_service.create_share(user_id, payload).await?;

    info!(
        user_id = %user_id,
        share_id = %share_info.id,
        file_id = %share_info.file.id,
        share_token = %share_info.share_token,
        "Share created successfully"
    );

    Ok(Json(ApiResponse::success(share_info)))
}

#[instrument(skip(state, request))]
pub async fn get_share(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
) -> Result<Json<ApiResponse<ShareInfo>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Get share using the service from app state
    let share_info = state.share_service.get_share(id, user_id).await?;

    info!(
        user_id = %user_id,
        share_id = %id,
        "Share retrieved"
    );

    Ok(Json(ApiResponse::success(share_info)))
}

#[instrument(skip(state, request, payload))]
pub async fn update_share(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
    Json(payload): Json<UpdateShareRequest>,
) -> Result<Json<ApiResponse<ShareInfo>>> {
    // Validate payload
    payload.validate()
        .map_err(|e| kingshare_core::Error::Validation(e.to_string()))?;

    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Update share using the service from app state
    let updated_share = state.share_service.update_share(id, user_id, payload).await?;

    info!(
        user_id = %user_id,
        share_id = %id,
        "Share updated successfully"
    );

    Ok(Json(ApiResponse::success(updated_share)))
}

#[instrument(skip(state, request))]
pub async fn delete_share(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
) -> Result<Json<ApiResponse<String>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Delete share using the service from app state
    state.share_service.delete_share(id, user_id).await?;

    info!(
        user_id = %user_id,
        share_id = %id,
        "Share deleted successfully"
    );

    Ok(Json(ApiResponse::success("Share deleted successfully".to_string())))
}

#[instrument(skip(state))]
pub async fn get_share_by_token(
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> Result<Json<ApiResponse<ShareInfo>>> {
    // Get share by token using the service from app state
    let share_info = state.share_service.get_share_by_token(&token).await?;

    info!(
        token = %token,
        share_id = %share_info.id,
        "Share retrieved by token"
    );

    Ok(Json(ApiResponse::success(share_info)))
}

#[instrument(skip(state, payload))]
pub async fn download_shared_file(
    State(state): State<AppState>,
    Path(token): Path<String>,
    Json(payload): Json<AccessShareRequest>,
) -> Result<Response> {
    // Validate payload
    payload.validate()
        .map_err(|e| kingshare_core::Error::Validation(e.to_string()))?;

    // Access shared file using the service from app state
    let (share_info, file_data) = state.share_service.access_shared_file(&token, payload).await?;

    info!(
        token = %token,
        share_id = %share_info.id,
        file_id = %share_info.file.id,
        filename = %share_info.file.filename,
        size = file_data.len(),
        "Shared file downloaded"
    );

    // Create response with appropriate headers
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, share_info.file.content_type)
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", share_info.file.filename),
        )
        .header(header::CONTENT_LENGTH, file_data.len())
        .body(file_data.into())
        .map_err(|e| kingshare_core::Error::Internal(format!("Failed to create response: {}", e)))?;

    Ok(response)
}

#[instrument(skip(state, request))]
pub async fn regenerate_share_token(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
) -> Result<Json<ApiResponse<ShareInfo>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Regenerate token using the service from app state
    let updated_share = state.share_service.regenerate_share_token(id, user_id).await?;

    info!(
        user_id = %user_id,
        share_id = %id,
        new_token = %updated_share.share_token,
        "Share token regenerated"
    );

    Ok(Json(ApiResponse::success(updated_share)))
}