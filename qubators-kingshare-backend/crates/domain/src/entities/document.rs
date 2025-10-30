use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub id: Id,
    pub owner_id: Id,
    pub title: String,
    pub document_type: DocumentType,
    pub content: DocumentContent,
    pub metadata: DocumentMetadata,
    pub permissions: DocumentPermissions,
    pub version: i64,
    pub is_public: bool,
    pub is_template: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub last_accessed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DocumentType {
    TextDocument,
    Spreadsheet,
    Presentation,
    Form,
    Drawing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DocumentContent {
    Text {
        content: String,
        format: TextFormat,
    },
    Spreadsheet {
        sheets: Vec<SpreadsheetSheet>,
    },
    Presentation {
        slides: Vec<PresentationSlide>,
    },
    Form {
        fields: Vec<FormField>,
        settings: FormSettings,
    },
    Drawing {
        elements: Vec<DrawingElement>,
        canvas_size: CanvasSize,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TextFormat {
    PlainText,
    Markdown,
    RichText,
    Html,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SpreadsheetSheet {
    pub id: String,
    pub name: String,
    pub cells: HashMap<String, CellValue>, // "A1" -> value
    pub formulas: HashMap<String, String>, // "B2" -> "=A1+A2"
    pub formatting: HashMap<String, CellFormat>,
    pub row_count: u32,
    pub column_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CellValue {
    Empty,
    Text(String),
    Number(f64),
    Boolean(bool),
    Date(Timestamp),
    Formula(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CellFormat {
    pub font_family: Option<String>,
    pub font_size: Option<u32>,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub alignment: TextAlignment,
    pub number_format: Option<NumberFormat>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TextAlignment {
    Left,
    Center,
    Right,
    Justify,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NumberFormat {
    General,
    Number,
    Currency,
    Percentage,
    Date,
    Time,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PresentationSlide {
    pub id: String,
    pub title: String,
    pub content: String,
    pub layout: SlideLayout,
    pub elements: Vec<SlideElement>,
    pub notes: String,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SlideLayout {
    Title,
    TitleAndContent,
    TwoColumn,
    Blank,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SlideElement {
    pub id: String,
    pub element_type: SlideElementType,
    pub position: Position,
    pub size: Size,
    pub content: String,
    pub style: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SlideElementType {
    Text,
    Image,
    Shape,
    Chart,
    Table,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormField {
    pub id: String,
    pub field_type: FormFieldType,
    pub label: String,
    pub description: Option<String>,
    pub required: bool,
    pub options: Vec<String>, // For select, radio, checkbox
    pub validation: Option<FieldValidation>,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FormFieldType {
    ShortText,
    LongText,
    Email,
    Number,
    Date,
    Time,
    Select,
    MultiSelect,
    Radio,
    Checkbox,
    FileUpload,
    Rating,
    Scale,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FieldValidation {
    pub min_length: Option<u32>,
    pub max_length: Option<u32>,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub pattern: Option<String>,
    pub custom_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormSettings {
    pub collect_emails: bool,
    pub allow_multiple_responses: bool,
    pub show_progress_bar: bool,
    pub confirmation_message: String,
    pub redirect_url: Option<String>,
    pub response_limit: Option<u32>,
    pub expires_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DrawingElement {
    pub id: String,
    pub element_type: DrawingElementType,
    pub position: Position,
    pub size: Size,
    pub style: DrawingStyle,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DrawingElementType {
    Rectangle,
    Circle,
    Line,
    Text,
    Image,
    Arrow,
    Freehand,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CanvasSize {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DrawingStyle {
    pub stroke_color: String,
    pub fill_color: String,
    pub stroke_width: f64,
    pub opacity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DocumentMetadata {
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub language: String,
    pub word_count: Option<u32>,
    pub character_count: Option<u32>,
    pub page_count: Option<u32>,
    pub custom_properties: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DocumentPermissions {
    pub can_view: Vec<Id>,
    pub can_edit: Vec<Id>,
    pub can_comment: Vec<Id>,
    pub can_share: Vec<Id>,
    pub public_access: PublicAccessLevel,
    pub link_sharing: LinkSharingSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PublicAccessLevel {
    Private,
    ViewOnly,
    CommentOnly,
    EditAccess,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LinkSharingSettings {
    pub enabled: bool,
    pub access_level: PublicAccessLevel,
    pub requires_approval: bool,
    pub expires_at: Option<Timestamp>,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct CreateDocumentRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub document_type: DocumentType,
    pub content: Option<DocumentContent>,
    pub is_public: Option<bool>,
    pub is_template: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateDocumentRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: Option<String>,
    pub content: Option<DocumentContent>,
    pub metadata: Option<DocumentMetadata>,
    pub permissions: Option<DocumentPermissions>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct DocumentSummary {
    pub id: Id,
    pub title: String,
    pub document_type: DocumentType,
    pub owner: DocumentOwner,
    pub permissions: DocumentPermissions,
    pub version: i64,
    pub is_public: bool,
    pub is_template: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub last_accessed_at: Option<Timestamp>,
    pub metadata: DocumentMetadata,
}

#[derive(Debug, Serialize)]
pub struct DocumentOwner {
    pub id: Id,
    pub username: String,
    pub full_name: String,
    pub email: String,
}

impl Document {
    pub fn new(
        owner_id: Id,
        title: String,
        document_type: DocumentType,
        content: Option<DocumentContent>,
    ) -> Self {
        let now = chrono::Utc::now();
        let default_content = match document_type {
            DocumentType::TextDocument => DocumentContent::Text {
                content: String::new(),
                format: TextFormat::RichText,
            },
            DocumentType::Spreadsheet => DocumentContent::Spreadsheet {
                sheets: vec![SpreadsheetSheet::new("Sheet1".to_string())],
            },
            DocumentType::Presentation => DocumentContent::Presentation {
                slides: vec![PresentationSlide::new("Title Slide".to_string(), 1)],
            },
            DocumentType::Form => DocumentContent::Form {
                fields: Vec::new(),
                settings: FormSettings::default(),
            },
            DocumentType::Drawing => DocumentContent::Drawing {
                elements: Vec::new(),
                canvas_size: CanvasSize { width: 800.0, height: 600.0 },
            },
        };

        Self {
            id: uuid::Uuid::new_v4(),
            owner_id,
            title,
            document_type,
            content: content.unwrap_or(default_content),
            metadata: DocumentMetadata::default(),
            permissions: DocumentPermissions::default(),
            version: 1,
            is_public: false,
            is_template: false,
            created_at: now,
            updated_at: now,
            last_accessed_at: None,
        }
    }

    pub fn update_content(&mut self, content: DocumentContent) {
        self.content = content;
        self.version += 1;
        self.updated_at = chrono::Utc::now();
    }

    pub fn update_access_time(&mut self) {
        self.last_accessed_at = Some(chrono::Utc::now());
    }

    pub fn can_user_view(&self, user_id: Id) -> bool {
        self.owner_id == user_id
            || self.permissions.can_view.contains(&user_id)
            || self.permissions.can_edit.contains(&user_id)
            || matches!(self.permissions.public_access, PublicAccessLevel::ViewOnly | PublicAccessLevel::CommentOnly | PublicAccessLevel::EditAccess)
    }

    pub fn can_user_edit(&self, user_id: Id) -> bool {
        self.owner_id == user_id
            || self.permissions.can_edit.contains(&user_id)
            || matches!(self.permissions.public_access, PublicAccessLevel::EditAccess)
    }

    pub fn can_user_comment(&self, user_id: Id) -> bool {
        self.owner_id == user_id
            || self.permissions.can_comment.contains(&user_id)
            || self.permissions.can_edit.contains(&user_id)
            || matches!(self.permissions.public_access, PublicAccessLevel::CommentOnly | PublicAccessLevel::EditAccess)
    }
}

impl SpreadsheetSheet {
    pub fn new(name: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            cells: HashMap::new(),
            formulas: HashMap::new(),
            formatting: HashMap::new(),
            row_count: 100,
            column_count: 26,
        }
    }

    pub fn set_cell(&mut self, cell_ref: String, value: CellValue) {
        self.cells.insert(cell_ref, value);
    }

    pub fn get_cell(&self, cell_ref: &str) -> Option<&CellValue> {
        self.cells.get(cell_ref)
    }

    pub fn set_formula(&mut self, cell_ref: String, formula: String) {
        self.formulas.insert(cell_ref, formula);
    }
}

impl PresentationSlide {
    pub fn new(title: String, order: u32) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            content: String::new(),
            layout: SlideLayout::TitleAndContent,
            elements: Vec::new(),
            notes: String::new(),
            order,
        }
    }
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            description: None,
            tags: Vec::new(),
            language: "en".to_string(),
            word_count: None,
            character_count: None,
            page_count: None,
            custom_properties: HashMap::new(),
        }
    }
}

impl Default for DocumentPermissions {
    fn default() -> Self {
        Self {
            can_view: Vec::new(),
            can_edit: Vec::new(),
            can_comment: Vec::new(),
            can_share: Vec::new(),
            public_access: PublicAccessLevel::Private,
            link_sharing: LinkSharingSettings {
                enabled: false,
                access_level: PublicAccessLevel::ViewOnly,
                requires_approval: false,
                expires_at: None,
            },
        }
    }
}

impl Default for FormSettings {
    fn default() -> Self {
        Self {
            collect_emails: false,
            allow_multiple_responses: true,
            show_progress_bar: true,
            confirmation_message: "Thank you for your response!".to_string(),
            redirect_url: None,
            response_limit: None,
            expires_at: None,
        }
    }
}

impl Default for CellFormat {
    fn default() -> Self {
        Self {
            font_family: None,
            font_size: None,
            bold: false,
            italic: false,
            underline: false,
            color: None,
            background_color: None,
            alignment: TextAlignment::Left,
            number_format: None,
        }
    }
}