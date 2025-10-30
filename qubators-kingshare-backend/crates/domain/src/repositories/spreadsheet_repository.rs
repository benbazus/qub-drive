use crate::entities::spreadsheet::{
    Spreadsheet, Sheet, Cell, CellValue as SpreadsheetCellValue, Chart, PivotTable, NamedRange, Formula,
    UpdateCellRequest, BatchUpdateCellsRequest, CreateSheetRequest, CreateChartRequest,
    CreatePivotTableRequest, SpreadsheetResponse, GridRange, CellFormat as SpreadsheetCellFormat,
    ChartType, SortOrder, DataValidationRule, ConditionalFormatRule,
};
use kingshare_core::{Id, Result};
use std::collections::HashMap;

#[async_trait::async_trait]
pub trait SpreadsheetRepository: Send + Sync {
    // Spreadsheet management
    async fn create_spreadsheet(&self, spreadsheet: Spreadsheet) -> Result<Spreadsheet>;
    async fn get_spreadsheet_by_id(&self, spreadsheet_id: Id) -> Result<Option<Spreadsheet>>;
    async fn get_spreadsheet_by_document(&self, document_id: Id) -> Result<Option<Spreadsheet>>;
    async fn update_spreadsheet(&self, spreadsheet: Spreadsheet) -> Result<Spreadsheet>;
    async fn delete_spreadsheet(&self, spreadsheet_id: Id) -> Result<()>;

    // Sheet management
    async fn create_sheet(&self, spreadsheet_id: Id, sheet: Sheet) -> Result<Sheet>;
    async fn get_sheet_by_id(&self, sheet_id: &str) -> Result<Option<Sheet>>;
    async fn get_sheets_by_spreadsheet(&self, spreadsheet_id: Id) -> Result<Vec<Sheet>>;
    async fn update_sheet(&self, sheet: Sheet) -> Result<Sheet>;
    async fn delete_sheet(&self, sheet_id: &str) -> Result<()>;
    async fn duplicate_sheet(&self, sheet_id: &str, new_title: String) -> Result<Sheet>;
    async fn reorder_sheets(&self, spreadsheet_id: Id, sheet_order: Vec<String>) -> Result<()>;

    // Cell operations
    async fn update_cell(&self, sheet_id: &str, cell_ref: &str, cell: Cell) -> Result<()>;
    async fn batch_update_cells(&self, sheet_id: &str, updates: HashMap<String, Cell>) -> Result<()>;
    async fn get_cell(&self, sheet_id: &str, cell_ref: &str) -> Result<Option<Cell>>;
    async fn get_range(&self, sheet_id: &str, range: &GridRange) -> Result<Vec<Vec<Option<Cell>>>>;
    async fn clear_range(&self, sheet_id: &str, range: &GridRange) -> Result<()>;
    async fn copy_range(&self, source_sheet: &str, source_range: &GridRange, dest_sheet: &str, dest_start: &str) -> Result<()>;

    // Formula and calculation
    async fn calculate_formula(&self, sheet_id: &str, formula: &str) -> Result<SpreadsheetCellValue>;
    async fn recalculate_sheet(&self, sheet_id: &str) -> Result<()>;
    async fn recalculate_spreadsheet(&self, spreadsheet_id: Id) -> Result<()>;
    async fn get_formula_dependencies(&self, sheet_id: &str, cell_ref: &str) -> Result<Vec<String>>;
    async fn get_formula_dependents(&self, sheet_id: &str, cell_ref: &str) -> Result<Vec<String>>;

    // Formatting
    async fn apply_format(&self, sheet_id: &str, range: &GridRange, format: &SpreadsheetCellFormat) -> Result<()>;
    async fn clear_format(&self, sheet_id: &str, range: &GridRange) -> Result<()>;
    async fn copy_format(&self, source_sheet: &str, source_range: &GridRange, dest_sheet: &str, dest_range: &GridRange) -> Result<()>;

    // Charts
    async fn create_chart(&self, spreadsheet_id: Id, chart: Chart) -> Result<Chart>;
    async fn get_chart_by_id(&self, chart_id: &str) -> Result<Option<Chart>>;
    async fn get_charts_by_spreadsheet(&self, spreadsheet_id: Id) -> Result<Vec<Chart>>;
    async fn update_chart(&self, chart: Chart) -> Result<Chart>;
    async fn delete_chart(&self, chart_id: &str) -> Result<()>;

    // Pivot tables
    async fn create_pivot_table(&self, spreadsheet_id: Id, pivot_table: PivotTable) -> Result<PivotTable>;
    async fn get_pivot_table_by_id(&self, pivot_table_id: &str) -> Result<Option<PivotTable>>;
    async fn get_pivot_tables_by_spreadsheet(&self, spreadsheet_id: Id) -> Result<Vec<PivotTable>>;
    async fn update_pivot_table(&self, pivot_table: PivotTable) -> Result<PivotTable>;
    async fn delete_pivot_table(&self, pivot_table_id: &str) -> Result<()>;
    async fn refresh_pivot_table(&self, pivot_table_id: &str) -> Result<()>;

    // Named ranges
    async fn create_named_range(&self, spreadsheet_id: Id, name: String, range: NamedRange) -> Result<()>;
    async fn get_named_range(&self, spreadsheet_id: Id, name: &str) -> Result<Option<NamedRange>>;
    async fn get_named_ranges_by_spreadsheet(&self, spreadsheet_id: Id) -> Result<HashMap<String, NamedRange>>;
    async fn update_named_range(&self, spreadsheet_id: Id, name: &str, range: NamedRange) -> Result<()>;
    async fn delete_named_range(&self, spreadsheet_id: Id, name: &str) -> Result<()>;

    // Data validation and conditional formatting
    async fn add_data_validation(&self, sheet_id: &str, range: &GridRange, validation: &DataValidationRule) -> Result<()>;
    async fn remove_data_validation(&self, sheet_id: &str, range: &GridRange) -> Result<()>;
    async fn add_conditional_formatting(&self, sheet_id: &str, rule: &ConditionalFormatRule) -> Result<()>;
    async fn remove_conditional_formatting(&self, sheet_id: &str, rule_id: &str) -> Result<()>;

    // Import/Export
    async fn import_csv(&self, spreadsheet_id: Id, sheet_id: &str, csv_data: &str, start_cell: &str) -> Result<()>;
    async fn export_csv(&self, sheet_id: &str, range: Option<&GridRange>) -> Result<String>;
    async fn import_excel(&self, spreadsheet_id: Id, excel_data: &[u8]) -> Result<Vec<String>>; // returns sheet IDs
    async fn export_excel(&self, spreadsheet_id: Id) -> Result<Vec<u8>>;

    // Collaboration and history
    async fn get_cell_history(&self, sheet_id: &str, cell_ref: &str, limit: Option<u32>) -> Result<Vec<CellHistoryEntry>>;
    async fn get_sheet_changes(&self, sheet_id: &str, since: chrono::DateTime<chrono::Utc>) -> Result<Vec<SheetChange>>;
    async fn create_snapshot(&self, spreadsheet_id: Id, description: String) -> Result<Id>;
    async fn restore_snapshot(&self, spreadsheet_id: Id, snapshot_id: Id) -> Result<()>;

    // Analytics and insights
    async fn get_spreadsheet_analytics(&self, spreadsheet_id: Id) -> Result<SpreadsheetAnalytics>;
    async fn get_formula_usage_stats(&self, spreadsheet_id: Id) -> Result<HashMap<String, u32>>;
    async fn detect_circular_references(&self, spreadsheet_id: Id) -> Result<Vec<CircularReference>>;
    async fn optimize_formulas(&self, spreadsheet_id: Id) -> Result<Vec<FormulaOptimization>>;
}

#[async_trait::async_trait]
pub trait SpreadsheetService: Send + Sync {
    // High-level spreadsheet operations
    async fn create_blank_spreadsheet(&self, document_id: Id, title: String, user_id: Id) -> Result<SpreadsheetResponse>;
    async fn create_from_template(&self, document_id: Id, template_id: Id, title: String, user_id: Id) -> Result<SpreadsheetResponse>;
    async fn get_spreadsheet(&self, spreadsheet_id: Id, user_id: Id) -> Result<Option<SpreadsheetResponse>>;
    async fn duplicate_spreadsheet(&self, spreadsheet_id: Id, new_title: String, user_id: Id) -> Result<SpreadsheetResponse>;

    // Sheet operations
    async fn add_sheet(&self, spreadsheet_id: Id, request: CreateSheetRequest, user_id: Id) -> Result<Sheet>;
    async fn rename_sheet(&self, sheet_id: &str, new_title: String, user_id: Id) -> Result<()>;
    async fn delete_sheet(&self, sheet_id: &str, user_id: Id) -> Result<()>;
    async fn protect_sheet(&self, sheet_id: &str, protection_settings: SheetProtection, user_id: Id) -> Result<()>;

    // Cell and range operations
    async fn update_cells(&self, sheet_id: &str, updates: BatchUpdateCellsRequest, user_id: Id) -> Result<()>;
    async fn insert_rows(&self, sheet_id: &str, start_index: u32, count: u32, user_id: Id) -> Result<()>;
    async fn insert_columns(&self, sheet_id: &str, start_index: u32, count: u32, user_id: Id) -> Result<()>;
    async fn delete_rows(&self, sheet_id: &str, start_index: u32, count: u32, user_id: Id) -> Result<()>;
    async fn delete_columns(&self, sheet_id: &str, start_index: u32, count: u32, user_id: Id) -> Result<()>;

    // Advanced features
    async fn create_chart(&self, spreadsheet_id: Id, request: CreateChartRequest, user_id: Id) -> Result<Chart>;
    async fn create_pivot_table(&self, spreadsheet_id: Id, request: CreatePivotTableRequest, user_id: Id) -> Result<PivotTable>;
    async fn apply_auto_filter(&self, sheet_id: &str, range: &GridRange, user_id: Id) -> Result<()>;
    async fn sort_range(&self, sheet_id: &str, range: &GridRange, sort_specs: Vec<SortSpec>, user_id: Id) -> Result<()>;

    // Data analysis
    async fn generate_summary_statistics(&self, sheet_id: &str, range: &GridRange) -> Result<SummaryStatistics>;
    async fn detect_data_patterns(&self, sheet_id: &str, range: &GridRange) -> Result<Vec<DataPattern>>;
    async fn suggest_chart_types(&self, sheet_id: &str, range: &GridRange) -> Result<Vec<ChartSuggestion>>;
    async fn auto_fill_series(&self, sheet_id: &str, source_range: &GridRange, fill_range: &GridRange) -> Result<()>;

    // Import/Export with validation
    async fn import_data(&self, spreadsheet_id: Id, data: ImportData, user_id: Id) -> Result<ImportResult>;
    async fn export_data(&self, spreadsheet_id: Id, format: ExportFormat, options: ExportOptions, user_id: Id) -> Result<ExportResult>;

    // Collaboration features
    async fn share_spreadsheet(&self, spreadsheet_id: Id, share_settings: ShareSettings, user_id: Id) -> Result<()>;
    async fn add_comment_to_cell(&self, sheet_id: &str, cell_ref: &str, comment: String, user_id: Id) -> Result<Id>;
    async fn resolve_comment(&self, comment_id: Id, user_id: Id) -> Result<()>;

    // Performance and optimization
    async fn optimize_performance(&self, spreadsheet_id: Id) -> Result<OptimizationReport>;
    async fn validate_data_integrity(&self, spreadsheet_id: Id) -> Result<ValidationReport>;
    async fn cleanup_unused_styles(&self, spreadsheet_id: Id) -> Result<u32>; // returns count of cleaned styles
}

// Supporting types for spreadsheet operations
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CellHistoryEntry {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub user_id: Id,
    pub user_name: String,
    pub old_value: Option<SpreadsheetCellValue>,
    pub new_value: SpreadsheetCellValue,
    pub formula: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SheetChange {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub user_id: Id,
    pub user_name: String,
    pub change_type: SheetChangeType,
    pub affected_range: Option<GridRange>,
    pub description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum SheetChangeType {
    CellUpdate,
    FormatChange,
    RowInsert,
    RowDelete,
    ColumnInsert,
    ColumnDelete,
    ChartAdd,
    ChartUpdate,
    ChartDelete,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SpreadsheetAnalytics {
    pub total_cells: u32,
    pub non_empty_cells: u32,
    pub formula_cells: u32,
    pub chart_count: u32,
    pub pivot_table_count: u32,
    pub most_used_functions: Vec<(String, u32)>,
    pub data_types_distribution: HashMap<String, u32>,
    pub performance_metrics: PerformanceMetrics,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PerformanceMetrics {
    pub calculation_time_ms: u32,
    pub memory_usage_mb: f64,
    pub complex_formulas_count: u32,
    pub circular_references_count: u32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CircularReference {
    pub cells: Vec<String>,
    pub description: String,
    pub severity: CircularReferenceSeverity,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum CircularReferenceSeverity {
    Warning,
    Error,
    Critical,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FormulaOptimization {
    pub cell_ref: String,
    pub current_formula: String,
    pub optimized_formula: String,
    pub performance_gain: f64, // percentage
    pub description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SheetProtection {
    pub protected: bool,
    pub password: Option<String>,
    pub allow_select_locked_cells: bool,
    pub allow_select_unlocked_cells: bool,
    pub allow_format_cells: bool,
    pub allow_format_columns: bool,
    pub allow_format_rows: bool,
    pub allow_insert_columns: bool,
    pub allow_insert_rows: bool,
    pub allow_insert_hyperlinks: bool,
    pub allow_delete_columns: bool,
    pub allow_delete_rows: bool,
    pub allow_sort: bool,
    pub allow_auto_filter: bool,
    pub allow_pivot_tables: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SortSpec {
    pub dimension_index: u32,
    pub sort_order: SortOrder,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SummaryStatistics {
    pub count: u32,
    pub sum: Option<f64>,
    pub average: Option<f64>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub median: Option<f64>,
    pub standard_deviation: Option<f64>,
    pub variance: Option<f64>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct DataPattern {
    pub pattern_type: DataPatternType,
    pub confidence: f64,
    pub description: String,
    pub suggested_action: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum DataPatternType {
    Trend,
    Seasonal,
    Outlier,
    Missing,
    Duplicate,
    Inconsistent,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChartSuggestion {
    pub chart_type: ChartType,
    pub confidence: f64,
    pub reason: String,
    pub sample_config: serde_json::Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ImportData {
    pub format: ImportFormat,
    pub data: Vec<u8>,
    pub options: ImportOptions,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ImportFormat {
    Csv,
    Excel,
    Json,
    Xml,
    Tsv,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ImportOptions {
    pub sheet_name: Option<String>,
    pub start_cell: Option<String>,
    pub has_headers: bool,
    pub delimiter: Option<char>,
    pub encoding: Option<String>,
    pub date_format: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub rows_imported: u32,
    pub columns_imported: u32,
    pub errors: Vec<ImportError>,
    pub warnings: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ImportError {
    pub row: u32,
    pub column: u32,
    pub error_type: ImportErrorType,
    pub message: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ImportErrorType {
    InvalidData,
    TypeMismatch,
    FormatError,
    ValidationError,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ExportFormat {
    Csv,
    Excel,
    Pdf,
    Json,
    Html,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExportOptions {
    pub include_formatting: bool,
    pub include_formulas: bool,
    pub include_charts: bool,
    pub sheet_selection: Option<Vec<String>>,
    pub range_selection: Option<GridRange>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub data: Vec<u8>,
    pub filename: String,
    pub content_type: String,
    pub size: u64,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ShareSettings {
    pub users: Vec<Id>,
    pub permissions: SpreadsheetPermissions,
    pub message: Option<String>,
    pub notify_users: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SpreadsheetPermissions {
    pub can_view: bool,
    pub can_edit: bool,
    pub can_comment: bool,
    pub can_share: bool,
    pub can_download: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct OptimizationReport {
    pub optimizations_applied: u32,
    pub performance_improvement: f64, // percentage
    pub memory_saved: f64, // MB
    pub recommendations: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ValidationReport {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<String>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ValidationError {
    pub error_type: ValidationErrorType,
    pub location: String, // cell reference or range
    pub message: String,
    pub severity: ValidationSeverity,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ValidationErrorType {
    CircularReference,
    InvalidFormula,
    MissingReference,
    DataTypeError,
    RangeError,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ValidationSeverity {
    Info,
    Warning,
    Error,
    Critical,
}