use crate::entities::{File, FileMetadata};
use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use mockall::automock;

#[automock]
#[async_trait]
pub trait FileRepository: Send + Sync {
    async fn create(&self, file: File) -> Result<File>;
    async fn find_by_id(&self, id: Id) -> Result<Option<File>>;
    async fn find_by_owner(&self, owner_id: Id, params: PaginationParams) -> Result<PaginatedResponse<FileMetadata>>;
    async fn find_public_files(&self, params: PaginationParams) -> Result<PaginatedResponse<FileMetadata>>;
    async fn update(&self, file: File) -> Result<File>;
    async fn delete(&self, id: Id) -> Result<()>;
    async fn exists_by_checksum(&self, checksum: &str) -> Result<bool>;
    async fn find_by_checksum(&self, checksum: &str) -> Result<Option<File>>;
    async fn count_by_owner(&self, owner_id: Id) -> Result<u64>;
    async fn get_total_size_by_owner(&self, owner_id: Id) -> Result<i64>;
    async fn find_expired_files(&self) -> Result<Vec<File>>;
    async fn cleanup_expired_files(&self) -> Result<u64>;
}