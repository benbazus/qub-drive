use crate::entities::{
    Drive, Folder, DriveItem, DriveActivity, CreateDriveRequest, CreateFolderRequest,
    UpdateFolderRequest, ShareItemRequest, CreateSharingLinkRequest, DriveItemResponse,
    FolderContents, ActivityType,
};
use kingshare_core::{Id, Result};
use std::collections::HashMap;

#[async_trait::async_trait]
pub trait DriveRepository: Send + Sync {
    // Drive management
    async fn create_drive(&self, drive: Drive) -> Result<Drive>;
    async fn get_drive_by_id(&self, drive_id: Id) -> Result<Option<Drive>>;
    async fn get_drives_by_owner(&self, owner_id: Id) -> Result<Vec<Drive>>;
    async fn update_drive(&self, drive: Drive) -> Result<Drive>;
    async fn delete_drive(&self, drive_id: Id) -> Result<()>;
    async fn update_storage_usage(&self, drive_id: Id, size_delta: i64) -> Result<()>;

    // Folder management
    async fn create_folder(&self, folder: Folder) -> Result<Folder>;
    async fn get_folder_by_id(&self, folder_id: Id) -> Result<Option<Folder>>;
    async fn get_folders_by_parent(&self, parent_id: Option<Id>, drive_id: Id) -> Result<Vec<Folder>>;
    async fn update_folder(&self, folder: Folder) -> Result<Folder>;
    async fn delete_folder(&self, folder_id: Id) -> Result<()>;
    async fn move_folder(&self, folder_id: Id, new_parent_id: Option<Id>) -> Result<()>;
    async fn get_folder_path(&self, folder_id: Id) -> Result<String>;

    // Drive item management
    async fn create_drive_item(&self, item: DriveItem) -> Result<DriveItem>;
    async fn get_drive_item_by_id(&self, item_id: Id) -> Result<Option<DriveItem>>;
    async fn get_drive_items_by_parent(&self, parent_id: Option<Id>, drive_id: Id) -> Result<Vec<DriveItem>>;
    async fn get_drive_items_by_drive(&self, drive_id: Id, limit: Option<u32>, offset: Option<u32>) -> Result<Vec<DriveItem>>;
    async fn update_drive_item(&self, item: DriveItem) -> Result<DriveItem>;
    async fn delete_drive_item(&self, item_id: Id) -> Result<()>;
    async fn move_drive_item(&self, item_id: Id, new_parent_id: Option<Id>) -> Result<()>;
    async fn copy_drive_item(&self, item_id: Id, new_parent_id: Option<Id>, new_name: Option<String>) -> Result<DriveItem>;

    // Trash management
    async fn move_to_trash(&self, item_id: Id) -> Result<()>;
    async fn restore_from_trash(&self, item_id: Id) -> Result<()>;
    async fn get_trash_items(&self, drive_id: Id) -> Result<Vec<DriveItem>>;
    async fn empty_trash(&self, drive_id: Id) -> Result<()>;
    async fn permanently_delete(&self, item_id: Id) -> Result<()>;

    // Sharing and permissions
    async fn share_item(&self, item_id: Id, share_request: ShareItemRequest) -> Result<()>;
    async fn unshare_item(&self, item_id: Id, user_id: Id) -> Result<()>;
    async fn create_sharing_link(&self, item_id: Id, link_request: CreateSharingLinkRequest) -> Result<String>;
    async fn get_sharing_link(&self, item_id: Id) -> Result<Option<String>>;
    async fn revoke_sharing_link(&self, item_id: Id) -> Result<()>;
    async fn get_shared_with_me(&self, user_id: Id) -> Result<Vec<DriveItem>>;
    async fn get_shared_by_me(&self, user_id: Id) -> Result<Vec<DriveItem>>;

    // Search and filtering
    async fn search_drive_items(&self, drive_id: Id, query: &str, filters: HashMap<String, String>) -> Result<Vec<DriveItem>>;
    async fn get_recent_items(&self, user_id: Id, limit: u32) -> Result<Vec<DriveItem>>;
    async fn get_starred_items(&self, user_id: Id) -> Result<Vec<DriveItem>>;
    async fn star_item(&self, item_id: Id, user_id: Id) -> Result<()>;
    async fn unstar_item(&self, item_id: Id, user_id: Id) -> Result<()>;

    // Activity and audit
    async fn log_activity(&self, activity: DriveActivity) -> Result<()>;
    async fn get_drive_activity(&self, drive_id: Id, limit: Option<u32>, offset: Option<u32>) -> Result<Vec<DriveActivity>>;
    async fn get_item_activity(&self, item_id: Id, limit: Option<u32>) -> Result<Vec<DriveActivity>>;
    async fn get_user_activity(&self, user_id: Id, limit: Option<u32>) -> Result<Vec<DriveActivity>>;

    // Batch operations
    async fn batch_move_items(&self, item_ids: Vec<Id>, new_parent_id: Option<Id>) -> Result<()>;
    async fn batch_delete_items(&self, item_ids: Vec<Id>) -> Result<()>;
    async fn batch_share_items(&self, item_ids: Vec<Id>, share_request: ShareItemRequest) -> Result<()>;

    // Storage analytics
    async fn get_storage_usage_by_type(&self, drive_id: Id) -> Result<HashMap<String, i64>>;
    async fn get_storage_usage_by_user(&self, drive_id: Id) -> Result<HashMap<Id, i64>>;
    async fn get_largest_files(&self, drive_id: Id, limit: u32) -> Result<Vec<DriveItem>>;

    // Folder contents with pagination
    async fn get_folder_contents(
        &self,
        folder_id: Option<Id>,
        drive_id: Id,
        limit: u32,
        offset: u32,
        sort_by: Option<String>,
        sort_order: Option<String>,
    ) -> Result<FolderContents>;
}

#[async_trait::async_trait]
pub trait DriveService: Send + Sync {
    async fn create_personal_drive(&self, user_id: Id) -> Result<Drive>;
    async fn create_team_drive(&self, owner_id: Id, name: String, team_members: Vec<Id>) -> Result<Drive>;
    async fn get_user_drives(&self, user_id: Id) -> Result<Vec<Drive>>;
    async fn get_drive_quota_usage(&self, drive_id: Id) -> Result<(i64, i64)>; // (used, total)
    
    async fn create_folder_hierarchy(&self, drive_id: Id, path: &str, owner_id: Id) -> Result<Folder>;
    async fn move_item_to_folder(&self, item_id: Id, folder_id: Option<Id>, user_id: Id) -> Result<()>;
    async fn duplicate_item(&self, item_id: Id, new_name: Option<String>, user_id: Id) -> Result<DriveItem>;
    
    async fn share_with_users(&self, item_id: Id, user_ids: Vec<Id>, permissions: String, user_id: Id) -> Result<()>;
    async fn share_with_link(&self, item_id: Id, access_level: String, user_id: Id) -> Result<String>;
    async fn get_item_permissions(&self, item_id: Id, user_id: Id) -> Result<Vec<String>>;
    
    async fn search_items(&self, drive_id: Id, query: &str, user_id: Id) -> Result<Vec<DriveItemResponse>>;
    async fn get_recent_activity(&self, drive_id: Id, user_id: Id, limit: u32) -> Result<Vec<DriveActivity>>;
    
    async fn cleanup_trash(&self, drive_id: Id, older_than_days: u32) -> Result<u32>; // returns count of deleted items
    async fn calculate_folder_size(&self, folder_id: Id) -> Result<i64>;
}