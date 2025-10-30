use crate::entities::forms::{
    Form, FormResponse, FormSection, FormAnalytics, ResponseTrend, FieldAnalytics,
    CreateFormRequest, UpdateFormRequest, AddFormFieldRequest, SubmitFormResponseRequest,
    FormAnalyticsQuery, FormDto, FormSummaryResponse, FormResponseResponse,
    FormAnalyticsResponse, FormStatus, ResponseStatus, FieldValue, Workflow, Integration,
    FormField as FormsFormField,
};
use kingshare_core::{Id, Result};
use std::collections::HashMap;

#[async_trait::async_trait]
pub trait FormsRepository: Send + Sync {
    // Form management
    async fn create_form(&self, form: Form) -> Result<Form>;
    async fn get_form_by_id(&self, form_id: Id) -> Result<Option<Form>>;
    async fn get_form_by_document(&self, document_id: Id) -> Result<Option<Form>>;
    async fn get_forms_by_owner(&self, owner_id: Id) -> Result<Vec<Form>>;
    async fn update_form(&self, form: Form) -> Result<Form>;
    async fn delete_form(&self, form_id: Id) -> Result<()>;
    async fn publish_form(&self, form_id: Id) -> Result<()>;
    async fn unpublish_form(&self, form_id: Id) -> Result<()>;

    // Form sections and fields
    async fn add_form_section(&self, form_id: Id, section: FormSection) -> Result<FormSection>;
    async fn update_form_section(&self, section: FormSection) -> Result<FormSection>;
    async fn delete_form_section(&self, section_id: &str) -> Result<()>;
    async fn reorder_sections(&self, form_id: Id, section_order: Vec<String>) -> Result<()>;

    async fn add_form_field(&self, section_id: &str, field: FormsFormField) -> Result<FormsFormField>;
    async fn update_form_field(&self, field: FormsFormField) -> Result<FormsFormField>;
    async fn delete_form_field(&self, field_id: &str) -> Result<()>;
    async fn reorder_fields(&self, section_id: &str, field_order: Vec<String>) -> Result<()>;

    // Form responses
    async fn create_response(&self, response: FormResponse) -> Result<FormResponse>;
    async fn get_response_by_id(&self, response_id: Id) -> Result<Option<FormResponse>>;
    async fn get_responses_by_form(&self, form_id: Id, limit: Option<u32>, offset: Option<u32>) -> Result<Vec<FormResponse>>;
    async fn get_responses_by_user(&self, user_id: Id) -> Result<Vec<FormResponse>>;
    async fn update_response(&self, response: FormResponse) -> Result<FormResponse>;
    async fn delete_response(&self, response_id: Id) -> Result<()>;
    async fn submit_response(&self, response_id: Id) -> Result<()>;

    // Response filtering and search
    async fn search_responses(&self, form_id: Id, filters: HashMap<String, String>, limit: Option<u32>) -> Result<Vec<FormResponse>>;
    async fn get_responses_by_status(&self, form_id: Id, status: ResponseStatus) -> Result<Vec<FormResponse>>;
    async fn get_responses_by_date_range(&self, form_id: Id, start_date: chrono::DateTime<chrono::Utc>, end_date: chrono::DateTime<chrono::Utc>) -> Result<Vec<FormResponse>>;

    // Analytics and reporting
    async fn get_form_analytics(&self, form_id: Id) -> Result<FormAnalytics>;
    async fn get_response_trends(&self, form_id: Id, start_date: chrono::DateTime<chrono::Utc>, end_date: chrono::DateTime<chrono::Utc>, group_by: &str) -> Result<Vec<ResponseTrend>>;
    async fn get_field_analytics(&self, form_id: Id, field_id: &str) -> Result<Option<FieldAnalytics>>;
    async fn get_completion_funnel(&self, form_id: Id) -> Result<Vec<FunnelStep>>;
    async fn get_abandonment_analysis(&self, form_id: Id) -> Result<AbandonmentAnalysis>;

    // Form templates
    async fn create_template(&self, form_id: Id, template_name: String, description: Option<String>) -> Result<Id>;
    async fn get_templates(&self, category: Option<String>) -> Result<Vec<FormTemplate>>;
    async fn get_template_by_id(&self, template_id: Id) -> Result<Option<FormTemplate>>;
    async fn create_form_from_template(&self, template_id: Id, owner_id: Id, title: String) -> Result<Form>;

    // Workflows and automation
    async fn create_workflow(&self, form_id: Id, workflow: Workflow) -> Result<Workflow>;
    async fn get_workflows_by_form(&self, form_id: Id) -> Result<Vec<Workflow>>;
    async fn update_workflow(&self, workflow: Workflow) -> Result<Workflow>;
    async fn delete_workflow(&self, workflow_id: &str) -> Result<()>;
    async fn trigger_workflow(&self, workflow_id: &str, response_id: Id) -> Result<()>;

    // Integrations
    async fn create_integration(&self, form_id: Id, integration: Integration) -> Result<Integration>;
    async fn get_integrations_by_form(&self, form_id: Id) -> Result<Vec<Integration>>;
    async fn update_integration(&self, integration: Integration) -> Result<Integration>;
    async fn delete_integration(&self, integration_id: &str) -> Result<()>;
    async fn test_integration(&self, integration_id: &str) -> Result<IntegrationTestResult>;

    // Data export
    async fn export_responses(&self, form_id: Id, format: ExportFormat, filters: Option<HashMap<String, String>>) -> Result<ExportResult>;
    async fn export_analytics(&self, form_id: Id, format: ExportFormat) -> Result<ExportResult>;

    // Collaboration and sharing
    async fn share_form(&self, form_id: Id, share_settings: FormShareSettings) -> Result<()>;
    async fn get_form_collaborators(&self, form_id: Id) -> Result<Vec<FormCollaborator>>;
    async fn update_collaborator_permissions(&self, form_id: Id, user_id: Id, permissions: FormPermissions) -> Result<()>;
    async fn remove_collaborator(&self, form_id: Id, user_id: Id) -> Result<()>;

    // Form versioning
    async fn create_form_version(&self, form_id: Id, version_name: String, changes_summary: String) -> Result<Id>;
    async fn get_form_versions(&self, form_id: Id) -> Result<Vec<FormVersion>>;
    async fn restore_form_version(&self, form_id: Id, version_id: Id) -> Result<()>;
    async fn compare_form_versions(&self, version1_id: Id, version2_id: Id) -> Result<FormVersionComparison>;

    // Bulk operations
    async fn bulk_update_responses(&self, response_ids: Vec<Id>, updates: HashMap<String, FieldValue>) -> Result<u32>;
    async fn bulk_delete_responses(&self, response_ids: Vec<Id>) -> Result<u32>;
    async fn bulk_export_forms(&self, form_ids: Vec<Id>, format: ExportFormat) -> Result<ExportResult>;
}

#[async_trait::async_trait]
pub trait FormsService: Send + Sync {
    // Form lifecycle management
    async fn create_blank_form(&self, document_id: Id, title: String, user_id: Id) -> Result<FormDto>;
    async fn create_form_from_template(&self, document_id: Id, template_id: Id, title: String, user_id: Id) -> Result<FormDto>;
    async fn duplicate_form(&self, form_id: Id, new_title: String, user_id: Id) -> Result<FormDto>;
    async fn get_form(&self, form_id: Id, user_id: Id) -> Result<Option<FormDto>>;
    async fn update_form(&self, form_id: Id, request: UpdateFormRequest, user_id: Id) -> Result<FormDto>;
    async fn delete_form(&self, form_id: Id, user_id: Id) -> Result<()>;

    // Form building
    async fn add_section(&self, form_id: Id, title: String, description: Option<String>, user_id: Id) -> Result<FormSection>;
    async fn add_field(&self, form_id: Id, request: AddFormFieldRequest, user_id: Id) -> Result<FormsFormField>;
    async fn update_field(&self, field_id: &str, updates: HashMap<String, serde_json::Value>, user_id: Id) -> Result<FormsFormField>;
    async fn delete_field(&self, field_id: &str, user_id: Id) -> Result<()>;
    async fn reorder_form_elements(&self, form_id: Id, element_order: Vec<ElementOrder>, user_id: Id) -> Result<()>;

    // Form publishing and distribution
    async fn publish_form(&self, form_id: Id, user_id: Id) -> Result<String>; // returns public URL
    async fn unpublish_form(&self, form_id: Id, user_id: Id) -> Result<()>;
    async fn get_form_embed_code(&self, form_id: Id, user_id: Id) -> Result<String>;
    async fn get_form_qr_code(&self, form_id: Id, user_id: Id) -> Result<Vec<u8>>; // QR code image

    // Response handling
    async fn submit_response(&self, form_id: Id, request: SubmitFormResponseRequest, user_info: Option<ResponseUserInfo>) -> Result<Id>;
    async fn save_draft_response(&self, form_id: Id, request: SubmitFormResponseRequest, user_info: Option<ResponseUserInfo>) -> Result<Id>;
    async fn get_response(&self, response_id: Id, user_id: Id) -> Result<Option<FormResponseResponse>>;
    async fn update_response(&self, response_id: Id, updates: HashMap<String, FieldValue>, user_id: Id) -> Result<FormResponseResponse>;
    async fn delete_response(&self, response_id: Id, user_id: Id) -> Result<()>;

    // Response management
    async fn get_form_responses(&self, form_id: Id, filters: ResponseFilters, user_id: Id) -> Result<PaginatedResponses>;
    async fn approve_response(&self, response_id: Id, user_id: Id) -> Result<()>;
    async fn reject_response(&self, response_id: Id, reason: String, user_id: Id) -> Result<()>;
    async fn flag_response(&self, response_id: Id, reason: String, user_id: Id) -> Result<()>;

    // Analytics and insights
    async fn get_form_analytics(&self, form_id: Id, query: FormAnalyticsQuery, user_id: Id) -> Result<FormAnalyticsResponse>;
    async fn get_response_summary(&self, form_id: Id, user_id: Id) -> Result<ResponseSummary>;
    async fn generate_insights(&self, form_id: Id, user_id: Id) -> Result<Vec<FormInsight>>;
    async fn export_data(&self, form_id: Id, export_options: DataExportOptions, user_id: Id) -> Result<ExportResult>;

    // Advanced features
    async fn setup_conditional_logic(&self, form_id: Id, logic_rules: Vec<ConditionalLogicRule>, user_id: Id) -> Result<()>;
    async fn configure_notifications(&self, form_id: Id, notification_settings: NotificationSettings, user_id: Id) -> Result<()>;
    async fn setup_integrations(&self, form_id: Id, integrations: Vec<IntegrationConfig>, user_id: Id) -> Result<()>;
    async fn create_workflow(&self, form_id: Id, workflow_config: WorkflowConfig, user_id: Id) -> Result<Workflow>;

    // Collaboration
    async fn share_form_with_users(&self, form_id: Id, user_ids: Vec<Id>, permissions: FormPermissions, user_id: Id) -> Result<()>;
    async fn add_form_comment(&self, form_id: Id, comment: String, user_id: Id) -> Result<Id>;
    async fn get_form_activity(&self, form_id: Id, user_id: Id) -> Result<Vec<FormActivity>>;

    // Templates and reusability
    async fn save_as_template(&self, form_id: Id, template_name: String, category: String, user_id: Id) -> Result<Id>;
    async fn get_available_templates(&self, category: Option<String>, user_id: Id) -> Result<Vec<FormTemplate>>;
    async fn preview_template(&self, template_id: Id, user_id: Id) -> Result<FormPreview>;

    // Performance and optimization
    async fn optimize_form_performance(&self, form_id: Id, user_id: Id) -> Result<OptimizationReport>;
    async fn validate_form_structure(&self, form_id: Id, user_id: Id) -> Result<ValidationReport>;
    async fn get_form_health_score(&self, form_id: Id, user_id: Id) -> Result<HealthScore>;
}

// Supporting types for forms operations
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FunnelStep {
    pub step_name: String,
    pub field_id: Option<String>,
    pub visitors: i64,
    pub completions: i64,
    pub completion_rate: f64,
    pub drop_off_rate: f64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AbandonmentAnalysis {
    pub total_starts: i64,
    pub total_completions: i64,
    pub overall_abandonment_rate: f64,
    pub abandonment_points: Vec<AbandonmentPoint>,
    pub common_exit_patterns: Vec<ExitPattern>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AbandonmentPoint {
    pub field_id: String,
    pub field_label: String,
    pub abandonment_count: i64,
    pub abandonment_rate: f64,
    pub average_time_spent: Option<u32>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExitPattern {
    pub pattern: String,
    pub frequency: i64,
    pub description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormTemplate {
    pub id: Id,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub preview_image_url: Option<String>,
    pub usage_count: i64,
    pub rating: Option<f64>,
    pub created_by: Id,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub tags: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct IntegrationTestResult {
    pub success: bool,
    pub message: String,
    pub response_time_ms: u32,
    pub test_data: Option<serde_json::Value>,
    pub errors: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ExportFormat {
    Csv,
    Excel,
    Json,
    Pdf,
    Html,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub file_url: String,
    pub filename: String,
    pub file_size: u64,
    pub record_count: u32,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormShareSettings {
    pub users: Vec<Id>,
    pub permissions: FormPermissions,
    pub message: Option<String>,
    pub notify_users: bool,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormPermissions {
    pub can_view: bool,
    pub can_edit: bool,
    pub can_view_responses: bool,
    pub can_export_data: bool,
    pub can_manage_settings: bool,
    pub can_share: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormCollaborator {
    pub user_id: Id,
    pub username: String,
    pub full_name: String,
    pub email: String,
    pub permissions: FormPermissions,
    pub added_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormVersion {
    pub id: Id,
    pub version_number: i32,
    pub version_name: String,
    pub changes_summary: String,
    pub created_by: Id,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_current: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormVersionComparison {
    pub version1: FormVersion,
    pub version2: FormVersion,
    pub differences: Vec<FormDifference>,
    pub similarity_score: f64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormDifference {
    pub diff_type: FormDifferenceType,
    pub element_type: String,
    pub element_id: String,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum FormDifferenceType {
    Added,
    Removed,
    Modified,
    Moved,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ElementOrder {
    pub element_type: ElementType,
    pub element_id: String,
    pub new_position: u32,
    pub parent_id: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ElementType {
    Section,
    Field,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ResponseUserInfo {
    pub user_id: Option<Id>,
    pub email: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub referrer: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ResponseFilters {
    pub status: Option<ResponseStatus>,
    pub start_date: Option<chrono::DateTime<chrono::Utc>>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
    pub search_query: Option<String>,
    pub field_filters: HashMap<String, String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PaginatedResponses {
    pub responses: Vec<FormResponseResponse>,
    pub total_count: i64,
    pub page: u32,
    pub per_page: u32,
    pub has_more: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ResponseSummary {
    pub total_responses: i64,
    pub completed_responses: i64,
    pub draft_responses: i64,
    pub average_completion_time: Option<u32>,
    pub completion_rate: f64,
    pub most_recent_response: Option<chrono::DateTime<chrono::Utc>>,
    pub response_trends: Vec<ResponseTrend>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormInsight {
    pub insight_type: InsightType,
    pub title: String,
    pub description: String,
    pub impact_score: f64,
    pub recommendations: Vec<String>,
    pub data: serde_json::Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum InsightType {
    HighAbandonmentRate,
    LowCompletionRate,
    PopularFields,
    UnusedFields,
    PerformanceIssue,
    UserBehaviorPattern,
    DataQualityIssue,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct DataExportOptions {
    pub format: ExportFormat,
    pub include_metadata: bool,
    pub include_analytics: bool,
    pub date_range: Option<(chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>,
    pub field_selection: Option<Vec<String>>,
    pub response_filters: Option<ResponseFilters>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ConditionalLogicRule {
    pub id: String,
    pub trigger_field_id: String,
    pub condition: LogicCondition,
    pub actions: Vec<LogicAction>,
    pub is_active: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct LogicCondition {
    pub operator: LogicOperator,
    pub value: FieldValue,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum LogicOperator {
    Equals,
    NotEquals,
    Contains,
    NotContains,
    GreaterThan,
    LessThan,
    IsEmpty,
    IsNotEmpty,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct LogicAction {
    pub action_type: LogicActionType,
    pub target_field_id: String,
    pub parameters: HashMap<String, serde_json::Value>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum LogicActionType {
    Show,
    Hide,
    Require,
    Optional,
    SetValue,
    ClearValue,
    Skip,
    Jump,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct NotificationSettings {
    pub email_notifications: EmailNotificationSettings,
    pub webhook_notifications: Vec<WebhookNotification>,
    pub slack_notifications: Option<SlackNotificationSettings>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct EmailNotificationSettings {
    pub enabled: bool,
    pub recipients: Vec<String>,
    pub subject_template: String,
    pub body_template: String,
    pub trigger_events: Vec<NotificationTrigger>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct WebhookNotification {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub payload_template: String,
    pub trigger_events: Vec<NotificationTrigger>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SlackNotificationSettings {
    pub webhook_url: String,
    pub channel: String,
    pub message_template: String,
    pub trigger_events: Vec<NotificationTrigger>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum NotificationTrigger {
    ResponseSubmitted,
    ResponseUpdated,
    FormPublished,
    FormUnpublished,
    QuotaReached,
    DeadlineApproaching,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct IntegrationConfig {
    pub integration_type: crate::entities::IntegrationType,
    pub name: String,
    pub config: HashMap<String, String>,
    pub field_mappings: Vec<crate::entities::FieldMapping>,
    pub trigger_events: Vec<IntegrationTrigger>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum IntegrationTrigger {
    OnSubmit,
    OnUpdate,
    OnApproval,
    Scheduled,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct WorkflowConfig {
    pub name: String,
    pub description: Option<String>,
    pub trigger: crate::entities::WorkflowTrigger,
    pub conditions: Vec<crate::entities::WorkflowCondition>,
    pub actions: Vec<crate::entities::WorkflowAction>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormActivity {
    pub id: Id,
    pub activity_type: FormActivityType,
    pub user_id: Id,
    pub user_name: String,
    pub description: String,
    pub metadata: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum FormActivityType {
    FormCreated,
    FormUpdated,
    FormPublished,
    FormUnpublished,
    FieldAdded,
    FieldUpdated,
    FieldDeleted,
    ResponseReceived,
    ResponseApproved,
    ResponseRejected,
    IntegrationConfigured,
    WorkflowTriggered,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormPreview {
    pub form: FormDto,
    pub sample_responses: Vec<FormResponseResponse>,
    pub estimated_completion_time: u32,
    pub complexity_score: f64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct OptimizationReport {
    pub current_score: f64,
    pub potential_score: f64,
    pub optimizations: Vec<Optimization>,
    pub performance_metrics: FormPerformanceMetrics,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Optimization {
    pub optimization_type: OptimizationType,
    pub title: String,
    pub description: String,
    pub impact_score: f64,
    pub effort_level: EffortLevel,
    pub recommendations: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum OptimizationType {
    ReduceFields,
    ImproveFieldOrder,
    SimplifyLanguage,
    AddProgressIndicator,
    OptimizeValidation,
    ImproveDesign,
    ReduceLoadTime,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum EffortLevel {
    Low,
    Medium,
    High,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormPerformanceMetrics {
    pub load_time_ms: u32,
    pub completion_rate: f64,
    pub average_completion_time: u32,
    pub abandonment_rate: f64,
    pub error_rate: f64,
    pub mobile_compatibility_score: f64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ValidationReport {
    pub is_valid: bool,
    pub score: f64,
    pub issues: Vec<ValidationIssue>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ValidationIssue {
    pub issue_type: ValidationIssueType,
    pub severity: ValidationSeverity,
    pub field_id: Option<String>,
    pub message: String,
    pub suggestion: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ValidationIssueType {
    MissingRequiredField,
    InvalidFieldConfiguration,
    PoorUserExperience,
    AccessibilityIssue,
    PerformanceIssue,
    SecurityConcern,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ValidationSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct HealthScore {
    pub overall_score: f64,
    pub completion_score: f64,
    pub performance_score: f64,
    pub usability_score: f64,
    pub accessibility_score: f64,
    pub security_score: f64,
    pub recommendations: Vec<String>,
    pub last_calculated: chrono::DateTime<chrono::Utc>,
}