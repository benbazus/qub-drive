use kingshare_core::{Id, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::Validate;

/// Enhanced spreadsheet with enterprise features
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Spreadsheet {
    pub id: Id,
    pub document_id: Id,
    pub title: String,
    pub sheets: Vec<Sheet>,
    pub named_ranges: HashMap<String, NamedRange>,
    pub charts: Vec<Chart>,
    pub pivot_tables: Vec<PivotTable>,
    pub data_validation_rules: Vec<DataValidationRule>,
    pub conditional_formatting: Vec<ConditionalFormatRule>,
    pub protected_ranges: Vec<ProtectedRange>,
    pub settings: SpreadsheetSettings,
    pub version: i64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Sheet {
    pub id: String,
    pub title: String,
    pub index: u32,
    pub grid_properties: GridProperties,
    pub cells: HashMap<String, Cell>, // "A1" -> Cell
    pub merged_ranges: Vec<GridRange>,
    pub conditional_formatting: Vec<ConditionalFormatRule>,
    pub protected_ranges: Vec<ProtectedRange>,
    pub filter_views: Vec<FilterView>,
    pub is_hidden: bool,
    pub tab_color: Option<Color>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GridProperties {
    pub row_count: u32,
    pub column_count: u32,
    pub frozen_row_count: u32,
    pub frozen_column_count: u32,
    pub hide_gridlines: bool,
    pub row_group_control_after: bool,
    pub column_group_control_after: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Cell {
    pub value: CellValue,
    pub formula: Option<String>,
    pub format: CellFormat,
    pub note: Option<String>,
    pub hyperlink: Option<String>,
    pub data_validation: Option<DataValidation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CellValue {
    Empty,
    String(String),
    Number(f64),
    Boolean(bool),
    Date(Timestamp),
    Error(CellError),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CellError {
    DivideByZero,
    InvalidReference,
    InvalidValue,
    NotAvailable,
    Name,
    Null,
    Number,
    Reference,
    Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CellFormat {
    pub number_format: NumberFormat,
    pub background_color: Option<Color>,
    pub borders: Borders,
    pub padding: Padding,
    pub horizontal_alignment: HorizontalAlignment,
    pub vertical_alignment: VerticalAlignment,
    pub wrap_strategy: WrapStrategy,
    pub text_direction: TextDirection,
    pub text_format: TextFormat,
    pub text_rotation: TextRotation,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NumberFormat {
    pub format_type: NumberFormatType,
    pub pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NumberFormatType {
    Text,
    Number,
    Percent,
    Currency,
    Date,
    Time,
    DateTime,
    Scientific,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Color {
    pub red: f32,
    pub green: f32,
    pub blue: f32,
    pub alpha: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Borders {
    pub top: Option<Border>,
    pub bottom: Option<Border>,
    pub left: Option<Border>,
    pub right: Option<Border>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Border {
    pub style: BorderStyle,
    pub width: u32,
    pub color: Color,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BorderStyle {
    None,
    Dotted,
    Dashed,
    Solid,
    SolidMedium,
    SolidThick,
    Double,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Padding {
    pub top: u32,
    pub right: u32,
    pub bottom: u32,
    pub left: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HorizontalAlignment {
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VerticalAlignment {
    Top,
    Middle,
    Bottom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WrapStrategy {
    OverflowCell,
    LegacyWrap,
    Clip,
    Wrap,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TextDirection {
    LeftToRight,
    RightToLeft,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TextFormat {
    pub foreground_color: Option<Color>,
    pub font_family: String,
    pub font_size: u32,
    pub bold: bool,
    pub italic: bool,
    pub strikethrough: bool,
    pub underline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TextRotation {
    pub angle: i32, // -90 to 90 degrees
    pub vertical: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GridRange {
    pub sheet_id: String,
    pub start_row_index: u32,
    pub end_row_index: u32,
    pub start_column_index: u32,
    pub end_column_index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NamedRange {
    pub name: String,
    pub range: GridRange,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Chart {
    pub id: String,
    pub title: String,
    pub chart_type: ChartType,
    pub data_range: GridRange,
    pub position: ChartPosition,
    pub spec: ChartSpec,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChartType {
    Line,
    Area,
    Column,
    Bar,
    Pie,
    Scatter,
    Combo,
    Histogram,
    Candlestick,
    Org,
    Treemap,
    Waterfall,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ChartPosition {
    pub overlay_position: Option<OverlayPosition>,
    pub new_sheet: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OverlayPosition {
    pub anchor_cell: GridCoordinate,
    pub offset_x_pixels: i32,
    pub offset_y_pixels: i32,
    pub width_pixels: u32,
    pub height_pixels: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GridCoordinate {
    pub sheet_id: String,
    pub row_index: u32,
    pub column_index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ChartSpec {
    pub title: String,
    pub subtitle: Option<String>,
    pub font_name: String,
    pub maximize_in_chart: bool,
    pub background_color: Option<Color>,
    pub alt_text: Option<String>,
    pub title_text_format: Option<TextFormat>,
    pub subtitle_text_format: Option<TextFormat>,
    pub hidden_dimension_strategy: HiddenDimensionStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HiddenDimensionStrategy {
    SkipHiddenRowsAndColumns,
    SkipHiddenRows,
    SkipHiddenColumns,
    ShowAll,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotTable {
    pub id: String,
    pub title: String,
    pub source_range: GridRange,
    pub rows: Vec<PivotGroup>,
    pub columns: Vec<PivotGroup>,
    pub values: Vec<PivotValue>,
    pub filters: Vec<PivotFilter>,
    pub value_layout: ValueLayout,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotGroup {
    pub source_column_offset: u32,
    pub show_totals: bool,
    pub sort_order: SortOrder,
    pub value_bucket: Option<PivotGroupSortValueBucket>,
    pub value_metadata: Vec<PivotGroupValueMetadata>,
    pub group_rule: Option<PivotGroupRule>,
    pub group_limit: Option<PivotGroupLimit>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortOrder {
    Ascending,
    Descending,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotGroupSortValueBucket {
    pub values: Vec<ExtendedValue>,
    pub values_index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExtendedValue {
    Number(f64),
    String(String),
    Boolean(bool),
    Formula(String),
    Error(CellError),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotGroupValueMetadata {
    pub value: ExtendedValue,
    pub collapsed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotGroupRule {
    pub manual_rule: Option<ManualRule>,
    pub histogram_rule: Option<HistogramRule>,
    pub date_time_rule: Option<DateTimeRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ManualRule {
    pub groups: Vec<ManualRuleGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ManualRuleGroup {
    pub group_name: ExtendedValue,
    pub items: Vec<ExtendedValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HistogramRule {
    pub interval_size: f64,
    pub min_value: f64,
    pub max_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DateTimeRule {
    pub rule_type: DateTimeRuleType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DateTimeRuleType {
    Second,
    Minute,
    Hour,
    HourMinute,
    HourMinuteAmPm,
    DayOfWeek,
    DayOfYear,
    DayOfMonth,
    DayMonth,
    Month,
    Quarter,
    Year,
    YearMonth,
    YearQuarter,
    YearMonthDay,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotGroupLimit {
    pub count: u32,
    pub apply_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotValue {
    pub source_column_offset: u32,
    pub summarize_function: PivotStandardValueFunction,
    pub name: String,
    pub calculated_display_type: PivotValueCalculatedDisplayType,
    pub formula: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PivotStandardValueFunction {
    Sum,
    Count,
    CountA,
    CountUnique,
    Average,
    Max,
    Min,
    Median,
    Product,
    StDev,
    StDevP,
    Var,
    VarP,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PivotValueCalculatedDisplayType {
    Default,
    PercentOfRowTotal,
    PercentOfColumnTotal,
    PercentOfGrandTotal,
    RunningTotal,
    PercentRunningTotal,
    PercentOfParentRowTotal,
    PercentOfParentColumnTotal,
    PercentOfParentTotal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PivotFilter {
    pub source_column_offset: u32,
    pub criteria: FilterCriteria,
    pub visible_values: Vec<String>,
    pub visible_by_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValueLayout {
    Horizontal,
    Vertical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DataValidationRule {
    pub range: GridRange,
    pub condition: BooleanCondition,
    pub input_message: Option<String>,
    pub strict: bool,
    pub show_custom_ui: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DataValidation {
    pub condition: BooleanCondition,
    pub input_message: Option<String>,
    pub strict: bool,
    pub show_custom_ui: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BooleanCondition {
    pub condition_type: ConditionType,
    pub values: Vec<ConditionValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConditionType {
    NumberGreater,
    NumberGreaterThanEq,
    NumberLess,
    NumberLessThanEq,
    NumberEq,
    NumberNotEq,
    NumberBetween,
    NumberNotBetween,
    TextContains,
    TextNotContains,
    TextStartsWith,
    TextEndsWith,
    TextEq,
    TextIsEmail,
    TextIsUrl,
    DateEq,
    DateBefore,
    DateAfter,
    DateOnOrBefore,
    DateOnOrAfter,
    DateBetween,
    DateNotBetween,
    DateIsValid,
    OneOfRange,
    OneOfList,
    Blank,
    NotBlank,
    Custom,
    Boolean,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConditionValue {
    pub relative_date: Option<RelativeDate>,
    pub user_entered_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RelativeDate {
    PastYear,
    PastMonth,
    PastWeek,
    Yesterday,
    Today,
    Tomorrow,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConditionalFormatRule {
    pub ranges: Vec<GridRange>,
    pub boolean_rule: Option<BooleanRule>,
    pub gradient_rule: Option<GradientRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BooleanRule {
    pub condition: BooleanCondition,
    pub format: CellFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GradientRule {
    pub min_point: InterpolationPoint,
    pub mid_point: Option<InterpolationPoint>,
    pub max_point: InterpolationPoint,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InterpolationPoint {
    pub color: Color,
    pub point_type: InterpolationPointType,
    pub value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InterpolationPointType {
    Min,
    Max,
    Number,
    Percent,
    Percentile,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProtectedRange {
    pub range: GridRange,
    pub description: String,
    pub warning_only: bool,
    pub requesting_user_can_edit: bool,
    pub unprotected_ranges: Vec<GridRange>,
    pub editors: Editors,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Editors {
    pub users: Vec<String>,
    pub groups: Vec<String>,
    pub domain_users_can_edit: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FilterView {
    pub id: String,
    pub title: String,
    pub range: GridRange,
    pub sort_specs: Vec<SortSpec>,
    pub criteria: HashMap<u32, FilterCriteria>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SortSpec {
    pub dimension_index: u32,
    pub sort_order: SortOrder,
    pub foreground_color: Option<Color>,
    pub background_color: Option<Color>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FilterCriteria {
    pub hidden_values: Vec<String>,
    pub condition: Option<BooleanCondition>,
    pub visible_foreground_color: Option<Color>,
    pub visible_background_color: Option<Color>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SpreadsheetSettings {
    pub locale: String,
    pub time_zone: String,
    pub default_format: CellFormat,
    pub iterative_calculation_settings: IterativeCalculationSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IterativeCalculationSettings {
    pub max_iterations: u32,
    pub convergence_threshold: f64,
}

// Formula engine types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Formula {
    pub expression: String,
    pub dependencies: Vec<CellReference>,
    pub result: CellValue,
    pub error: Option<CellError>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CellReference {
    pub sheet_id: Option<String>,
    pub column: String,
    pub row: u32,
    pub absolute_column: bool,
    pub absolute_row: bool,
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCellRequest {
    pub sheet_id: String,
    pub cell_reference: String,
    pub value: Option<CellValue>,
    pub formula: Option<String>,
    pub format: Option<CellFormat>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct BatchUpdateCellsRequest {
    pub updates: Vec<UpdateCellRequest>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSheetRequest {
    #[validate(length(min = 1, max = 100))]
    pub title: String,
    pub grid_properties: Option<GridProperties>,
    pub tab_color: Option<Color>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateChartRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub chart_type: ChartType,
    pub data_range: GridRange,
    pub position: ChartPosition,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePivotTableRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub source_range: GridRange,
    pub rows: Vec<PivotGroup>,
    pub columns: Vec<PivotGroup>,
    pub values: Vec<PivotValue>,
}

#[derive(Debug, Serialize)]
pub struct SpreadsheetResponse {
    pub id: Id,
    pub title: String,
    pub sheets: Vec<SheetResponse>,
    pub named_ranges: HashMap<String, NamedRange>,
    pub charts: Vec<Chart>,
    pub pivot_tables: Vec<PivotTable>,
    pub version: i64,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Serialize)]
pub struct SheetResponse {
    pub id: String,
    pub title: String,
    pub index: u32,
    pub grid_properties: GridProperties,
    pub is_hidden: bool,
    pub tab_color: Option<Color>,
}

impl Spreadsheet {
    pub fn new(document_id: Id, title: String) -> Self {
        let now = chrono::Utc::now();
        let default_sheet = Sheet::new("Sheet1".to_string(), 0);
        
        Self {
            id: uuid::Uuid::new_v4(),
            document_id,
            title,
            sheets: vec![default_sheet],
            named_ranges: HashMap::new(),
            charts: Vec::new(),
            pivot_tables: Vec::new(),
            data_validation_rules: Vec::new(),
            conditional_formatting: Vec::new(),
            protected_ranges: Vec::new(),
            settings: SpreadsheetSettings::default(),
            version: 1,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_sheet(&mut self, title: String) -> String {
        let sheet_id = uuid::Uuid::new_v4().to_string();
        let index = self.sheets.len() as u32;
        let sheet = Sheet::new(title, index);
        self.sheets.push(sheet);
        self.version += 1;
        self.updated_at = chrono::Utc::now();
        sheet_id
    }

    pub fn get_sheet(&self, sheet_id: &str) -> Option<&Sheet> {
        self.sheets.iter().find(|s| s.id == sheet_id)
    }

    pub fn get_sheet_mut(&mut self, sheet_id: &str) -> Option<&mut Sheet> {
        self.sheets.iter_mut().find(|s| s.id == sheet_id)
    }

    pub fn update_cell(&mut self, sheet_id: &str, cell_ref: &str, value: CellValue, formula: Option<String>) -> Result<(), String> {
        if let Some(sheet) = self.get_sheet_mut(sheet_id) {
            let cell = Cell {
                value,
                formula,
                format: CellFormat::default(),
                note: None,
                hyperlink: None,
                data_validation: None,
            };
            sheet.cells.insert(cell_ref.to_string(), cell);
            self.version += 1;
            self.updated_at = chrono::Utc::now();
            Ok(())
        } else {
            Err("Sheet not found".to_string())
        }
    }
}

impl Sheet {
    pub fn new(title: String, index: u32) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            index,
            grid_properties: GridProperties::default(),
            cells: HashMap::new(),
            merged_ranges: Vec::new(),
            conditional_formatting: Vec::new(),
            protected_ranges: Vec::new(),
            filter_views: Vec::new(),
            is_hidden: false,
            tab_color: None,
        }
    }

    pub fn get_cell(&self, cell_ref: &str) -> Option<&Cell> {
        self.cells.get(cell_ref)
    }

    pub fn set_cell(&mut self, cell_ref: String, cell: Cell) {
        self.cells.insert(cell_ref, cell);
    }

    pub fn get_range(&self, range: &GridRange) -> Vec<Vec<Option<&Cell>>> {
        let mut result = Vec::new();
        for row in range.start_row_index..range.end_row_index {
            let mut row_cells = Vec::new();
            for col in range.start_column_index..range.end_column_index {
                let cell_ref = format!("{}{}", Self::column_index_to_letter(col), row + 1);
                row_cells.push(self.get_cell(&cell_ref));
            }
            result.push(row_cells);
        }
        result
    }

    fn column_index_to_letter(index: u32) -> String {
        let mut result = String::new();
        let mut num = index;
        loop {
            result = char::from(b'A' + (num % 26) as u8).to_string() + &result;
            if num < 26 {
                break;
            }
            num = num / 26 - 1;
        }
        result
    }
}

impl Default for GridProperties {
    fn default() -> Self {
        Self {
            row_count: 1000,
            column_count: 26,
            frozen_row_count: 0,
            frozen_column_count: 0,
            hide_gridlines: false,
            row_group_control_after: true,
            column_group_control_after: true,
        }
    }
}

impl Default for CellFormat {
    fn default() -> Self {
        Self {
            number_format: NumberFormat {
                format_type: NumberFormatType::Text,
                pattern: "General".to_string(),
            },
            background_color: None,
            borders: Borders {
                top: None,
                bottom: None,
                left: None,
                right: None,
            },
            padding: Padding {
                top: 2,
                right: 3,
                bottom: 2,
                left: 3,
            },
            horizontal_alignment: HorizontalAlignment::Left,
            vertical_alignment: VerticalAlignment::Bottom,
            wrap_strategy: WrapStrategy::OverflowCell,
            text_direction: TextDirection::LeftToRight,
            text_format: TextFormat {
                foreground_color: None,
                font_family: "Arial".to_string(),
                font_size: 10,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
            },
            text_rotation: TextRotation {
                angle: 0,
                vertical: false,
            },
        }
    }
}

impl Default for SpreadsheetSettings {
    fn default() -> Self {
        Self {
            locale: "en_US".to_string(),
            time_zone: "UTC".to_string(),
            default_format: CellFormat::default(),
            iterative_calculation_settings: IterativeCalculationSettings {
                max_iterations: 50,
                convergence_threshold: 0.05,
            },
        }
    }
}