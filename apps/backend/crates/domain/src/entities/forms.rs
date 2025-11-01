use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

/// Enhanced forms system with enterprise features
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Form {
    pub id: Id,
    pub document_id: Id,
    pub title: String,
    pub description: Option<String>,
    pub sections: Vec<FormSection>,
    pub settings: FormSettings,
    pub branding: FormBranding,
    pub logic: FormLogic,
    pub analytics: FormAnalytics,
    pub status: FormStatus,
    pub version: i64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub published_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormSection {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub fields: Vec<FormField>,
    pub order: u32,
    pub is_repeatable: bool,
    pub conditions: Vec<DisplayCondition>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormField {
    pub id: String,
    pub field_type: FormFieldType,
    pub label: String,
    pub description: Option<String>,
    pub placeholder: Option<String>,
    pub required: bool,
    pub order: u32,
    pub options: Vec<FieldOption>,
    pub validation: Option<FieldValidation>,
    pub default_value: Option<FieldValue>,
    pub properties: FieldProperties,
    pub conditions: Vec<DisplayCondition>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FormFieldType {
    // Text inputs
    ShortText,
    LongText,
    RichText,
    Email,
    Phone,
    Url,
    
    // Numbers and dates
    Number,
    Currency,
    Date,
    Time,
    DateTime,
    Duration,
    
    // Selection
    Dropdown,
    MultipleChoice,
    Checkboxes,
    LinearScale,
    MultipleChoiceGrid,
    CheckboxGrid,
    
    // File and media
    FileUpload,
    ImageUpload,
    VideoUpload,
    
    // Advanced
    Signature,
    Location,
    Rating,
    Ranking,
    Matrix,
    Calculation,
    
    // Layout
    SectionBreak,
    PageBreak,
    Image,
    Video,
    
    // Enterprise
    UserLookup,
    Department,
    ApprovalWorkflow,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldOption {
    pub id: String,
    pub label: String,
    pub value: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub is_other: bool,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldValidation {
    pub required: bool,
    pub min_length: Option<u32>,
    pub max_length: Option<u32>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub pattern: Option<String>,
    pub custom_message: Option<String>,
    pub file_types: Vec<String>,
    pub max_file_size: Option<u64>,
    pub max_files: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FieldValue {
    Text(String),
    Number(f64),
    Boolean(bool),
    Date(Timestamp),
    Array(Vec<String>),
    File(FileInfo),
    Location(LocationInfo),
    Signature(SignatureInfo),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileInfo {
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub url: String,
    pub checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LocationInfo {
    pub latitude: f64,
    pub longitude: f64,
    pub address: Option<String>,
    pub accuracy: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SignatureInfo {
    pub image_url: String,
    pub signature_data: String,
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldProperties {
    pub width: Option<FieldWidth>,
    pub alignment: Option<FieldAlignment>,
    pub show_time: bool,
    pub date_format: Option<String>,
    pub number_format: Option<String>,
    pub currency_code: Option<String>,
    pub scale_min: Option<i32>,
    pub scale_max: Option<i32>,
    pub scale_min_label: Option<String>,
    pub scale_max_label: Option<String>,
    pub rows: Option<u32>,
    pub columns: Option<u32>,
    pub shuffle_options: bool,
    pub allow_other: bool,
    pub calculation_formula: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FieldWidth {
    Short,
    Medium,
    Long,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FieldAlignment {
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DisplayCondition {
    pub field_id: String,
    pub operator: ConditionOperator,
    pub value: FieldValue,
    pub action: ConditionAction,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    Contains,
    NotContains,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
    IsEmpty,
    IsNotEmpty,
    StartsWith,
    EndsWith,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConditionAction {
    Show,
    Hide,
    Require,
    Optional,
    Skip,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormSettings {
    pub collect_emails: bool,
    pub require_sign_in: bool,
    pub allow_multiple_responses: bool,
    pub allow_response_editing: bool,
    pub show_progress_bar: bool,
    pub show_link_to_submit_another: bool,
    pub confirmation_message: String,
    pub redirect_url: Option<String>,
    pub response_limit: Option<u32>,
    pub expires_at: Option<Timestamp>,
    pub quiz_settings: Option<QuizSettings>,
    pub notification_settings: NotificationSettings,
    pub privacy_settings: PrivacySettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct QuizSettings {
    pub is_quiz: bool,
    pub show_correct_answers: bool,
    pub show_score: bool,
    pub passing_score: Option<f64>,
    pub certificate_template: Option<String>,
    pub time_limit: Option<u32>, // minutes
    pub randomize_questions: bool,
    pub prevent_cheating: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationSettings {
    pub notify_on_response: bool,
    pub notification_emails: Vec<String>,
    pub email_template: Option<String>,
    pub auto_responder: Option<AutoResponder>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AutoResponder {
    pub enabled: bool,
    pub subject: String,
    pub message: String,
    pub include_response_copy: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PrivacySettings {
    pub collect_ip_addresses: bool,
    pub collect_user_agent: bool,
    pub collect_location: bool,
    pub data_retention_days: Option<u32>,
    pub gdpr_compliant: bool,
    pub privacy_notice: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormBranding {
    pub theme: FormTheme,
    pub logo_url: Option<String>,
    pub header_image_url: Option<String>,
    pub custom_css: Option<String>,
    pub font_family: String,
    pub primary_color: String,
    pub background_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FormTheme {
    Default,
    Modern,
    Classic,
    Minimal,
    Corporate,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormLogic {
    pub workflows: Vec<Workflow>,
    pub integrations: Vec<Integration>,
    pub calculations: Vec<Calculation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub trigger: WorkflowTrigger,
    pub actions: Vec<WorkflowAction>,
    pub conditions: Vec<WorkflowCondition>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowTrigger {
    OnSubmit,
    OnFieldChange,
    OnConditionMet,
    Scheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorkflowAction {
    pub action_type: WorkflowActionType,
    pub parameters: HashMap<String, String>,
    pub delay: Option<u32>, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowActionType {
    SendEmail,
    SendSms,
    CreateTask,
    UpdateDatabase,
    CallWebhook,
    GenerateDocument,
    StartApproval,
    SendSlackMessage,
    CreateCalendarEvent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorkflowCondition {
    pub field_id: String,
    pub operator: ConditionOperator,
    pub value: FieldValue,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Integration {
    pub id: String,
    pub integration_type: IntegrationType,
    pub config: HashMap<String, String>,
    pub field_mappings: Vec<FieldMapping>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IntegrationType {
    GoogleSheets,
    Salesforce,
    HubSpot,
    Mailchimp,
    Zapier,
    Slack,
    Teams,
    Webhook,
    Database,
    Crm,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldMapping {
    pub form_field_id: String,
    pub external_field_name: String,
    pub transformation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Calculation {
    pub id: String,
    pub name: String,
    pub formula: String,
    pub result_field_id: String,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormAnalytics {
    pub total_views: i64,
    pub total_responses: i64,
    pub completion_rate: f64,
    pub average_completion_time: Option<u32>, // seconds
    pub abandonment_points: HashMap<String, i64>, // field_id -> abandonment_count
    pub response_trends: Vec<ResponseTrend>,
    pub field_analytics: HashMap<String, FieldAnalytics>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResponseTrend {
    pub date: String, // YYYY-MM-DD
    pub responses: i64,
    pub views: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldAnalytics {
    pub field_id: String,
    pub skip_rate: f64,
    pub average_time_spent: Option<u32>, // seconds
    pub value_distribution: HashMap<String, i64>,
    pub validation_errors: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FormStatus {
    Draft,
    Published,
    Paused,
    Closed,
    Archived,
}

/// Form responses
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormResponse {
    pub id: Id,
    pub form_id: Id,
    pub respondent_id: Option<Id>,
    pub respondent_email: Option<String>,
    pub responses: HashMap<String, FieldValue>, // field_id -> value
    pub metadata: ResponseMetadata,
    pub status: ResponseStatus,
    pub score: Option<f64>, // for quizzes
    pub completion_time: Option<u32>, // seconds
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub submitted_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResponseMetadata {
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub location: Option<LocationInfo>,
    pub referrer: Option<String>,
    pub session_id: String,
    pub device_type: Option<String>,
    pub browser: Option<String>,
    pub os: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ResponseStatus {
    InProgress,
    Submitted,
    Approved,
    Rejected,
    Flagged,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct CreateFormRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub description: Option<String>,
    pub template_id: Option<Id>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateFormRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: Option<String>,
    pub description: Option<String>,
    pub sections: Option<Vec<FormSection>>,
    pub settings: Option<FormSettings>,
    pub branding: Option<FormBranding>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AddFormFieldRequest {
    pub section_id: String,
    pub field_type: FormFieldType,
    #[validate(length(min = 1, max = 255))]
    pub label: String,
    pub description: Option<String>,
    pub required: bool,
    pub options: Vec<FieldOption>,
    pub validation: Option<FieldValidation>,
    pub properties: Option<FieldProperties>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SubmitFormResponseRequest {
    pub responses: HashMap<String, FieldValue>,
    pub save_as_draft: bool,
}

#[derive(Debug, Deserialize)]
pub struct FormAnalyticsQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub group_by: Option<String>, // day, week, month
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FormDto {
    pub id: Id,
    pub title: String,
    pub description: Option<String>,
    pub sections: Vec<FormSection>,
    pub settings: FormSettings,
    pub branding: FormBranding,
    pub status: FormStatus,
    pub analytics: FormAnalytics,
    pub version: i64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub published_at: Option<Timestamp>,
}

#[derive(Debug, Serialize)]
pub struct FormSummaryResponse {
    pub id: Id,
    pub title: String,
    pub description: Option<String>,
    pub status: FormStatus,
    pub total_responses: i64,
    pub completion_rate: f64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FormResponseResponse {
    pub id: Id,
    pub form_title: String,
    pub respondent_email: Option<String>,
    pub responses: HashMap<String, FieldValue>,
    pub status: ResponseStatus,
    pub score: Option<f64>,
    pub completion_time: Option<u32>,
    pub created_at: Timestamp,
    pub submitted_at: Option<Timestamp>,
}

#[derive(Debug, Serialize)]
pub struct FormAnalyticsResponse {
    pub total_views: i64,
    pub total_responses: i64,
    pub completion_rate: f64,
    pub average_completion_time: Option<u32>,
    pub response_trends: Vec<ResponseTrend>,
    pub field_analytics: HashMap<String, FieldAnalytics>,
    pub top_abandonment_points: Vec<(String, i64)>,
}

impl Form {
    pub fn new(document_id: Id, title: String) -> Self {
        let now = chrono::Utc::now();
        
        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            title,
            description: None,
            sections: vec![FormSection::default()],
            settings: FormSettings::default(),
            branding: FormBranding::default(),
            logic: FormLogic::default(),
            analytics: FormAnalytics::default(),
            status: FormStatus::Draft,
            version: 1,
            created_at: now,
            updated_at: now,
            published_at: None,
        }
    }

    pub fn add_field(&mut self, section_id: &str, field: FormField) -> Result<(), String> {
        if let Some(section) = self.sections.iter_mut().find(|s| s.id == section_id) {
            section.fields.push(field);
            self.version += 1;
            self.updated_at = chrono::Utc::now();
            Ok(())
        } else {
            Err("Section not found".to_string())
        }
    }

    pub fn publish(&mut self) {
        self.status = FormStatus::Published;
        self.published_at = Some(chrono::Utc::now());
        self.updated_at = chrono::Utc::now();
    }

    pub fn pause(&mut self) {
        self.status = FormStatus::Paused;
        self.updated_at = chrono::Utc::now();
    }

    pub fn close(&mut self) {
        self.status = FormStatus::Closed;
        self.updated_at = chrono::Utc::now();
    }

    pub fn is_accepting_responses(&self) -> bool {
        matches!(self.status, FormStatus::Published) && 
        self.settings.expires_at.map_or(true, |exp| chrono::Utc::now() < exp) &&
        self.settings.response_limit.map_or(true, |limit| self.analytics.total_responses < limit as i64)
    }

    pub fn calculate_completion_rate(&self) -> f64 {
        if self.analytics.total_views == 0 {
            0.0
        } else {
            (self.analytics.total_responses as f64 / self.analytics.total_views as f64) * 100.0
        }
    }
}

impl FormResponse {
    pub fn new(form_id: Id, respondent_id: Option<Id>, respondent_email: Option<String>) -> Self {
        let now = chrono::Utc::now();
        
        Self {
            id: uuid::Uuid::new_v4(),
            form_id,
            respondent_id,
            respondent_email,
            responses: HashMap::new(),
            metadata: ResponseMetadata {
                ip_address: None,
                user_agent: None,
                location: None,
                referrer: None,
                session_id: uuid::Uuid::new_v4().to_string(),
                device_type: None,
                browser: None,
                os: None,
            },
            status: ResponseStatus::InProgress,
            score: None,
            completion_time: None,
            created_at: now,
            updated_at: now,
            submitted_at: None,
        }
    }

    pub fn add_response(&mut self, field_id: String, value: FieldValue) {
        self.responses.insert(field_id, value);
        self.updated_at = chrono::Utc::now();
    }

    pub fn submit(&mut self) {
        self.status = ResponseStatus::Submitted;
        self.submitted_at = Some(chrono::Utc::now());
        self.updated_at = chrono::Utc::now();
        
        // Calculate completion time
        if let Some(submitted_at) = self.submitted_at {
            let duration = submitted_at.signed_duration_since(self.created_at);
            self.completion_time = Some(duration.num_seconds() as u32);
        }
    }
}

impl Default for FormSection {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: "Untitled Section".to_string(),
            description: None,
            fields: Vec::new(),
            order: 0,
            is_repeatable: false,
            conditions: Vec::new(),
        }
    }
}

impl Default for FormSettings {
    fn default() -> Self {
        Self {
            collect_emails: false,
            require_sign_in: false,
            allow_multiple_responses: true,
            allow_response_editing: false,
            show_progress_bar: true,
            show_link_to_submit_another: false,
            confirmation_message: "Thank you for your response!".to_string(),
            redirect_url: None,
            response_limit: None,
            expires_at: None,
            quiz_settings: None,
            notification_settings: NotificationSettings {
                notify_on_response: false,
                notification_emails: Vec::new(),
                email_template: None,
                auto_responder: None,
            },
            privacy_settings: PrivacySettings {
                collect_ip_addresses: false,
                collect_user_agent: false,
                collect_location: false,
                data_retention_days: None,
                gdpr_compliant: true,
                privacy_notice: None,
            },
        }
    }
}

impl Default for FormBranding {
    fn default() -> Self {
        Self {
            theme: FormTheme::Default,
            logo_url: None,
            header_image_url: None,
            custom_css: None,
            font_family: "Arial, sans-serif".to_string(),
            primary_color: "#1a73e8".to_string(),
            background_color: "#ffffff".to_string(),
        }
    }
}

impl Default for FormLogic {
    fn default() -> Self {
        Self {
            workflows: Vec::new(),
            integrations: Vec::new(),
            calculations: Vec::new(),
        }
    }
}

impl Default for FormAnalytics {
    fn default() -> Self {
        Self {
            total_views: 0,
            total_responses: 0,
            completion_rate: 0.0,
            average_completion_time: None,
            abandonment_points: HashMap::new(),
            response_trends: Vec::new(),
            field_analytics: HashMap::new(),
        }
    }
}