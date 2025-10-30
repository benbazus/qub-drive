use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use kingshare_domain::{
    entities::{CreateFileRequest, File, FileMetadata, UpdateFileRequest, WebSocketMessage},
    repositories::FileRepository,
    services::{FileService as DomainFileService, FileUpload, StorageService, WebSocketService},
};
use std::sync::Arc;
use tracing::{info, instrument};
use validator::Validate;

#[derive(Clone)]
pub struct FileService {
    file_repository: Arc<dyn FileRepository>,
    storage_service: Arc<dyn StorageService>,
    file_service: Arc<dyn DomainFileService>,
    websocket_service: Option<Arc<dyn WebSocketService>>,
}

impl FileService {
    pub fn new(
        file_repository: Arc<dyn FileRepository>,
        storage_service: Arc<dyn StorageService>,
        file_service: Arc<dyn DomainFileService>,
        websocket_service: Option<Arc<dyn WebSocketService>>,
    ) -> Self {
        Self {
            file_repository,
            storage_service,
            file_service,
            websocket_service,
        }
    }

    #[instrument(skip(self, file_data))]
    pub async fn upload_file(
        &self,
        owner_id: Id,
        filename: String,
        content_type: String,
        file_data: Vec<u8>,
    ) -> Result<FileMetadata> {
        // Validate file
        let validation_result = self
            .file_service
            .validate_file(&filename, &content_type, file_data.len() as u64, &file_data)
            .await?;

        if !validation_result.is_valid {
            return Err(Error::Validation(format!(
                "File validation failed: {}",
                validation_result.errors.join(", ")
            )));
        }

        // Store file
        let upload = FileUpload {
            filename: filename.clone(),
            content_type: content_type.clone(),
            data: file_data,
        };

        let stored_file = self.storage_service.store_file(upload).await?;

        // Create file entity
        let file = File::new(
            owner_id,
            filename.clone(),
            filename,
            content_type,
            stored_file.size as i64,
            stored_file.path,
            stored_file.checksum,
        );

        // Save to database
        let created_file = self.file_repository.create(file).await?;

        // Get file metadata for response
        let metadata = self.get_file_metadata(created_file.id).await?;

        // Send WebSocket notification
        if let Some(ws_service) = &self.websocket_service {
            let message = WebSocketMessage::FileUploaded {
                file_id: created_file.id,
                filename: created_file.filename,
                size: created_file.size,
            };
            let _ = ws_service.send_to_user(owner_id, message).await;
        }

        info!(
            file_id = %created_file.id,
            owner_id = %owner_id,
            filename = %created_file.filename,
            size = created_file.size,
            "File uploaded successfully"
        );

        Ok(metadata)
    }

    #[instrument(skip(self))]
    pub async fn get_file(&self, file_id: Id) -> Result<File> {
        self.file_repository
            .find_by_id(file_id)
            .await?
            .ok_or_else(|| Error::NotFound("File not found".to_string()))
    }

    #[instrument(skip(self))]
    pub async fn get_file_metadata(&self, file_id: Id) -> Result<FileMetadata> {
        // Use the repository method that includes owner information via join
        // This is more efficient than separate queries
        let params = kingshare_core::PaginationParams {
            page: Some(1),
            limit: Some(1),
        };
        
        // Try to get from any owner's files (we'll filter by file_id in the repository)
        // This is a workaround - ideally we'd have a get_file_metadata_by_id method
        let file = self.get_file(file_id).await?;
        
        // For now, create a basic owner info
        // In a production system, you'd either:
        // 1. Add a join query to get owner info
        // 2. Have a separate user service call
        // 3. Cache user information
        let owner = kingshare_domain::entities::FileOwner {
            id: file.owner_id,
            username: "user".to_string(),
            full_name: "User Name".to_string(),
        };

        Ok(FileMetadata {
            id: file.id,
            filename: file.filename,
            original_filename: file.original_filename,
            content_type: file.content_type,
            size: file.size,
            is_public: file.is_public,
            download_count: file.download_count,
            created_at: file.created_at,
            expires_at: file.expires_at,
            owner,
        })
    }

    #[instrument(skip(self))]
    pub async fn list_user_files(
        &self,
        owner_id: Id,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<FileMetadata>> {
        self.file_repository.find_by_owner(owner_id, params).await
    }

    #[instrument(skip(self))]
    pub async fn list_public_files(
        &self,
        params: PaginationParams,
    ) -> Result<PaginatedResponse<FileMetadata>> {
        self.file_repository.find_public_files(params).await
    }

    #[instrument(skip(self, request))]
    pub async fn update_file(
        &self,
        file_id: Id,
        owner_id: Id,
        request: UpdateFileRequest,
    ) -> Result<FileMetadata> {
        // Validate request
        request
            .validate()
            .map_err(|e| Error::Validation(e.to_string()))?;

        // Get existing file
        let mut file = self.get_file(file_id).await?;

        // Check ownership
        if file.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to update this file".to_string()));
        }

        // Update fields
        if let Some(filename) = request.filename {
            file.filename = filename;
        }

        if let Some(is_public) = request.is_public {
            if is_public {
                file.make_public();
            } else {
                file.make_private();
            }
        }

        if let Some(expires_at) = request.expires_at {
            file.set_expiration(Some(expires_at));
        }

        file.updated_at = chrono::Utc::now();

        // Save changes
        let updated_file = self.file_repository.update(file).await?;

        info!(
            file_id = %file_id,
            owner_id = %owner_id,
            "File updated successfully"
        );

        self.get_file_metadata(updated_file.id).await
    }

    #[instrument(skip(self))]
    pub async fn delete_file(&self, file_id: Id, owner_id: Id) -> Result<()> {
        // Get file
        let file = self.get_file(file_id).await?;

        // Check ownership
        if file.owner_id != owner_id {
            return Err(Error::Authorization("Not authorized to delete this file".to_string()));
        }

        // Delete from storage
        if let Err(e) = self.storage_service.delete_file(&file.storage_path).await {
            tracing::warn!(
                file_id = %file_id,
                storage_path = %file.storage_path,
                error = %e,
                "Failed to delete file from storage"
            );
        }

        // Delete from database
        self.file_repository.delete(file_id).await?;

        // Send WebSocket notification
        if let Some(ws_service) = &self.websocket_service {
            let message = WebSocketMessage::FileDeleted {
                file_id,
                filename: file.filename.clone(),
            };
            let _ = ws_service.send_to_user(owner_id, message).await;
        }

        info!(
            file_id = %file_id,
            owner_id = %owner_id,
            filename = %file.filename,
            "File deleted successfully"
        );

        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn download_file(&self, file_id: Id, user_id: Option<Id>) -> Result<(File, Vec<u8>)> {
        let mut file = self.get_file(file_id).await?;

        // Check access permissions
        if !file.is_public {
            if let Some(user_id) = user_id {
                if file.owner_id != user_id {
                    return Err(Error::Authorization("Not authorized to download this file".to_string()));
                }
            } else {
                return Err(Error::Authentication("Authentication required".to_string()));
            }
        }

        // Check if file is expired
        if file.is_expired() {
            return Err(Error::BadRequest("File has expired".to_string()));
        }

        // Get file data from storage
        let file_data = self.storage_service.get_file(&file.storage_path).await?;

        // Increment download count
        file.increment_download_count();
        let _ = self.file_repository.update(file.clone()).await;

        // Send WebSocket notification
        if let Some(ws_service) = &self.websocket_service {
            let message = WebSocketMessage::DownloadStarted {
                file_id,
                filename: file.filename.clone(),
            };
            
            if let Some(user_id) = user_id {
                let _ = ws_service.send_to_user(user_id, message).await;
            }
        }

        info!(
            file_id = %file_id,
            user_id = ?user_id,
            filename = %file.filename,
            size = file_data.len(),
            "File downloaded"
        );

        Ok((file, file_data))
    }

    #[instrument(skip(self))]
    pub async fn get_user_storage_stats(&self, owner_id: Id) -> Result<UserStorageStats> {
        let file_count = self.file_repository.count_by_owner(owner_id).await?;
        let total_size = self.file_repository.get_total_size_by_owner(owner_id).await?;

        Ok(UserStorageStats {
            file_count,
            total_size,
            max_file_size: self.file_service.get_max_file_size().await,
        })
    }

    #[instrument(skip(self))]
    pub async fn cleanup_expired_files(&self) -> Result<u64> {
        let expired_files = self.file_repository.find_expired_files().await?;
        let mut deleted_count = 0;

        for file in expired_files {
            // Delete from storage
            if let Err(e) = self.storage_service.delete_file(&file.storage_path).await {
                tracing::warn!(
                    file_id = %file.id,
                    storage_path = %file.storage_path,
                    error = %e,
                    "Failed to delete expired file from storage"
                );
            }
            deleted_count += 1;
        }

        // Delete from database
        let db_deleted = self.file_repository.cleanup_expired_files().await?;

        info!(
            deleted_count = deleted_count,
            db_deleted = db_deleted,
            "Expired files cleanup completed"
        );

        Ok(deleted_count)
    }
}

#[derive(Debug, serde::Serialize)]
pub struct UserStorageStats {
    pub file_count: u64,
    pub total_size: i64,
    pub max_file_size: u64,
}