use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

use kingshare_core::{Id, Result as CoreResult};
use kingshare_domain::{
    Drive, Folder, DriveItem, CreateDriveRequest, CreateFolderRequest, UpdateFolderRequest,
    ShareItemRequest, CreateSharingLinkRequest, DriveItemResponse, FolderContents,
    DriveService, DriveRepository, ActivityType, DriveActivity,
};

use crate::{
    error::{ApiError, ApiResult},
    middleware::auth::Claims,
    AppState,
};

// Drive management endpoints
pub async fn create_drive(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateDriveRequest>,
) -> ApiResult<Json<Drive>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let drive_service = state.drive_service.as_ref();
    let drive = match request.drive_type {
        kingshare_domain::DriveType::Personal => {
            drive_service.create_personal_drive(claims.user_id).await?
        }
        kingshare_domain::DriveType::Team => {
            drive_service.create_team_drive(claims.user_id, request.name, vec![]).await?
        }
        _ => {
            let mut drive = Drive::new(claims.user_id, request.name, request.drive_type);
            if let Some(description) = request.description {
                drive.description = Some(description);
            }
            if let Some(quota) = request.storage_quota {
                drive.storage_quota = quota;
            }
            state.drive_repository.create_drive(drive).await?
        }
    };

    Ok(Json(drive))
}

pub async fn get_user_drives(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Json<Vec<Drive>>> {
    let drives = state.drive_service.get_user_drives(claims.user_id).await?;
    Ok(Json(drives))
}

pub async fn get_drive(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
) -> ApiResult<Json<Drive>> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    // Check permissions
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    Ok(Json(drive))
}

pub async fn update_drive(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
    Json(updates): Json<HashMap<String, serde_json::Value>>,
) -> ApiResult<Json<Drive>> {
    let mut drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    // Apply updates
    if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
        drive.name = name.to_string();
    }
    if let Some(description) = updates.get("description").and_then(|v| v.as_str()) {
        drive.description = Some(description.to_string());
    }

    drive.updated_at = chrono::Utc::now();
    let updated_drive = state.drive_repository.update_drive(drive).await?;

    Ok(Json(updated_drive))
}

pub async fn delete_drive(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.delete_drive(drive_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Folder management endpoints
pub async fn create_folder(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
    Json(request): Json<CreateFolderRequest>,
) -> ApiResult<Json<Folder>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    // Verify drive access
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let folder = Folder::new(drive_id, claims.user_id, request.name, request.parent_id);
    let created_folder = state.drive_repository.create_folder(folder).await?;

    // Log activity
    let activity = DriveActivity::new(
        drive_id,
        claims.user_id,
        ActivityType::Create,
        created_folder.name.clone(),
        "Created folder".to_string(),
    ).with_item(created_folder.id);
    
    let _ = state.drive_repository.log_activity(activity).await;

    Ok(Json(created_folder))
}

pub async fn get_folder_contents(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((drive_id, folder_id)): Path<(Id, Option<Id>)>,
    Query(params): Query<FolderContentsQuery>,
) -> ApiResult<Json<FolderContents>> {
    // Verify drive access
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let contents = state.drive_repository.get_folder_contents(
        folder_id,
        drive_id,
        params.limit.unwrap_or(50),
        params.offset.unwrap_or(0),
        params.sort_by,
        params.sort_order,
    ).await?;

    Ok(Json(contents))
}

pub async fn update_folder(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(folder_id): Path<Id>,
    Json(request): Json<UpdateFolderRequest>,
) -> ApiResult<Json<Folder>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let mut folder = state.drive_repository.get_folder_by_id(folder_id).await?
        .ok_or(ApiError::NotFound("Folder not found".to_string()))?;
    
    if folder.permissions.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    // Apply updates
    if let Some(name) = request.name {
        folder.name = name;
    }
    if let Some(description) = request.description {
        folder.description = Some(description);
    }
    if let Some(color) = request.color {
        folder.color = Some(color);
    }
    if let Some(parent_id) = request.parent_id {
        folder.parent_id = Some(parent_id);
    }

    folder.updated_at = chrono::Utc::now();
    let updated_folder = state.drive_repository.update_folder(folder).await?;

    Ok(Json(updated_folder))
}

pub async fn delete_folder(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(folder_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let folder = state.drive_repository.get_folder_by_id(folder_id).await?
        .ok_or(ApiError::NotFound("Folder not found".to_string()))?;
    
    if folder.permissions.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.delete_folder(folder_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Drive item management endpoints
pub async fn get_drive_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<Json<DriveItem>> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "view") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    Ok(Json(item))
}

pub async fn move_drive_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
    Json(request): Json<MoveItemRequest>,
) -> ApiResult<StatusCode> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "edit") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_service.move_item_to_folder(item_id, request.new_parent_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn copy_drive_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
    Json(request): Json<CopyItemRequest>,
) -> ApiResult<Json<DriveItem>> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "view") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let copied_item = state.drive_service.duplicate_item(item_id, request.new_name, claims.user_id).await?;
    Ok(Json(copied_item))
}

pub async fn star_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.drive_repository.star_item(item_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn unstar_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.drive_repository.unstar_item(item_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Trash management endpoints
pub async fn move_to_trash(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "edit") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.move_to_trash(item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore_from_trash(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "edit") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.restore_from_trash(item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_trash_items(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
) -> ApiResult<Json<Vec<DriveItem>>> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let trash_items = state.drive_repository.get_trash_items(drive_id).await?;
    Ok(Json(trash_items))
}

pub async fn empty_trash(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.empty_trash(drive_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Sharing endpoints
pub async fn share_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
    Json(request): Json<ShareItemRequest>,
) -> ApiResult<StatusCode> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "share") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_service.share_with_users(
        item_id,
        request.user_ids,
        format!("{:?}", request.role),
        claims.user_id,
    ).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_sharing_link(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
    Json(request): Json<CreateSharingLinkRequest>,
) -> ApiResult<Json<SharingLinkResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "share") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let link = state.drive_service.share_with_link(
        item_id,
        format!("{:?}", request.access_level),
        claims.user_id,
    ).await?;

    Ok(Json(SharingLinkResponse { link }))
}

pub async fn revoke_sharing_link(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let item = state.drive_repository.get_drive_item_by_id(item_id).await?
        .ok_or(ApiError::NotFound("Item not found".to_string()))?;
    
    if !item.can_user_access(claims.user_id, "share") {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.drive_repository.revoke_sharing_link(item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Search and discovery endpoints
pub async fn search_drive(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
    Query(params): Query<SearchQuery>,
) -> ApiResult<Json<Vec<DriveItemResponse>>> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let query = params.q.unwrap_or_default();
    let results = state.drive_service.search_items(drive_id, &query, claims.user_id).await?;
    Ok(Json(results))
}

pub async fn get_recent_items(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<RecentItemsQuery>,
) -> ApiResult<Json<Vec<DriveItem>>> {
    let limit = params.limit.unwrap_or(20).min(100);
    let items = state.drive_repository.get_recent_items(claims.user_id, limit).await?;
    Ok(Json(items))
}

pub async fn get_starred_items(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Json<Vec<DriveItem>>> {
    let items = state.drive_repository.get_starred_items(claims.user_id).await?;
    Ok(Json(items))
}

pub async fn get_shared_with_me(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Json<Vec<DriveItem>>> {
    let items = state.drive_repository.get_shared_with_me(claims.user_id).await?;
    Ok(Json(items))
}

// Analytics endpoints
pub async fn get_drive_activity(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
    Query(params): Query<ActivityQuery>,
) -> ApiResult<Json<Vec<DriveActivity>>> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let limit = params.limit.unwrap_or(50);
    let offset = params.offset.unwrap_or(0);
    let activities = state.drive_repository.get_drive_activity(drive_id, Some(limit), Some(offset)).await?;
    
    Ok(Json(activities))
}

pub async fn get_storage_usage(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(drive_id): Path<Id>,
) -> ApiResult<Json<StorageUsageResponse>> {
    let drive = state.drive_repository.get_drive_by_id(drive_id).await?
        .ok_or(ApiError::NotFound("Drive not found".to_string()))?;
    
    if drive.owner_id != claims.user_id && !drive.is_shared {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let (used, total) = state.drive_service.get_drive_quota_usage(drive_id).await?;
    let usage_by_type = state.drive_repository.get_storage_usage_by_type(drive_id).await?;
    
    Ok(Json(StorageUsageResponse {
        used,
        total,
        available: total - used,
        usage_percentage: (used as f64 / total as f64) * 100.0,
        usage_by_type,
    }))
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct FolderContentsQuery {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct MoveItemRequest {
    pub new_parent_id: Option<Id>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CopyItemRequest {
    pub new_parent_id: Option<Id>,
    pub new_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub file_type: Option<String>,
    pub modified_after: Option<String>,
    pub modified_before: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RecentItemsQuery {
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct ActivityQuery {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct SharingLinkResponse {
    pub link: String,
}

#[derive(Debug, Serialize)]
pub struct StorageUsageResponse {
    pub used: i64,
    pub total: i64,
    pub available: i64,
    pub usage_percentage: f64,
    pub usage_by_type: HashMap<String, i64>,
}