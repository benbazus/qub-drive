use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

/// Drive represents a user's workspace containing folders and files
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Drive {
    pub id: Id,
    pub owner_id: Id,
    pub name: String,
    pub description: Option<String>,
    pub drive_type: DriveType,
    pub storage_quota: i64, // bytes
    pub storage_used: i64,  // bytes
    pub settings: DriveSettings,
    pub is_shared: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DriveType {
    Personal,
    Shared,
    Team,
    Organization,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DriveSettings {
    pub default_sharing_permissions: SharingPermissions,
    pub allow_external_sharing: bool,
    pub require_approval_for_sharing: bool,
    pub auto_backup_enabled: bool,
    pub version_history_retention_days: u32,
    pub trash_retention_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SharingPermissions {
    pub can_view: bool,
    pub can_comment: bool,
    pub can_edit: bool,
    pub can_share: bool,
    pub can_download: bool,
}

/// Folder represents a directory in the drive
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Folder {
    pub id: Id,
    pub drive_id: Id,
    pub parent_id: Option<Id>, // None for root folder
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub path: String, // Full path from root
    pub permissions: FolderPermissions,
    pub is_starred: bool,
    pub is_trashed: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub trashed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FolderPermissions {
    pub owner_id: Id,
    pub shared_with: Vec<FolderShare>,
    pub public_access: PublicAccessLevel,
    pub inherit_permissions: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FolderShare {
    pub user_id: Id,
    pub permissions: SharingPermissions,
    pub granted_by: Id,
    pub granted_at: Timestamp,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PublicAccessLevel {
    Private,
    ViewOnly,
    CommentOnly,
    EditAccess,
}

/// DriveItem represents any item in the drive (file or folder)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DriveItem {
    pub id: Id,
    pub drive_id: Id,
    pub parent_id: Option<Id>,
    pub name: String,
    pub item_type: DriveItemType,
    pub mime_type: String,
    pub size: i64,
    pub path: String,
    pub permissions: ItemPermissions,
    pub metadata: ItemMetadata,
    pub is_starred: bool,
    pub is_trashed: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub trashed_at: Option<Timestamp>,
    pub last_accessed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DriveItemType {
    File,
    Folder,
    Document,
    Spreadsheet,
    Presentation,
    Form,
    Drawing,
    Shortcut,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ItemPermissions {
    pub owner_id: Id,
    pub shared_with: Vec<ItemShare>,
    pub public_access: PublicAccessLevel,
    pub sharing_link: Option<SharingLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ItemShare {
    pub user_id: Id,
    pub permissions: SharingPermissions,
    pub role: ShareRole,
    pub granted_by: Id,
    pub granted_at: Timestamp,
    pub expires_at: Option<Timestamp>,
    pub notification_sent: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ShareRole {
    Viewer,
    Commenter,
    Editor,
    Owner,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SharingLink {
    pub token: String,
    pub access_level: PublicAccessLevel,
    pub password_protected: bool,
    pub password_hash: Option<String>,
    pub expires_at: Option<Timestamp>,
    pub access_count: i64,
    pub created_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ItemMetadata {
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub custom_properties: HashMap<String, String>,
    pub thumbnail_url: Option<String>,
    pub preview_url: Option<String>,
    pub download_url: Option<String>,
    pub web_view_url: Option<String>,
    pub version: i64,
    pub checksum: Option<String>,
}

/// Activity tracking for audit logs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DriveActivity {
    pub id: Id,
    pub drive_id: Id,
    pub item_id: Option<Id>,
    pub user_id: Id,
    pub activity_type: ActivityType,
    pub details: ActivityDetails,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivityType {
    Create,
    Update,
    Delete,
    Move,
    Copy,
    Share,
    Unshare,
    Download,
    View,
    Comment,
    Restore,
    Trash,
    PermissionChange,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ActivityDetails {
    pub action: String,
    pub target_name: String,
    pub old_values: Option<HashMap<String, serde_json::Value>>,
    pub new_values: Option<HashMap<String, serde_json::Value>>,
    pub additional_info: HashMap<String, String>,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct CreateDriveRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub description: Option<String>,
    pub drive_type: DriveType,
    pub storage_quota: Option<i64>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateFolderRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<Id>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateFolderRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<Id>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ShareItemRequest {
    pub user_ids: Vec<Id>,
    pub role: ShareRole,
    pub message: Option<String>,
    pub expires_at: Option<Timestamp>,
    pub notify_users: bool,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSharingLinkRequest {
    pub access_level: PublicAccessLevel,
    pub password: Option<String>,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Serialize)]
pub struct DriveItemResponse {
    pub id: Id,
    pub name: String,
    pub item_type: DriveItemType,
    pub mime_type: String,
    pub size: i64,
    pub path: String,
    pub is_starred: bool,
    pub is_trashed: bool,
    pub permissions: ItemPermissions,
    pub metadata: ItemMetadata,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub owner: ItemOwner,
}

#[derive(Debug, Serialize)]
pub struct ItemOwner {
    pub id: Id,
    pub username: String,
    pub full_name: String,
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct FolderContents {
    pub folder: Folder,
    pub items: Vec<DriveItemResponse>,
    pub total_count: i64,
    pub has_more: bool,
}

impl Drive {
    pub fn new(owner_id: Id, name: String, drive_type: DriveType) -> Self {
        let now = chrono::Utc::now();
        let storage_quota = match drive_type {
            DriveType::Personal => 15 * 1024 * 1024 * 1024, // 15GB
            DriveType::Shared => 100 * 1024 * 1024 * 1024,  // 100GB
            DriveType::Team => 1024 * 1024 * 1024 * 1024,   // 1TB
            DriveType::Organization => 10 * 1024 * 1024 * 1024 * 1024, // 10TB
        };

        Self {
            id: uuid::Uuid::new_v4(),
            owner_id,
            name,
            description: None,
            drive_type,
            storage_quota,
            storage_used: 0,
            settings: DriveSettings::default(),
            is_shared: false,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn storage_usage_percentage(&self) -> f64 {
        if self.storage_quota == 0 {
            0.0
        } else {
            (self.storage_used as f64 / self.storage_quota as f64) * 100.0
        }
    }

    pub fn available_storage(&self) -> i64 {
        self.storage_quota - self.storage_used
    }

    pub fn can_store_file(&self, file_size: i64) -> bool {
        self.available_storage() >= file_size
    }
}

impl Folder {
    pub fn new(drive_id: Id, owner_id: Id, name: String, parent_id: Option<Id>) -> Self {
        let now = chrono::Utc::now();
        let path = if parent_id.is_some() {
            format!("/{}", name) // Will be updated with full path
        } else {
            "/".to_string()
        };

        Self {
            id: uuid::Uuid::new_v4(),
            drive_id,
            parent_id,
            name,
            description: None,
            color: None,
            path,
            permissions: FolderPermissions {
                owner_id,
                shared_with: Vec::new(),
                public_access: PublicAccessLevel::Private,
                inherit_permissions: true,
            },
            is_starred: false,
            is_trashed: false,
            created_at: now,
            updated_at: now,
            trashed_at: None,
        }
    }

    pub fn is_root(&self) -> bool {
        self.parent_id.is_none()
    }

    pub fn move_to_trash(&mut self) {
        self.is_trashed = true;
        self.trashed_at = Some(chrono::Utc::now());
        self.updated_at = chrono::Utc::now();
    }

    pub fn restore_from_trash(&mut self) {
        self.is_trashed = false;
        self.trashed_at = None;
        self.updated_at = chrono::Utc::now();
    }
}

impl DriveItem {
    pub fn new(
        drive_id: Id,
        owner_id: Id,
        name: String,
        item_type: DriveItemType,
        mime_type: String,
        size: i64,
        parent_id: Option<Id>,
    ) -> Self {
        let now = chrono::Utc::now();
        
        Self {
            id: uuid::Uuid::new_v4(),
            drive_id,
            parent_id,
            name,
            item_type,
            mime_type,
            size,
            path: "/".to_string(), // Will be updated with full path
            permissions: ItemPermissions {
                owner_id,
                shared_with: Vec::new(),
                public_access: PublicAccessLevel::Private,
                sharing_link: None,
            },
            metadata: ItemMetadata {
                description: None,
                tags: Vec::new(),
                custom_properties: HashMap::new(),
                thumbnail_url: None,
                preview_url: None,
                download_url: None,
                web_view_url: None,
                version: 1,
                checksum: None,
            },
            is_starred: false,
            is_trashed: false,
            created_at: now,
            updated_at: now,
            trashed_at: None,
            last_accessed_at: None,
        }
    }

    pub fn can_user_access(&self, user_id: Id, required_permission: &str) -> bool {
        // Owner has all permissions
        if self.permissions.owner_id == user_id {
            return true;
        }

        // Check shared permissions
        for share in &self.permissions.shared_with {
            if share.user_id == user_id {
                return match required_permission {
                    "view" => share.permissions.can_view,
                    "comment" => share.permissions.can_comment,
                    "edit" => share.permissions.can_edit,
                    "share" => share.permissions.can_share,
                    "download" => share.permissions.can_download,
                    _ => false,
                };
            }
        }

        // Check public access
        match self.permissions.public_access {
            PublicAccessLevel::Private => false,
            PublicAccessLevel::ViewOnly => required_permission == "view",
            PublicAccessLevel::CommentOnly => matches!(required_permission, "view" | "comment"),
            PublicAccessLevel::EditAccess => matches!(required_permission, "view" | "comment" | "edit"),
        }
    }

    pub fn move_to_trash(&mut self) {
        self.is_trashed = true;
        self.trashed_at = Some(chrono::Utc::now());
        self.updated_at = chrono::Utc::now();
    }

    pub fn restore_from_trash(&mut self) {
        self.is_trashed = false;
        self.trashed_at = None;
        self.updated_at = chrono::Utc::now();
    }

    pub fn update_access_time(&mut self) {
        self.last_accessed_at = Some(chrono::Utc::now());
    }
}

impl Default for DriveSettings {
    fn default() -> Self {
        Self {
            default_sharing_permissions: SharingPermissions {
                can_view: true,
                can_comment: false,
                can_edit: false,
                can_share: false,
                can_download: true,
            },
            allow_external_sharing: true,
            require_approval_for_sharing: false,
            auto_backup_enabled: true,
            version_history_retention_days: 30,
            trash_retention_days: 30,
        }
    }
}

impl DriveActivity {
    pub fn new(
        drive_id: Id,
        user_id: Id,
        activity_type: ActivityType,
        target_name: String,
        action: String,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            drive_id,
            item_id: None,
            user_id,
            activity_type,
            details: ActivityDetails {
                action,
                target_name,
                old_values: None,
                new_values: None,
                additional_info: HashMap::new(),
            },
            ip_address: None,
            user_agent: None,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn with_item(mut self, item_id: Id) -> Self {
        self.item_id = Some(item_id);
        self
    }

    pub fn with_details(mut self, old_values: Option<HashMap<String, serde_json::Value>>, new_values: Option<HashMap<String, serde_json::Value>>) -> Self {
        self.details.old_values = old_values;
        self.details.new_values = new_values;
        self
    }
}