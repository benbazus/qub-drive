use axum::{
    extract::{Multipart, Path, Query, Request, State},
    http::{header, StatusCode},
    response::Response,
    Json,
};
use kingshare_application::services::UserStorageStats;
use kingshare_core::{ApiResponse, Id, PaginationParams, Result};
use kingshare_domain::{entities::UpdateFileRequest, FileMetadata};
use serde::Deserialize;
use tracing::{info, instrument, warn};
use validator::Validate;
use crate::{middleware::auth::ClaimsExt, server::AppState};

#[derive(Debug, Deserialize)]
pub struct FileListQuery {
    #[serde(flatten)]
    pub pagination: PaginationParams,
    pub public_only: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateFilePayload {
    #[validate(length(min = 1, max = 255))]
    pub filename: Option<String>,
    pub is_public: Option<bool>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[instrument(skip(state, request))]
pub async fn list_files(
    State(state): State<AppState>,
    request: Request,
    Query(query): Query<FileListQuery>,
) -> Result<Json<ApiResponse<Vec<FileMetadata>>>> {
    let files = if query.public_only.unwrap_or(false) {
        // Public files don't require authentication
        state.file_service.list_public_files(query.pagination).await?
    } else {
        // User files require authentication
        let user_id = request.require_user_id()
            .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;
        state.file_service.list_user_files(user_id, query.pagination).await?
    };

    info!(
        user_id = ?request.user_id(),
        count = files.data.len(),
        public_only = query.public_only.unwrap_or(false),
        "Files listed"
    );

    Ok(Json(ApiResponse::success(files.data)))
}

#[instrument(skip(state, request, multipart))]
pub async fn upload_file(
    State(state): State<AppState>,
    request: Request,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<FileMetadata>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    let mut filename = None;
    let mut content_type = None;
    let mut file_data = None;

    // Process multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        kingshare_core::Error::BadRequest(format!("Invalid multipart data: {}", e))
    })? {
        let field_name = field.name().unwrap_or("").to_string();

        match field_name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                content_type = field.content_type().map(|s| s.to_string());
                file_data = Some(field.bytes().await.map_err(|e| {
                    kingshare_core::Error::BadRequest(format!("Failed to read file data: {}", e))
                })?);
            }
            _ => {
                warn!(field_name = %field_name, "Unknown multipart field");
            }
        }
    }

    // Validate required fields
    let filename = filename.ok_or_else(|| {
        kingshare_core::Error::BadRequest("Missing filename".to_string())
    })?;

    let content_type = content_type.unwrap_or_else(|| "application/octet-stream".to_string());

    let file_data = file_data.ok_or_else(|| {
        kingshare_core::Error::BadRequest("Missing file data".to_string())
    })?;

    // Upload file using the service from app state
    let file_metadata = state.file_service
        .upload_file(user_id, filename, content_type, file_data.to_vec())
        .await?;

    info!(
        user_id = %user_id,
        file_id = %file_metadata.id,
        filename = %file_metadata.filename,
        size = file_metadata.size,
        "File uploaded successfully"
    );

    Ok(Json(ApiResponse::success(file_metadata)))
}

#[instrument(skip(state))]
pub async fn get_file(
    State(state): State<AppState>,
    Path(id): Path<Id>,
) -> Result<Json<ApiResponse<FileMetadata>>> {
    // Get file metadata using the service from app state
    let file_metadata = state.file_service.get_file_metadata(id).await?;

    info!(file_id = %id, "File metadata retrieved");

    Ok(Json(ApiResponse::success(file_metadata)))
}

#[instrument(skip(state, request, payload))]
pub async fn update_file(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
    Json(payload): Json<UpdateFilePayload>,
) -> Result<Json<ApiResponse<FileMetadata>>> {
    // Validate payload
    payload.validate()
        .map_err(|e| kingshare_core::Error::Validation(e.to_string()))?;

    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Create update request
    let update_request = UpdateFileRequest {
        filename: payload.filename,
        is_public: payload.is_public,
        expires_at: payload.expires_at,
    };

    // Update file using the service from app state
    let updated_file = state.file_service.update_file(id, user_id, update_request).await?;

    info!(
        file_id = %id,
        user_id = %user_id,
        "File updated successfully"
    );

    Ok(Json(ApiResponse::success(updated_file)))
}

#[instrument(skip(state, request))]
pub async fn delete_file(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
) -> Result<Json<ApiResponse<String>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Delete file using the service from app state
    state.file_service.delete_file(id, user_id).await?;

    info!(
        file_id = %id,
        user_id = %user_id,
        "File deleted successfully"
    );

    Ok(Json(ApiResponse::success("File deleted successfully".to_string())))
}

#[instrument(skip(state, request))]
pub async fn download_file(
    State(state): State<AppState>,
    request: Request,
    Path(id): Path<Id>,
) -> Result<Response> {
    // Extract user ID from JWT claims (optional for public files)
    let user_id = request.user_id();

    // Download file using the service from app state
    let (file, file_data) = state.file_service.download_file(id, user_id).await?;

    info!(
        file_id = %id,
        user_id = %user_id,
        filename = %file.filename,
        size = file_data.len(),
        "File downloaded"
    );

    // Create response with appropriate headers
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, file.content_type)
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", file.original_filename),
        )
        .header(header::CONTENT_LENGTH, file_data.len())
        .body(file_data.into())
        .map_err(|e| kingshare_core::Error::Internal(format!("Failed to create response: {}", e)))?;

    Ok(response)
}

#[instrument(skip(state, request))]
pub async fn get_storage_stats(
    State(state): State<AppState>,
    request: Request,
) -> Result<Json<ApiResponse<UserStorageStats>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| kingshare_core::Error::Authentication("Authentication required".to_string()))?;

    // Get storage stats using the service from app state
    let stats = state.file_service.get_user_storage_stats(user_id).await?;

    info!(
        user_id = %user_id,
        file_count = stats.file_count,
        total_size = stats.total_size,
        "Storage stats retrieved"
    );

    Ok(Json(ApiResponse::success(stats)))
}