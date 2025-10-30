use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use kingshare_domain::{
    entities::{
        AccessShareRequest, CreateShareRequest, Share, ShareInfo, UpdateShareRequest, WebSocketMessage,
    },
    repositories::{FileRepository, ShareRepository},
    services::{StorageService, WebSocketService},
};
use std::sync::Arc;
use tracing::{info, instrument, warn};
use validator::Validate;

#[derive(Clone)]
pub struct ShareService {
    share_repository: Arc<dyn ShareRepository>,
    file_repository: Arc<dyn FileRepository>,
    storage_service: Option<Arc<dyn StorageService>>,
    websocket_service: Option<Arc<dyn WebSocketService>>,
}

impl ShareService {
    pub fn new(
        share_repository: Arc<dyn ShareRepository>,
        file_repository: Arc<dyn FileRepository>,
        websocket_service: Option<Arc<dyn WebSocketService>>,
    ) -> Self {
        Self {
            share_repository,
            file_repository,
            storage_service: None,
            websocket_service,
        }
    }

    pub fn with_storage(
        share_repository: Arc<dyn ShareRepository>,
        file_repository: Arc<dyn FileRepository>,
        storage_service: Arc<dyn StorageService>,
        websocket_service: Option<Arc<dyn WebSocketService>>,
    ) -> Self {
        Self {
            share_repository,
            file_repository,
            storage_service: Some(storage_service),
            websocket_service,
        }
    }

    #[instrument(skip(self, request))]
    pub async fn create_share(
        &self,
        owner_id: Id,
        request: CreateShareRequest,
    ) -> Result<ShareInfo> {
        // Validate request
        request
            .validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Check if file exists and user owns it
        let file = self
            .file_repository
            .find_by_id(request.file_id)
            .await?
            .ok_or_else(|| Error::NotFound("File not found".to_string()))?;

        if file.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to share this file".to_string()));
        }

        // Create share
        let mut share = Share::new(request.file_id, owner_id);

        // Set optional fields
        if let Some(password) = request.password {
            share.set_password(Some(password));
        }

        if let Some(max_downloads) = request.max_downloads {
            share.max_downloads = Some(max_downloads);
        }

        if let Some(expires_at) = request.expires_at {
            share.expires_at = Some(expires_at);
        }

        // Save to database
        let created_share = self.share_repository.create(share).await?;

        // Get share info for response
        let share_info = self.get_share_info(created_share.id).await?;

        // Send WebSocket notification
        if let Some(ws_service) = &self.websocket_service {
            let message = WebSocketMessage::FileShared {
                share_id: created_share.id,
                file_id: created_share.file_id,
                share_token: created_share.share_token.clone(),
            };
            let _ = ws_service.send_to_user(owner_id, message).await;
        }

        info!(
            share_id = %created_share.id,
            file_id = %created_share.file_id,
            owner_id = %owner_id,
            share_token = %created_share.share_token,
            "Share created successfully"
        );

        Ok(share_info)
    }

    #[instrument(skip(self))]
    pub async fn get_share(&self, share_id: Id, owner_id: Id) -> Result<ShareInfo> {
        let share = self
            .share_repository
            .find_by_id(share_id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Check ownership
        if share.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to access this share".to_string()));
        }

        self.get_share_info(share_id).await
    }

    #[instrument(skip(self))]
    pub async fn get_share_by_token(&self, token: &str) -> Result<ShareInfo> {
        let share_info = self
            .share_repository
            .find_by_token(token)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Check if share is accessible
        let share = self
            .share_repository
            .find_by_id(share_info.id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        if !share.can_be_accessed() {
            return Err(Error::BadRequest("Share is not accessible".to_string()));
        }

        Ok(share_info)
    }

    #[instrument(skip(self))]
    pub async fn list_user_shares(
        &self,
        owner_id: Id,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<ShareInfo>> {
        self.share_repository.find_by_owner(owner_id, params).await
    }

    #[instrument(skip(self, request))]
    pub async fn update_share(
        &self,
        share_id: Id,
        owner_id: Id,
        request: UpdateShareRequest,
    ) -> Result<ShareInfo> {
        // Validate request
        request
            .validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Get existing share
        let mut share = self
            .share_repository
            .find_by_id(share_id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Check ownership
        if share.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to update this share".to_string()));
        }

        // Update fields
        if let Some(password) = request.password {
            share.set_password(Some(password));
        }

        if let Some(max_downloads) = request.max_downloads {
            share.max_downloads = Some(max_downloads);
        }

        if let Some(expires_at) = request.expires_at {
            share.expires_at = Some(expires_at);
        }

        if let Some(is_active) = request.is_active {
            if is_active {
                share.activate();
            } else {
                share.deactivate();
            }
        }

        share.updated_at = chrono::Utc::now();

        // Save changes
        let updated_share = self.share_repository.update(share).await?;

        info!(
            share_id = %share_id,
            owner_id = %owner_id,
            "Share updated successfully"
        );

        self.get_share_info(updated_share.id).await
    }

    #[instrument(skip(self))]
    pub async fn delete_share(&self, share_id: Id, owner_id: Id) -> Result<()> {
        // Get share
        let share = self
            .share_repository
            .find_by_id(share_id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Check ownership
        if share.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to delete this share".to_string()));
        }

        // Delete from database
        self.share_repository.delete(share_id).await?;

        info!(
            share_id = %share_id,
            owner_id = %owner_id,
            "Share deleted successfully"
        );

        Ok(())
    }

    #[instrument(skip(self, request))]
    pub async fn access_shared_file(
        &self,
        token: &str,
        request: AccessShareRequest,
    ) -> Result<(ShareInfo, Vec<u8>)> {
        // Validate request
        request
            .validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Get share by token
        let share_info = self.get_share_by_token(token).await?;

        // Get full share for validation
        let mut share = self
            .share_repository
            .find_by_id(share_info.id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Verify password if required
        if let Some(password) = &request.password {
            if !share.verify_password(password) {
                return Err(Error::Authentication("Invalid password".to_string()));
            }
        } else if share.password.is_some() {
            return Err(Error::Authentication("Password required".to_string()));
        }

        // Check if share can be accessed
        if !share.can_be_accessed() {
            return Err(Error::BadRequest("Share is not accessible".to_string()));
        }

        // Get file
        let file = self
            .file_repository
            .find_by_id(share.file_id)
            .await?
            .ok_or_else(|| Error::NotFound("File not found".to_string()))?;

        // Get file data from storage
        let file_data = if let Some(storage_service) = &self.storage_service {
            storage_service.get_file(&file.storage_path).await?
        } else {
            // Fallback to empty data if no storage service is configured
            vec![]
        };

        // Increment download count
        share.increment_download_count();
        let _ = self.share_repository.update(share.clone()).await;

        // Send WebSocket notification to file owner
        if let Some(ws_service) = &self.websocket_service {
            let message = WebSocketMessage::ShareAccessed {
                share_id: share.id,
                file_id: share.file_id,
                filename: file.filename.clone(),
            };
            let _ = ws_service.send_to_user(share.owner_id, message).await;
        }

        info!(
            share_id = %share.id,
            file_id = %share.file_id,
            token = %token,
            "Shared file accessed"
        );

        Ok((share_info, file_data))
    }

    #[instrument(skip(self))]
    pub async fn regenerate_share_token(&self, share_id: Id, owner_id: Id) -> Result<ShareInfo> {
        // Get share
        let mut share = self
            .share_repository
            .find_by_id(share_id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        // Check ownership
        if share.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to regenerate token for this share".to_string()));
        }

        // Regenerate token
        share.regenerate_token();

        // Save changes
        let updated_share = self.share_repository.update(share).await?;

        info!(
            share_id = %share_id,
            owner_id = %owner_id,
            new_token = %updated_share.share_token,
            "Share token regenerated"
        );

        self.get_share_info(updated_share.id).await
    }

    #[instrument(skip(self))]
    pub async fn cleanup_expired_shares(&self) -> Result<u64> {
        let expired_shares = self.share_repository.find_expired_shares().await?;
        
        // Send WebSocket notifications for expired shares
        if let Some(ws_service) = &self.websocket_service {
            for share in &expired_shares {
                let message = WebSocketMessage::ShareExpired {
                    share_id: share.id,
                    file_id: share.file_id,
                };
                let _ = ws_service.send_to_user(share.owner_id, message).await;
            }
        }

        // Delete from database
        let deleted_count = self.share_repository.cleanup_expired_shares().await?;

        info!(
            deleted_count = deleted_count,
            "Expired shares cleanup completed"
        );

        Ok(deleted_count)
    }

    #[instrument(skip(self))]
    async fn get_share_info(&self, share_id: Id) -> Result<ShareInfo> {
        // This is a simplified implementation
        // In a real implementation, you'd join with file and user tables
        let share = self
            .share_repository
            .find_by_id(share_id)
            .await?
            .ok_or_else(|| Error::NotFound("Share not found".to_string()))?;

        let file = self
            .file_repository
            .find_by_id(share.file_id)
            .await?
            .ok_or_else(|| Error::NotFound("File not found".to_string()))?;

        Ok(ShareInfo {
            id: share.id,
            share_token: share.share_token,
            has_password: share.password.is_some(),
            max_downloads: share.max_downloads,
            download_count: share.download_count,
            is_active: share.is_active,
            created_at: share.created_at,
            expires_at: share.expires_at,
            file: kingshare_domain::entities::ShareFileInfo {
                id: file.id,
                filename: file.filename,
                content_type: file.content_type,
                size: file.size,
                human_readable_size: file.human_readable_size(),
            },
        })
    }
}