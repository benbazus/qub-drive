use crate::entities::{Share, ShareInfo};
use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use mockall::automock;

#[automock]
#[async_trait]
pub trait ShareRepository: Send + Sync {
    async fn create(&self, share: Share) -> Result<Share>;
    async fn find_by_id(&self, id: Id) -> Result<Option<Share>>;
    async fn find_by_token(&self, token: &str) -> Result<Option<ShareInfo>>;
    async fn find_by_file(&self, file_id: Id) -> Result<Vec<Share>>;
    async fn find_by_owner(&self, owner_id: Id, params: PaginationParams) -> Result<PaginatedResponse<ShareInfo>>;
    async fn update(&self, share: Share) -> Result<Share>;
    async fn delete(&self, id: Id) -> Result<()>;
    async fn delete_by_file(&self, file_id: Id) -> Result<u64>;
    async fn find_expired_shares(&self) -> Result<Vec<Share>>;
    async fn cleanup_expired_shares(&self) -> Result<u64>;
    async fn count_by_owner(&self, owner_id: Id) -> Result<u64>;
}