use async_trait::async_trait;
use kingshare_core::{Error, Id, Result};
use mockall::automock;

#[derive(Debug, Clone)]
pub struct FileValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct FileAnalysis {
    pub is_safe: bool,
    pub detected_type: String,
    pub virus_scan_result: Option<bool>,
    pub metadata: std::collections::HashMap<String, String>,
}

#[automock]
#[async_trait]
pub trait FileService: Send + Sync {
    async fn validate_file(&self, filename: &str, content_type: &str, size: u64, data: &[u8]) -> Result<FileValidationResult>;
    async fn analyze_file(&self, filename: &str, data: &[u8]) -> Result<FileAnalysis>;
    async fn generate_thumbnail(&self, file_path: &str, max_width: u32, max_height: u32) -> Result<Option<Vec<u8>>>;
    async fn extract_metadata(&self, filename: &str, data: &[u8]) -> Result<std::collections::HashMap<String, String>>;
    async fn is_allowed_file_type(&self, content_type: &str) -> bool;
    async fn get_max_file_size(&self) -> u64;
}