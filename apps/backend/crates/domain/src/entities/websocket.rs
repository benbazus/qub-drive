use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConnection {
    pub connection_id: String,
    pub user_id: Id,
    pub connected_at: Timestamp,
    pub last_activity: Timestamp,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WebSocketMessage {
    // Authentication
    Authenticate { token: String },
    AuthenticationResult { success: bool, message: String },
    
    // File operations
    FileUploaded { file_id: Id, filename: String, size: i64 },
    FileDeleted { file_id: Id, filename: String },
    FileShared { share_id: Id, file_id: Id, share_token: String },
    
    // Share operations
    ShareAccessed { share_id: Id, file_id: Id, filename: String },
    ShareExpired { share_id: Id, file_id: Id },
    
    // System notifications
    SystemNotification { message: String, level: NotificationLevel },
    
    // Real-time updates
    UserOnline { user_id: Id, username: String },
    UserOffline { user_id: Id, username: String },
    
    // File transfer progress
    UploadProgress { file_id: Id, progress: f32, bytes_uploaded: u64, total_bytes: u64 },
    DownloadStarted { file_id: Id, filename: String },
    
    // Heartbeat
    Ping,
    Pong,
    
    // Error handling
    Error { code: String, message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationLevel {
    Info,
    Warning,
    Error,
    Success,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketEvent {
    pub id: String,
    pub user_id: Option<Id>,
    pub message: WebSocketMessage,
    pub timestamp: Timestamp,
    pub broadcast: bool, // Whether to broadcast to all connections or specific user
}

impl WebSocketEvent {
    pub fn new(message: WebSocketMessage, user_id: Option<Id>, broadcast: bool) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            user_id,
            message,
            timestamp: chrono::Utc::now(),
            broadcast,
        }
    }

    pub fn user_event(message: WebSocketMessage, user_id: Id) -> Self {
        Self::new(message, Some(user_id), false)
    }

    pub fn broadcast_event(message: WebSocketMessage) -> Self {
        Self::new(message, None, true)
    }

    pub fn system_notification(message: String, level: NotificationLevel) -> Self {
        Self::broadcast_event(WebSocketMessage::SystemNotification { message, level })
    }
}