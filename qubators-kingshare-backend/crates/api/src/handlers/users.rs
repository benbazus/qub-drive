use axum::{extract::{Request, State}, Json};
use kingshare_core::{ApiResponse, Error, Result};
use kingshare_domain::{entities::UpdateUserRequest, UserProfile};
use serde::Deserialize;
use tracing::{info, instrument};
use validator::Validate;
use crate::{middleware::auth::ClaimsExt, server::AppState};

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
}

#[instrument(skip(state, request))]
pub async fn get_profile(
    State(state): State<AppState>,
    request: Request,
) -> Result<Json<ApiResponse<UserProfile>>> {
    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| Error::Authentication("Authentication required".to_string()))?;

    // Get user profile using the service from app state
    let profile = state.user_service.get_user_by_id(user_id).await?;

    info!(user_id = %user_id, "User profile retrieved");
    Ok(Json(ApiResponse::success(profile)))
}

#[instrument(skip(state, request, payload))]
pub async fn update_profile(
    State(state): State<AppState>,
    request: Request,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<ApiResponse<UserProfile>>> {
    // Validate request
    payload.validate()
        .map_err(|e| Error::Validation(e.to_string()))?;

    // Extract user ID from JWT claims
    let user_id = request.require_user_id()
        .map_err(|_| Error::Authentication("Authentication required".to_string()))?;

    // Create update request
    let update_request = UpdateUserRequest {
        username: payload.username,
        first_name: payload.first_name,
        last_name: payload.last_name,
    };

    // Update user profile using the service from app state
    let updated_profile = state.user_service.update_user(user_id, update_request).await?;

    info!(user_id = %user_id, "User profile updated");
    Ok(Json(ApiResponse::success(updated_profile)))
}

#[instrument(skip(state))]
pub async fn list_users(
    State(state): State<AppState>,
    // Query(params): Query<PaginationParams>
) -> Result<Json<ApiResponse<Vec<UserProfile>>>> {
    // Use default pagination for now
    let params = kingshare_core::PaginationParams::default();
    let paginated_users = state.user_service.list_users(params).await?;

    info!(count = paginated_users.data.len(), "Users listed");
    Ok(Json(ApiResponse::success(paginated_users.data)))
}