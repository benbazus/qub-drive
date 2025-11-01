use crate::entities::{
    CollaborationSession, Comment, Suggestion, DocumentVersion, Revision, Operation,
    CreateCommentRequest, UpdateCommentRequest, CreateCommentReplyRequest,
    CreateSuggestionRequest, ReviewSuggestionRequest, ApplyOperationRequest,
    CollaborationSessionResponse, CommentResponse, SuggestionResponse, DocumentVersionResponse,
    ParticipantStatus, SuggestionStatus, ReviewStatus,
};
use kingshare_core::{Id, Result};

#[async_trait::async_trait]
pub trait CollaborationRepository: Send + Sync {
    // Collaboration sessions
    async fn create_session(&self, session: CollaborationSession) -> Result<CollaborationSession>;
    async fn get_session_by_id(&self, session_id: Id) -> Result<Option<CollaborationSession>>;
    async fn get_session_by_document(&self, document_id: Id) -> Result<Option<CollaborationSession>>;
    async fn update_session(&self, session: CollaborationSession) -> Result<CollaborationSession>;
    async fn delete_session(&self, session_id: Id) -> Result<()>;
    async fn cleanup_expired_sessions(&self) -> Result<u32>;

    // Participants
    async fn add_participant(&self, session_id: Id, user_id: Id, username: String, full_name: String) -> Result<()>;
    async fn remove_participant(&self, session_id: Id, user_id: Id) -> Result<()>;
    async fn update_participant_status(&self, session_id: Id, user_id: Id, status: ParticipantStatus) -> Result<()>;
    async fn update_participant_cursor(&self, session_id: Id, user_id: Id, line: u32, column: u32) -> Result<()>;
    async fn get_active_participants(&self, session_id: Id) -> Result<Vec<Id>>;

    // Operations (Operational Transform)
    async fn apply_operation(&self, session_id: Id, operation: Operation) -> Result<i64>; // returns new version
    async fn get_operations_since_version(&self, session_id: Id, version: i64) -> Result<Vec<Operation>>;
    async fn get_operations_by_user(&self, session_id: Id, user_id: Id, limit: Option<u32>) -> Result<Vec<Operation>>;

    // Comments
    async fn create_comment(&self, comment: Comment) -> Result<Comment>;
    async fn get_comment_by_id(&self, comment_id: Id) -> Result<Option<Comment>>;
    async fn get_comments_by_document(&self, document_id: Id) -> Result<Vec<Comment>>;
    async fn update_comment(&self, comment: Comment) -> Result<Comment>;
    async fn delete_comment(&self, comment_id: Id) -> Result<()>;
    async fn resolve_comment(&self, comment_id: Id, resolved_by: Id) -> Result<()>;
    async fn reopen_comment(&self, comment_id: Id) -> Result<()>;

    // Comment replies
    async fn add_comment_reply(&self, comment_id: Id, author_id: Id, content: String) -> Result<Id>;
    async fn update_comment_reply(&self, reply_id: Id, content: String) -> Result<()>;
    async fn delete_comment_reply(&self, reply_id: Id) -> Result<()>;

    // Suggestions
    async fn create_suggestion(&self, suggestion: Suggestion) -> Result<Suggestion>;
    async fn get_suggestion_by_id(&self, suggestion_id: Id) -> Result<Option<Suggestion>>;
    async fn get_suggestions_by_document(&self, document_id: Id) -> Result<Vec<Suggestion>>;
    async fn get_suggestions_by_author(&self, author_id: Id) -> Result<Vec<Suggestion>>;
    async fn get_pending_suggestions_for_user(&self, user_id: Id) -> Result<Vec<Suggestion>>;
    async fn update_suggestion(&self, suggestion: Suggestion) -> Result<Suggestion>;
    async fn delete_suggestion(&self, suggestion_id: Id) -> Result<()>;

    // Suggestion reviews
    async fn add_suggestion_review(&self, suggestion_id: Id, user_id: Id, status: ReviewStatus, feedback: Option<String>) -> Result<()>;
    async fn get_suggestion_reviews(&self, suggestion_id: Id) -> Result<Vec<(Id, ReviewStatus, Option<String>)>>;
    async fn apply_suggestion(&self, suggestion_id: Id) -> Result<()>;
    async fn reject_suggestion(&self, suggestion_id: Id, reason: Option<String>) -> Result<()>;

    // Version history
    async fn create_version(&self, version: DocumentVersion) -> Result<DocumentVersion>;
    async fn get_version_by_id(&self, version_id: Id) -> Result<Option<DocumentVersion>>;
    async fn get_versions_by_document(&self, document_id: Id, limit: Option<u32>) -> Result<Vec<DocumentVersion>>;
    async fn get_latest_version(&self, document_id: Id) -> Result<Option<DocumentVersion>>;
    async fn delete_old_versions(&self, document_id: Id, keep_count: u32) -> Result<u32>;

    // Revisions
    async fn create_revision(&self, revision: Revision) -> Result<Revision>;
    async fn get_revisions_by_version(&self, version_id: Id) -> Result<Vec<Revision>>;
    async fn get_revisions_by_author(&self, document_id: Id, author_id: Id) -> Result<Vec<Revision>>;

    // Analytics and metrics
    async fn get_collaboration_metrics(&self, document_id: Id) -> Result<CollaborationMetrics>;
    async fn get_user_collaboration_stats(&self, user_id: Id) -> Result<UserCollaborationStats>;
    async fn get_document_activity_timeline(&self, document_id: Id, limit: Option<u32>) -> Result<Vec<ActivityEvent>>;
}

#[async_trait::async_trait]
pub trait CollaborationService: Send + Sync {
    // Session management
    async fn start_collaboration_session(&self, document_id: Id, user_id: Id) -> Result<CollaborationSessionResponse>;
    async fn join_collaboration_session(&self, document_id: Id, user_id: Id, username: String, full_name: String) -> Result<CollaborationSessionResponse>;
    async fn leave_collaboration_session(&self, document_id: Id, user_id: Id) -> Result<()>;
    async fn get_active_session(&self, document_id: Id) -> Result<Option<CollaborationSessionResponse>>;

    // Real-time operations
    async fn apply_text_operation(&self, document_id: Id, user_id: Id, operations: Vec<Operation>) -> Result<i64>;
    async fn get_pending_operations(&self, document_id: Id, since_version: i64) -> Result<Vec<Operation>>;
    async fn update_cursor_position(&self, document_id: Id, user_id: Id, line: u32, column: u32) -> Result<()>;

    // Comments
    async fn add_comment(&self, document_id: Id, user_id: Id, request: CreateCommentRequest) -> Result<CommentResponse>;
    async fn reply_to_comment(&self, comment_id: Id, user_id: Id, request: CreateCommentReplyRequest) -> Result<Id>;
    async fn update_comment(&self, comment_id: Id, user_id: Id, request: UpdateCommentRequest) -> Result<CommentResponse>;
    async fn resolve_comment(&self, comment_id: Id, user_id: Id) -> Result<()>;
    async fn get_document_comments(&self, document_id: Id, user_id: Id) -> Result<Vec<CommentResponse>>;

    // Suggestions
    async fn create_suggestion(&self, document_id: Id, user_id: Id, request: CreateSuggestionRequest) -> Result<SuggestionResponse>;
    async fn review_suggestion(&self, suggestion_id: Id, user_id: Id, request: ReviewSuggestionRequest) -> Result<()>;
    async fn apply_suggestion(&self, suggestion_id: Id, user_id: Id) -> Result<()>;
    async fn get_document_suggestions(&self, document_id: Id, user_id: Id) -> Result<Vec<SuggestionResponse>>;
    async fn get_pending_reviews(&self, user_id: Id) -> Result<Vec<SuggestionResponse>>;

    // Version control
    async fn create_document_version(&self, document_id: Id, user_id: Id, changes_summary: String) -> Result<DocumentVersionResponse>;
    async fn get_document_versions(&self, document_id: Id, user_id: Id) -> Result<Vec<DocumentVersionResponse>>;
    async fn restore_document_version(&self, document_id: Id, version_id: Id, user_id: Id) -> Result<()>;
    async fn compare_versions(&self, document_id: Id, version1_id: Id, version2_id: Id, user_id: Id) -> Result<VersionComparison>;

    // Conflict resolution
    async fn resolve_merge_conflict(&self, document_id: Id, user_id: Id, resolution: ConflictResolution) -> Result<()>;
    async fn get_pending_conflicts(&self, document_id: Id) -> Result<Vec<MergeConflict>>;

    // Notifications
    async fn notify_collaborators(&self, document_id: Id, event: CollaborationEvent, exclude_user: Option<Id>) -> Result<()>;
    async fn get_collaboration_notifications(&self, user_id: Id) -> Result<Vec<CollaborationNotification>>;
}

// Supporting types for collaboration
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CollaborationMetrics {
    pub total_sessions: i64,
    pub active_collaborators: i64,
    pub total_comments: i64,
    pub total_suggestions: i64,
    pub average_session_duration: Option<u32>,
    pub most_active_collaborators: Vec<(Id, String, i64)>, // (user_id, name, activity_count)
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct UserCollaborationStats {
    pub total_sessions_joined: i64,
    pub total_comments_made: i64,
    pub total_suggestions_made: i64,
    pub total_suggestions_reviewed: i64,
    pub average_response_time: Option<u32>, // seconds
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ActivityEvent {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub user_id: Id,
    pub user_name: String,
    pub event_type: String,
    pub description: String,
    pub metadata: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct VersionComparison {
    pub version1: DocumentVersionResponse,
    pub version2: DocumentVersionResponse,
    pub differences: Vec<TextDifference>,
    pub similarity_score: f64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TextDifference {
    pub diff_type: DifferenceType,
    pub position: u32,
    pub length: u32,
    pub old_text: Option<String>,
    pub new_text: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum DifferenceType {
    Insert,
    Delete,
    Replace,
    Move,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ConflictResolution {
    pub conflict_id: Id,
    pub resolution_type: ResolutionType,
    pub resolved_content: String,
    pub merge_strategy: MergeStrategy,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ResolutionType {
    AcceptCurrent,
    AcceptIncoming,
    Manual,
    Merge,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum MergeStrategy {
    Automatic,
    Manual,
    ThreeWay,
    TwoWay,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct MergeConflict {
    pub id: Id,
    pub document_id: Id,
    pub position: u32,
    pub current_content: String,
    pub incoming_content: String,
    pub base_content: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CollaborationEvent {
    pub event_type: CollaborationEventType,
    pub document_id: Id,
    pub user_id: Id,
    pub user_name: String,
    pub metadata: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum CollaborationEventType {
    UserJoined,
    UserLeft,
    CommentAdded,
    CommentResolved,
    SuggestionMade,
    SuggestionApproved,
    SuggestionRejected,
    DocumentEdited,
    VersionCreated,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CollaborationNotification {
    pub id: Id,
    pub user_id: Id,
    pub document_id: Id,
    pub document_title: String,
    pub notification_type: CollaborationEventType,
    pub message: String,
    pub is_read: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}