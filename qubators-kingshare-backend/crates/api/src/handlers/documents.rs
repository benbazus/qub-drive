use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

use kingshare_core::{Id, Result as CoreResult};
use kingshare_domain::{
    Document, DocumentType, DocumentContent, CreateDocumentRequest, UpdateDocumentRequest,
    DocumentSummary, DocumentRepository, CollaborationService, CollaborationSessionResponse,
    CreateCommentRequest, CreateCommentReplyRequest, UpdateCommentRequest, CommentResponse,
    CreateSuggestionRequest, ReviewSuggestionRequest, SuggestionResponse, DocumentVersionResponse,
};

use crate::{
    error::{ApiError, ApiResult},
    middleware::auth::Claims,
    AppState,
};

// Document CRUD endpoints
pub async fn create_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateDocumentRequest>,
) -> ApiResult<Json<Document>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let document = Document::new(
        claims.user_id,
        request.title,
        request.document_type,
        request.content,
    );
    
    let created_document = state.document_repository.create_document(document).await?;
    Ok(Json(created_document))
}

pub async fn get_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<Document>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    // Update last accessed time
    let _ = state.document_repository.update_access_time(document_id, claims.user_id).await;

    Ok(Json(document))
}

pub async fn update_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<UpdateDocumentRequest>,
) -> ApiResult<Json<Document>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let mut document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_edit(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    // Apply updates
    if let Some(title) = request.title {
        document.title = title;
    }
    if let Some(content) = request.content {
        document.update_content(content);
    }
    if let Some(metadata) = request.metadata {
        document.metadata = metadata;
    }
    if let Some(permissions) = request.permissions {
        document.permissions = permissions;
    }
    if let Some(is_public) = request.is_public {
        document.is_public = is_public;
    }

    document.updated_at = chrono::Utc::now();
    let updated_document = state.document_repository.update_document(document).await?;

    Ok(Json(updated_document))
}

pub async fn delete_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if document.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.document_repository.delete_document(document_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_documents(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListDocumentsQuery>,
) -> ApiResult<Json<Vec<DocumentSummary>>> {
    let documents = if let Some(doc_type) = params.document_type {
        state.document_repository.get_documents_by_type(claims.user_id, doc_type).await?
    } else {
        state.document_repository.get_documents_by_owner(claims.user_id).await?
    };

    let summaries: Vec<DocumentSummary> = documents.into_iter()
        .map(|doc| DocumentSummary {
            id: doc.id,
            title: doc.title,
            document_type: doc.document_type,
            owner: kingshare_domain::DocumentOwner {
                id: doc.owner_id,
                username: "".to_string(), // TODO: fetch from user service
                full_name: "".to_string(),
                email: "".to_string(),
            },
            permissions: doc.permissions,
            version: doc.version,
            is_public: doc.is_public,
            is_template: doc.is_template,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            last_accessed_at: doc.last_accessed_at,
            metadata: doc.metadata,
        })
        .collect();

    Ok(Json(summaries))
}

// Collaboration endpoints
pub async fn start_collaboration(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<CollaborationSessionResponse>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let session = state.collaboration_service.start_collaboration_session(document_id, claims.user_id).await?;
    Ok(Json(session))
}

pub async fn join_collaboration(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<CollaborationSessionResponse>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    // TODO: Get user details from user service
    let session = state.collaboration_service.join_collaboration_session(
        document_id,
        claims.user_id,
        claims.username.clone(),
        "User Name".to_string(), // TODO: fetch real name
    ).await?;
    
    Ok(Json(session))
}

pub async fn leave_collaboration(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.collaboration_service.leave_collaboration_session(document_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn apply_operations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<ApplyOperationsRequest>,
) -> ApiResult<Json<OperationResponse>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_edit(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let new_version = state.collaboration_service.apply_text_operation(
        document_id,
        claims.user_id,
        request.operations,
    ).await?;

    Ok(Json(OperationResponse { version: new_version }))
}

pub async fn get_pending_operations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Query(params): Query<OperationsQuery>,
) -> ApiResult<Json<Vec<kingshare_domain::Operation>>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let operations = state.collaboration_service.get_pending_operations(
        document_id,
        params.since_version,
    ).await?;

    Ok(Json(operations))
}

// Comments endpoints
pub async fn add_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<CreateCommentRequest>,
) -> ApiResult<Json<CommentResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_comment(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let comment = state.collaboration_service.add_comment(document_id, claims.user_id, request).await?;
    Ok(Json(comment))
}

pub async fn get_comments(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<Vec<CommentResponse>>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let comments = state.collaboration_service.get_document_comments(document_id, claims.user_id).await?;
    Ok(Json(comments))
}

pub async fn reply_to_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(comment_id): Path<Id>,
    Json(request): Json<CreateCommentReplyRequest>,
) -> ApiResult<Json<ReplyResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let reply_id = state.collaboration_service.reply_to_comment(comment_id, claims.user_id, request).await?;
    Ok(Json(ReplyResponse { id: reply_id }))
}

pub async fn update_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(comment_id): Path<Id>,
    Json(request): Json<UpdateCommentRequest>,
) -> ApiResult<Json<CommentResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let comment = state.collaboration_service.update_comment(comment_id, claims.user_id, request).await?;
    Ok(Json(comment))
}

pub async fn resolve_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(comment_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.collaboration_service.resolve_comment(comment_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Suggestions endpoints
pub async fn create_suggestion(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<CreateSuggestionRequest>,
) -> ApiResult<Json<SuggestionResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_edit(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let suggestion = state.collaboration_service.create_suggestion(document_id, claims.user_id, request).await?;
    Ok(Json(suggestion))
}

pub async fn get_suggestions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<Vec<SuggestionResponse>>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let suggestions = state.collaboration_service.get_document_suggestions(document_id, claims.user_id).await?;
    Ok(Json(suggestions))
}

pub async fn review_suggestion(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(suggestion_id): Path<Id>,
    Json(request): Json<ReviewSuggestionRequest>,
) -> ApiResult<StatusCode> {
    state.collaboration_service.review_suggestion(suggestion_id, claims.user_id, request).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn apply_suggestion(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(suggestion_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.collaboration_service.apply_suggestion(suggestion_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_pending_reviews(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Json<Vec<SuggestionResponse>>> {
    let suggestions = state.collaboration_service.get_pending_reviews(claims.user_id).await?;
    Ok(Json(suggestions))
}

// Version history endpoints
pub async fn create_version(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<CreateVersionRequest>,
) -> ApiResult<Json<DocumentVersionResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_edit(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let version = state.collaboration_service.create_document_version(
        document_id,
        claims.user_id,
        request.changes_summary,
    ).await?;
    
    Ok(Json(version))
}

pub async fn get_versions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
) -> ApiResult<Json<Vec<DocumentVersionResponse>>> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_view(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    let versions = state.collaboration_service.get_document_versions(document_id, claims.user_id).await?;
    Ok(Json(versions))
}

pub async fn restore_version(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((document_id, version_id)): Path<(Id, Id)>,
) -> ApiResult<StatusCode> {
    let document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if !document.can_user_edit(claims.user_id) {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    state.collaboration_service.restore_document_version(document_id, version_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Template endpoints
pub async fn save_as_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(document_id): Path<Id>,
    Json(request): Json<SaveTemplateRequest>,
) -> ApiResult<Json<TemplateResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let mut document = state.document_repository.get_document_by_id(document_id).await?
        .ok_or(ApiError::NotFound("Document not found".to_string()))?;
    
    if document.owner_id != claims.user_id {
        return Err(ApiError::Forbidden("Access denied".to_string()));
    }

    document.is_template = true;
    document.title = request.template_name;
    if let Some(description) = request.description {
        document.metadata.description = Some(description);
    }

    let updated_document = state.document_repository.update_document(document).await?;
    
    Ok(Json(TemplateResponse {
        id: updated_document.id,
        name: updated_document.title,
        document_type: updated_document.document_type,
        created_at: updated_document.created_at,
    }))
}

pub async fn get_templates(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Query(params): Query<TemplatesQuery>,
) -> ApiResult<Json<Vec<TemplateResponse>>> {
    let templates = if let Some(doc_type) = params.document_type {
        state.document_repository.get_templates_by_type(doc_type).await?
    } else {
        state.document_repository.get_public_templates().await?
    };

    let template_responses: Vec<TemplateResponse> = templates.into_iter()
        .map(|doc| TemplateResponse {
            id: doc.id,
            name: doc.title,
            document_type: doc.document_type,
            created_at: doc.created_at,
        })
        .collect();

    Ok(Json(template_responses))
}

pub async fn create_from_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(template_id): Path<Id>,
    Json(request): Json<CreateFromTemplateRequest>,
) -> ApiResult<Json<Document>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let template = state.document_repository.get_document_by_id(template_id).await?
        .ok_or(ApiError::NotFound("Template not found".to_string()))?;
    
    if !template.is_template {
        return Err(ApiError::BadRequest("Document is not a template".to_string()));
    }

    let mut new_document = template.clone();
    new_document.id = uuid::Uuid::new_v4();
    new_document.owner_id = claims.user_id;
    new_document.title = request.title;
    new_document.is_template = false;
    new_document.is_public = false;
    new_document.version = 1;
    new_document.created_at = chrono::Utc::now();
    new_document.updated_at = chrono::Utc::now();
    new_document.last_accessed_at = None;

    let created_document = state.document_repository.create_document(new_document).await?;
    Ok(Json(created_document))
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct ListDocumentsQuery {
    pub document_type: Option<DocumentType>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct ApplyOperationsRequest {
    pub operations: Vec<kingshare_domain::Operation>,
}

#[derive(Debug, Serialize)]
pub struct OperationResponse {
    pub version: i64,
}

#[derive(Debug, Deserialize)]
pub struct OperationsQuery {
    pub since_version: i64,
}

#[derive(Debug, Serialize)]
pub struct ReplyResponse {
    pub id: Id,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateVersionRequest {
    #[validate(length(min = 1, max = 500))]
    pub changes_summary: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SaveTemplateRequest {
    #[validate(length(min = 1, max = 255))]
    pub template_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TemplateResponse {
    pub id: Id,
    pub name: String,
    pub document_type: DocumentType,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct TemplatesQuery {
    pub document_type: Option<DocumentType>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateFromTemplateRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
}