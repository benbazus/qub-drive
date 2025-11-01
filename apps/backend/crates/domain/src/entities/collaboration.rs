use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

/// Real-time collaboration session for documents
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CollaborationSession {
    pub id: Id,
    pub document_id: Id,
    pub participants: Vec<Participant>,
    pub operations: Vec<Operation>,
    pub version: i64,
    pub is_active: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Participant {
    pub user_id: Id,
    pub username: String,
    pub full_name: String,
    pub avatar_url: Option<String>,
    pub cursor_position: Option<CursorPosition>,
    pub selection: Option<TextSelection>,
    pub status: ParticipantStatus,
    pub joined_at: Timestamp,
    pub last_seen_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ParticipantStatus {
    Active,
    Idle,
    Away,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CursorPosition {
    pub line: u32,
    pub column: u32,
    pub offset: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TextSelection {
    pub start: CursorPosition,
    pub end: CursorPosition,
}

/// Operational Transform for real-time editing
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Operation {
    pub id: Id,
    pub session_id: Id,
    pub user_id: Id,
    pub operation_type: OperationType,
    pub position: u32,
    pub content: Option<String>,
    pub length: Option<u32>,
    pub attributes: Option<HashMap<String, serde_json::Value>>,
    pub version: i64,
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum OperationType {
    Insert,
    Delete,
    Retain,
    Format,
    Replace,
}

/// Comments system for documents
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Comment {
    pub id: Id,
    pub document_id: Id,
    pub author_id: Id,
    pub content: String,
    pub anchor: CommentAnchor,
    pub replies: Vec<CommentReply>,
    pub status: CommentStatus,
    pub is_resolved: bool,
    pub resolved_by: Option<Id>,
    pub resolved_at: Option<Timestamp>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CommentAnchor {
    pub anchor_type: AnchorType,
    pub position: u32,
    pub length: Option<u32>,
    pub context: String, // Surrounding text for context
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnchorType {
    Text,
    Cell,
    Slide,
    Element,
    Range,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CommentReply {
    pub id: Id,
    pub author_id: Id,
    pub content: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CommentStatus {
    Open,
    Resolved,
    Deleted,
}

/// Suggestions system for document editing
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Suggestion {
    pub id: Id,
    pub document_id: Id,
    pub author_id: Id,
    pub suggestion_type: SuggestionType,
    pub title: String,
    pub description: Option<String>,
    pub changes: Vec<SuggestedChange>,
    pub status: SuggestionStatus,
    pub reviewers: Vec<SuggestionReviewer>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionType {
    TextEdit,
    Formatting,
    Structure,
    Content,
    Style,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SuggestedChange {
    pub id: Id,
    pub change_type: ChangeType,
    pub position: u32,
    pub length: Option<u32>,
    pub original_content: Option<String>,
    pub suggested_content: Option<String>,
    pub attributes: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChangeType {
    Insert,
    Delete,
    Replace,
    Format,
    Move,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SuggestionReviewer {
    pub user_id: Id,
    pub status: ReviewStatus,
    pub feedback: Option<String>,
    pub reviewed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReviewStatus {
    Pending,
    Approved,
    Rejected,
    RequestChanges,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionStatus {
    Draft,
    Pending,
    Approved,
    Rejected,
    Applied,
    Cancelled,
}

/// Version history for documents
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DocumentVersion {
    pub id: Id,
    pub document_id: Id,
    pub version_number: i64,
    pub title: String,
    pub content_snapshot: String, // Serialized content
    pub changes_summary: String,
    pub author_id: Id,
    pub size: i64,
    pub checksum: String,
    pub is_major_version: bool,
    pub created_at: Timestamp,
}

/// Revision tracking for detailed change history
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Revision {
    pub id: Id,
    pub document_id: Id,
    pub version_id: Id,
    pub author_id: Id,
    pub operations: Vec<Operation>,
    pub summary: String,
    pub created_at: Timestamp,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct CreateCommentRequest {
    #[validate(length(min = 1, max = 1000))]
    pub content: String,
    pub anchor: CommentAnchor,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCommentRequest {
    #[validate(length(min = 1, max = 1000))]
    pub content: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateCommentReplyRequest {
    #[validate(length(min = 1, max = 1000))]
    pub content: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSuggestionRequest {
    pub suggestion_type: SuggestionType,
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub description: Option<String>,
    pub changes: Vec<SuggestedChange>,
    pub reviewers: Vec<Id>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ReviewSuggestionRequest {
    pub status: ReviewStatus,
    pub feedback: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ApplyOperationRequest {
    pub operations: Vec<Operation>,
    pub version: i64,
}

#[derive(Debug, Serialize)]
pub struct CollaborationSessionResponse {
    pub id: Id,
    pub document_id: Id,
    pub participants: Vec<ParticipantResponse>,
    pub version: i64,
    pub is_active: bool,
    pub created_at: Timestamp,
}

#[derive(Debug, Serialize)]
pub struct ParticipantResponse {
    pub user_id: Id,
    pub username: String,
    pub full_name: String,
    pub avatar_url: Option<String>,
    pub status: ParticipantStatus,
    pub joined_at: Timestamp,
    pub last_seen_at: Timestamp,
}

#[derive(Debug, Serialize)]
pub struct CommentResponse {
    pub id: Id,
    pub content: String,
    pub anchor: CommentAnchor,
    pub author: CommentAuthor,
    pub replies: Vec<CommentReplyResponse>,
    pub status: CommentStatus,
    pub is_resolved: bool,
    pub resolved_by: Option<CommentAuthor>,
    pub resolved_at: Option<Timestamp>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommentAuthor {
    pub id: Id,
    pub username: String,
    pub full_name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CommentReplyResponse {
    pub id: Id,
    pub content: String,
    pub author: CommentAuthor,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Serialize)]
pub struct SuggestionResponse {
    pub id: Id,
    pub suggestion_type: SuggestionType,
    pub title: String,
    pub description: Option<String>,
    pub author: CommentAuthor,
    pub changes: Vec<SuggestedChange>,
    pub status: SuggestionStatus,
    pub reviewers: Vec<SuggestionReviewerResponse>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Serialize)]
pub struct SuggestionReviewerResponse {
    pub user: CommentAuthor,
    pub status: ReviewStatus,
    pub feedback: Option<String>,
    pub reviewed_at: Option<Timestamp>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentVersionResponse {
    pub id: Id,
    pub version_number: i64,
    pub title: String,
    pub changes_summary: String,
    pub author: CommentAuthor,
    pub size: i64,
    pub is_major_version: bool,
    pub created_at: Timestamp,
}

impl CollaborationSession {
    pub fn new(document_id: Id) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            participants: Vec::new(),
            operations: Vec::new(),
            version: 1,
            is_active: true,
            created_at: now,
            updated_at: now,
            expires_at: Some(now + chrono::Duration::hours(24)), // 24 hour sessions
        }
    }

    pub fn add_participant(&mut self, user_id: Id, username: String, full_name: String) {
        let now = chrono::Utc::now();
        let participant = Participant {
            user_id,
            username,
            full_name,
            avatar_url: None,
            cursor_position: None,
            selection: None,
            status: ParticipantStatus::Active,
            joined_at: now,
            last_seen_at: now,
        };
        
        // Remove existing participant if present
        self.participants.retain(|p| p.user_id != user_id);
        self.participants.push(participant);
        self.updated_at = now;
    }

    pub fn remove_participant(&mut self, user_id: Id) {
        self.participants.retain(|p| p.user_id != user_id);
        self.updated_at = chrono::Utc::now();
    }

    pub fn apply_operation(&mut self, operation: Operation) -> Result<(), String> {
        // Validate operation version
        if operation.version != self.version {
            return Err("Version mismatch".to_string());
        }

        self.operations.push(operation);
        self.version += 1;
        self.updated_at = chrono::Utc::now();
        Ok(())
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            chrono::Utc::now() > expires_at
        } else {
            false
        }
    }
}

impl Comment {
    pub fn new(document_id: Id, author_id: Id, content: String, anchor: CommentAnchor) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            author_id,
            content,
            anchor,
            replies: Vec::new(),
            status: CommentStatus::Open,
            is_resolved: false,
            resolved_by: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_reply(&mut self, author_id: Id, content: String) {
        let now = chrono::Utc::now();
        let reply = CommentReply {
            id: uuid::Uuid::new_v4(),
            author_id,
            content,
            created_at: now,
            updated_at: now,
        };
        self.replies.push(reply);
        self.updated_at = now;
    }

    pub fn resolve(&mut self, resolved_by: Id) {
        self.is_resolved = true;
        self.resolved_by = Some(resolved_by);
        self.resolved_at = Some(chrono::Utc::now());
        self.status = CommentStatus::Resolved;
        self.updated_at = chrono::Utc::now();
    }

    pub fn reopen(&mut self) {
        self.is_resolved = false;
        self.resolved_by = None;
        self.resolved_at = None;
        self.status = CommentStatus::Open;
        self.updated_at = chrono::Utc::now();
    }
}

impl Suggestion {
    pub fn new(
        document_id: Id,
        author_id: Id,
        suggestion_type: SuggestionType,
        title: String,
        changes: Vec<SuggestedChange>,
        reviewers: Vec<Id>,
    ) -> Self {
        let now = chrono::Utc::now();
        let suggestion_reviewers = reviewers
            .into_iter()
            .map(|user_id| SuggestionReviewer {
                user_id,
                status: ReviewStatus::Pending,
                feedback: None,
                reviewed_at: None,
            })
            .collect();

        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            author_id,
            suggestion_type,
            title,
            description: None,
            changes,
            status: SuggestionStatus::Pending,
            reviewers: suggestion_reviewers,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_review(&mut self, user_id: Id, status: ReviewStatus, feedback: Option<String>) {
        let now = chrono::Utc::now();
        if let Some(reviewer) = self.reviewers.iter_mut().find(|r| r.user_id == user_id) {
            reviewer.status = status;
            reviewer.feedback = feedback;
            reviewer.reviewed_at = Some(now);
            self.updated_at = now;
            
            // Update suggestion status based on reviews
            self.update_status();
        }
    }

    fn update_status(&mut self) {
        let pending_count = self.reviewers.iter().filter(|r| r.status == ReviewStatus::Pending).count();
        let approved_count = self.reviewers.iter().filter(|r| r.status == ReviewStatus::Approved).count();
        let rejected_count = self.reviewers.iter().filter(|r| r.status == ReviewStatus::Rejected).count();

        if pending_count == 0 {
            if rejected_count > 0 {
                self.status = SuggestionStatus::Rejected;
            } else if approved_count == self.reviewers.len() {
                self.status = SuggestionStatus::Approved;
            }
        }
    }

    pub fn apply(&mut self) {
        self.status = SuggestionStatus::Applied;
        self.updated_at = chrono::Utc::now();
    }
}

impl DocumentVersion {
    pub fn new(
        document_id: Id,
        version_number: i64,
        title: String,
        content_snapshot: String,
        changes_summary: String,
        author_id: Id,
    ) -> Self {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        content_snapshot.hash(&mut hasher);
        let checksum = format!("{:x}", hasher.finish());

        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            version_number,
            title,
            content_snapshot: content_snapshot.clone(),
            changes_summary,
            author_id,
            size: content_snapshot.len() as i64,
            checksum,
            is_major_version: version_number % 10 == 0, // Every 10th version is major
            created_at: chrono::Utc::now(),
        }
    }
}