use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct File {
    pub id: Id,
    pub owner_id: Id,
    pub filename: String,
    pub original_filename: String,
    pub content_type: String,
    pub size: i64,
    pub storage_path: String,
    pub checksum: String,
    pub is_public: bool,
    pub download_count: i64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateFileRequest {
    #[validate(length(min = 1, max = 255))]
    pub filename: String,
    
    #[validate(length(min = 1, max = 100))]
    pub content_type: String,
    
    #[validate(range(min = 1))]
    pub size: i64,
    
    pub is_public: Option<bool>,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateFileRequest {
    #[validate(length(min = 1, max = 255))]
    pub filename: Option<String>,
    
    pub is_public: Option<bool>,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub id: Id,
    pub filename: String,
    pub original_filename: String,
    pub content_type: String,
    pub size: i64,
    pub is_public: bool,
    pub download_count: i64,
    pub created_at: Timestamp,
    pub expires_at: Option<Timestamp>,
    pub owner: FileOwner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOwner {
    pub id: Id,
    pub username: String,
    pub full_name: String,
}

impl File {
    pub fn new(
        owner_id: Id,
        filename: String,
        original_filename: String,
        content_type: String,
        size: i64,
        storage_path: String,
        checksum: String,
    ) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4(),
            owner_id,
            filename,
            original_filename,
            content_type,
            size,
            storage_path,
            checksum,
            is_public: false,
            download_count: 0,
            created_at: now,
            updated_at: now,
            expires_at: None,
        }
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            chrono::Utc::now() > expires_at
        } else {
            false
        }
    }

    pub fn increment_download_count(&mut self) {
        self.download_count += 1;
        self.updated_at = chrono::Utc::now();
    }

    pub fn make_public(&mut self) {
        self.is_public = true;
        self.updated_at = chrono::Utc::now();
    }

    pub fn make_private(&mut self) {
        self.is_public = false;
        self.updated_at = chrono::Utc::now();
    }

    pub fn set_expiration(&mut self, expires_at: Option<Timestamp>) {
        self.expires_at = expires_at;
        self.updated_at = chrono::Utc::now();
    }

    pub fn human_readable_size(&self) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
        let mut size = self.size as f64;
        let mut unit_index = 0;

        while size >= 1024.0 && unit_index < UNITS.len() - 1 {
            size /= 1024.0;
            unit_index += 1;
        }

        format!("{:.2} {}", size, UNITS[unit_index])
    }
}