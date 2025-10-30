use crate::entities::{User, UserProfile};
use crate::value_objects::Email;
use async_trait::async_trait;
use kingshare_core::{Error, Id, PaginatedResponse, PaginationParams, Result};
use mockall::automock;

#[automock]
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(&self, user: User) -> Result<User>;
    async fn find_by_id(&self, id: Id) -> Result<Option<User>>;
    async fn find_by_email(&self, email: &Email) -> Result<Option<User>>;
    async fn find_by_username(&self, username: &str) -> Result<Option<User>>;
    async fn update(&self, user: User) -> Result<User>;
    async fn delete(&self, id: Id) -> Result<()>;
    async fn list(&self, params: PaginationParams) -> Result<PaginatedResponse<UserProfile>>;
    async fn exists_by_email(&self, email: &Email) -> Result<bool>;
    async fn exists_by_username(&self, username: &str) -> Result<bool>;
    async fn count(&self) -> Result<u64>;
    async fn find_active_users(&self, params: PaginationParams) -> Result<PaginatedResponse<UserProfile>>;
}