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
    Form, FormResponse as DomainFormResponse, FormSection, FormField, CreateFormRequest,
    UpdateFormRequest, AddFormFieldRequest, SubmitFormResponseRequest, FormAnalyticsQuery,
    FormResponse as FormResponseDto, FormSummaryResponse, FormResponseResponse, FormAnalyticsResponse,
    FormStatus, ResponseStatus, FieldValue, FormsService, FormsRepository,
};

use crate::{
    error::{ApiError, ApiResult},
    middleware::auth::Claims,
    AppState,
};

// Form CRUD endpoints
pub async fn create_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateFormRequest>,
) -> ApiResult<Json<FormResponseDto>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let form = if let Some(template_id) = request.template_id {
        state.forms_service.create_form_from_template(
            uuid::Uuid::new_v4(), // TODO: Get actual document_id
            template_id,
            request.title,
            claims.user_id,
        ).await?
    } else {
        state.forms_service.create_blank_form(
            uuid::Uuid::new_v4(), // TODO: Get actual document_id
            request.title,
            claims.user_id,
        ).await?
    };
    
    Ok(Json(form))
}

pub async fn get_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<FormResponseDto>> {
    let form = state.forms_service.get_form(form_id, claims.user_id).await?
        .ok_or(ApiError::NotFound("Form not found".to_string()))?;
    
    Ok(Json(form))
}

pub async fn update_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<UpdateFormRequest>,
) -> ApiResult<Json<FormResponseDto>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let form = state.forms_service.update_form(form_id, request, claims.user_id).await?;
    Ok(Json(form))
}

pub async fn delete_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.forms_service.delete_form(form_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_forms(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListFormsQuery>,
) -> ApiResult<Json<Vec<FormSummaryResponse>>> {
    let forms = state.forms_repository.get_forms_by_owner(claims.user_id).await?;
    
    let summaries: Vec<FormSummaryResponse> = forms.into_iter()
        .filter(|form| {
            if let Some(status) = &params.status {
                &form.status == status
            } else {
                true
            }
        })
        .map(|form| FormSummaryResponse {
            id: form.id,
            title: form.title,
            description: form.description,
            status: form.status,
            total_responses: form.analytics.total_responses,
            completion_rate: form.analytics.completion_rate,
            created_at: form.created_at,
            updated_at: form.updated_at,
        })
        .collect();
    
    Ok(Json(summaries))
}

// Form building endpoints
pub async fn add_section(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<AddSectionRequest>,
) -> ApiResult<Json<FormSection>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let section = state.forms_service.add_section(
        form_id,
        request.title,
        request.description,
        claims.user_id,
    ).await?;
    
    Ok(Json(section))
}

pub async fn add_field(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<AddFormFieldRequest>,
) -> ApiResult<Json<FormField>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let field = state.forms_service.add_field(form_id, request, claims.user_id).await?;
    Ok(Json(field))
}

pub async fn update_field(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(field_id): Path<String>,
    Json(request): Json<UpdateFieldRequest>,
) -> ApiResult<Json<FormField>> {
    let field = state.forms_service.update_field(&field_id, request.updates, claims.user_id).await?;
    Ok(Json(field))
}

pub async fn delete_field(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(field_id): Path<String>,
) -> ApiResult<StatusCode> {
    state.forms_service.delete_field(&field_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn reorder_elements(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<ReorderElementsRequest>,
) -> ApiResult<StatusCode> {
    state.forms_service.reorder_form_elements(form_id, request.element_order, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Form publishing endpoints
pub async fn publish_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<PublishResponse>> {
    let public_url = state.forms_service.publish_form(form_id, claims.user_id).await?;
    Ok(Json(PublishResponse { public_url }))
}

pub async fn unpublish_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.forms_service.unpublish_form(form_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_embed_code(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<EmbedCodeResponse>> {
    let embed_code = state.forms_service.get_form_embed_code(form_id, claims.user_id).await?;
    Ok(Json(EmbedCodeResponse { embed_code }))
}

pub async fn get_qr_code(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<axum::response::Response> {
    let qr_code_data = state.forms_service.get_form_qr_code(form_id, claims.user_id).await?;
    
    Ok(axum::response::Response::builder()
        .header("Content-Type", "image/png")
        .header("Content-Length", qr_code_data.len())
        .body(axum::body::Body::from(qr_code_data))
        .unwrap())
}

// Response handling endpoints (public)
pub async fn submit_response(
    State(state): State<AppState>,
    Path(form_id): Path<Id>,
    Json(request): Json<SubmitFormResponseRequest>,
) -> ApiResult<Json<SubmitResponseResult>> {
    // This is a public endpoint, no authentication required
    let user_info = None; // TODO: Extract from request headers if available
    
    let response_id = state.forms_service.submit_response(form_id, request, user_info).await?;
    
    Ok(Json(SubmitResponseResult {
        response_id,
        success: true,
        message: "Response submitted successfully".to_string(),
    }))
}

pub async fn save_draft_response(
    State(state): State<AppState>,
    Path(form_id): Path<Id>,
    Json(request): Json<SubmitFormResponseRequest>,
) -> ApiResult<Json<SubmitResponseResult>> {
    // This is a public endpoint, no authentication required
    let user_info = None; // TODO: Extract from request headers if available
    
    let response_id = state.forms_service.save_draft_response(form_id, request, user_info).await?;
    
    Ok(Json(SubmitResponseResult {
        response_id,
        success: true,
        message: "Draft saved successfully".to_string(),
    }))
}

// Response management endpoints (authenticated)
pub async fn get_form_responses(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Query(params): Query<ResponseFiltersQuery>,
) -> ApiResult<Json<kingshare_domain::PaginatedResponses>> {
    let filters = kingshare_domain::ResponseFilters {
        status: params.status,
        start_date: params.start_date,
        end_date: params.end_date,
        search_query: params.search,
        field_filters: HashMap::new(),
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        limit: Some(params.limit.unwrap_or(50)),
        offset: Some(params.offset.unwrap_or(0)),
    };
    
    let responses = state.forms_service.get_form_responses(form_id, filters, claims.user_id).await?;
    Ok(Json(responses))
}

pub async fn get_response(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(response_id): Path<Id>,
) -> ApiResult<Json<FormResponseResponse>> {
    let response = state.forms_service.get_response(response_id, claims.user_id).await?
        .ok_or(ApiError::NotFound("Response not found".to_string()))?;
    
    Ok(Json(response))
}

pub async fn update_response(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(response_id): Path<Id>,
    Json(request): Json<UpdateResponseRequest>,
) -> ApiResult<Json<FormResponseResponse>> {
    let response = state.forms_service.update_response(response_id, request.updates, claims.user_id).await?;
    Ok(Json(response))
}

pub async fn delete_response(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(response_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.forms_service.delete_response(response_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn approve_response(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(response_id): Path<Id>,
) -> ApiResult<StatusCode> {
    state.forms_service.approve_response(response_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn reject_response(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(response_id): Path<Id>,
    Json(request): Json<RejectResponseRequest>,
) -> ApiResult<StatusCode> {
    state.forms_service.reject_response(response_id, request.reason, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Analytics endpoints
pub async fn get_form_analytics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Query(query): Query<FormAnalyticsQuery>,
) -> ApiResult<Json<FormAnalyticsResponse>> {
    let analytics = state.forms_service.get_form_analytics(form_id, query, claims.user_id).await?;
    Ok(Json(analytics))
}

pub async fn get_response_summary(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::ResponseSummary>> {
    let summary = state.forms_service.get_response_summary(form_id, claims.user_id).await?;
    Ok(Json(summary))
}

pub async fn generate_insights(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<Vec<kingshare_domain::FormInsight>>> {
    let insights = state.forms_service.generate_insights(form_id, claims.user_id).await?;
    Ok(Json(insights))
}

// Export endpoints
pub async fn export_responses(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<ExportDataRequest>,
) -> ApiResult<Json<kingshare_domain::ExportResult>> {
    let export_options = kingshare_domain::DataExportOptions {
        format: request.format,
        include_metadata: request.include_metadata.unwrap_or(false),
        include_analytics: request.include_analytics.unwrap_or(false),
        date_range: request.date_range,
        field_selection: request.field_selection,
        response_filters: None,
    };
    
    let result = state.forms_service.export_data(form_id, export_options, claims.user_id).await?;
    Ok(Json(result))
}

// Template endpoints
pub async fn save_as_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<SaveTemplateRequest>,
) -> ApiResult<Json<TemplateResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let template_id = state.forms_service.save_as_template(
        form_id,
        request.template_name,
        request.category,
        claims.user_id,
    ).await?;
    
    Ok(Json(TemplateResponse {
        id: template_id,
        message: "Template saved successfully".to_string(),
    }))
}

pub async fn get_templates(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<TemplatesQuery>,
) -> ApiResult<Json<Vec<kingshare_domain::FormTemplate>>> {
    let templates = state.forms_service.get_available_templates(params.category, claims.user_id).await?;
    Ok(Json(templates))
}

pub async fn preview_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(template_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::FormPreview>> {
    let preview = state.forms_service.preview_template(template_id, claims.user_id).await?;
    Ok(Json(preview))
}

// Advanced features endpoints
pub async fn setup_conditional_logic(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<ConditionalLogicRequest>,
) -> ApiResult<StatusCode> {
    state.forms_service.setup_conditional_logic(form_id, request.logic_rules, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn configure_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<NotificationConfigRequest>,
) -> ApiResult<StatusCode> {
    state.forms_service.configure_notifications(form_id, request.notification_settings, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn setup_integrations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
    Json(request): Json<IntegrationsRequest>,
) -> ApiResult<StatusCode> {
    state.forms_service.setup_integrations(form_id, request.integrations, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Performance and optimization endpoints
pub async fn optimize_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::OptimizationReport>> {
    let report = state.forms_service.optimize_form_performance(form_id, claims.user_id).await?;
    Ok(Json(report))
}

pub async fn validate_form(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::ValidationReport>> {
    let report = state.forms_service.validate_form_structure(form_id, claims.user_id).await?;
    Ok(Json(report))
}

pub async fn get_health_score(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(form_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::HealthScore>> {
    let score = state.forms_service.get_form_health_score(form_id, claims.user_id).await?;
    Ok(Json(score))
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct ListFormsQuery {
    pub status: Option<FormStatus>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AddSectionRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFieldRequest {
    pub updates: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderElementsRequest {
    pub element_order: Vec<kingshare_domain::ElementOrder>,
}

#[derive(Debug, Serialize)]
pub struct PublishResponse {
    pub public_url: String,
}

#[derive(Debug, Serialize)]
pub struct EmbedCodeResponse {
    pub embed_code: String,
}

#[derive(Debug, Serialize)]
pub struct SubmitResponseResult {
    pub response_id: Id,
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct ResponseFiltersQuery {
    pub status: Option<ResponseStatus>,
    pub start_date: Option<chrono::DateTime<chrono::Utc>>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateResponseRequest {
    pub updates: HashMap<String, FieldValue>,
}

#[derive(Debug, Deserialize)]
pub struct RejectResponseRequest {
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct ExportDataRequest {
    pub format: kingshare_domain::ExportFormat,
    pub include_metadata: Option<bool>,
    pub include_analytics: Option<bool>,
    pub date_range: Option<(chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>,
    pub field_selection: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SaveTemplateRequest {
    #[validate(length(min = 1, max = 255))]
    pub template_name: String,
    #[validate(length(min = 1, max = 100))]
    pub category: String,
}

#[derive(Debug, Serialize)]
pub struct TemplateResponse {
    pub id: Id,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct TemplatesQuery {
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ConditionalLogicRequest {
    pub logic_rules: Vec<kingshare_domain::ConditionalLogicRule>,
}

#[derive(Debug, Deserialize)]
pub struct NotificationConfigRequest {
    pub notification_settings: kingshare_domain::NotificationSettings,
}

#[derive(Debug, Deserialize)]
pub struct IntegrationsRequest {
    pub integrations: Vec<kingshare_domain::IntegrationConfig>,
}