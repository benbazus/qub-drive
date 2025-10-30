use async_trait::async_trait;
use kingshare_core::{Error, Result};
use mockall::automock;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct StoredFile {
    pub path: String,
    pub size: u64,
    pub checksum: String,
}

#[derive(Debug, Clone)]
pub struct FileUpload {
    pub filename: String,
    pub content_type: String,
    pub data: Vec<u8>,
}

#[automock]
#[async_trait]
pub trait StorageService: Send + Sync {
    async fn store_file(&self, upload: FileUpload) -> Result<StoredFile>;
    async fn get_file(&self, path: &str) -> Result<Vec<u8>>;
    async fn delete_file(&self, path: &str) -> Result<()>;
    async fn file_exists(&self, path: &str) -> Result<bool>;
    async fn get_file_size(&self, path: &str) -> Result<u64>;
    async fn calculate_checksum(&self, data: &[u8]) -> String;
    async fn cleanup_orphaned_files(&self, valid_paths: Vec<String>) -> Result<u64>;
}