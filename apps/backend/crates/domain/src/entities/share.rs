use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Share {
    pub id: Id,
    pub file_id: Id,
    pub owner_id: Id,
    pub share_token: String,
    pub password: Option<String>,
    pub max_downloads: Option<i32>,
    pub download_count: i32,
    pub is_active: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateShareRequest {
    pub file_id: Id,
    
    #[validate(length(min = 4, max = 100))]
    pub password: Option<String>,
    
    #[validate(range(min = 1, max = 1000))]
    pub max_downloads: Option<i32>,
    
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateShareRequest {
    #[validate(length(min = 4, max = 100))]
    pub password: Option<String>,
    
    #[validate(range(min = 1, max = 1000))]
    pub max_downloads: Option<i32>,
    
    pub expires_at: Option<Timestamp>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareInfo {
    pub id: Id,
    pub share_token: String,
    pub has_password: bool,
    pub max_downloads: Option<i32>,
    pub download_count: i32,
    pub is_active: bool,
    pub created_at: Timestamp,
    pub expires_at: Option<Timestamp>,
    pub file: ShareFileInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareFileInfo {
    pub id: Id,
    pub filename: String,
    pub content_type: String,
    pub size: i64,
    pub human_readable_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct AccessShareRequest {
    #[validate(length(min = 4, max = 100))]
    pub password: Option<String>,
}

impl Share {
    pub fn new(file_id: Id, owner_id: Id) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4(),
            file_id,
            owner_id,
            share_token: Self::generate_share_token(),
            password: None,
            max_downloads: None,
            download_count: 0,
            is_active: true,
            created_at: now,
            updated_at: now,
            expires_at: None,
        }
    }

    pub fn generate_share_token() -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        uuid::Uuid::new_v4().hash(&mut hasher);
        chrono::Utc::now().timestamp_millis().hash(&mut hasher);
        
        format!("{:x}", hasher.finish())
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            chrono::Utc::now() > expires_at
        } else {
            false
        }
    }

    pub fn is_download_limit_reached(&self) -> bool {
        if let Some(max_downloads) = self.max_downloads {
            self.download_count >= max_downloads
        } else {
            false
        }
    }

    pub fn can_be_accessed(&self) -> bool {
        self.is_active && !self.is_expired() && !self.is_download_limit_reached()
    }

    pub fn increment_download_count(&mut self) {
        self.download_count += 1;
        self.updated_at = chrono::Utc::now();
    }

    pub fn set_password(&mut self, password: Option<String>) {
        self.password = password;
        self.updated_at = chrono::Utc::now();
    }

    pub fn verify_password(&self, password: &str) -> bool {
        match &self.password {
            Some(stored_password) => stored_password == password,
            None => true, // No password required
        }
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
        self.updated_at = chrono::Utc::now();
    }

    pub fn activate(&mut self) {
        self.is_active = true;
        self.updated_at = chrono::Utc::now();
    }

    pub fn regenerate_token(&mut self) {
        self.share_token = Self::generate_share_token();
        self.updated_at = chrono::Utc::now();
    }
}