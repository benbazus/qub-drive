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
    Spreadsheet, Sheet, Cell, CellValue, Chart, PivotTable, CreateSheetRequest, CreateChartRequest,
    CreatePivotTableRequest, UpdateCellRequest, BatchUpdateCellsRequest, SpreadsheetResponse,
    GridRange, CellFormat, SpreadsheetService, SpreadsheetRepository,
};

use crate::{
    error::{ApiError, ApiResult},
    middleware::auth::Claims,
    AppState,
};

// Spreadsheet CRUD endpoints
pub async fn create_spreadsheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateSpreadsheetRequest>,
) -> ApiResult<Json<SpreadsheetResponse>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let spreadsheet = if let Some(template_id) = request.template_id {
        state.spreadsheet_service.create_from_template(
            request.document_id,
            template_id,
            request.title,
            claims.user_id,
        ).await?
    } else {
        state.spreadsheet_service.create_blank_spreadsheet(
            request.document_id,
            request.title,
            claims.user_id,
        ).await?
    };
    
    Ok(Json(spreadsheet))
}

pub async fn get_spreadsheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
) -> ApiResult<Json<SpreadsheetResponse>> {
    let spreadsheet = state.spreadsheet_service.get_spreadsheet(spreadsheet_id, claims.user_id).await?
        .ok_or(ApiError::NotFound("Spreadsheet not found".to_string()))?;
    
    Ok(Json(spreadsheet))
}

pub async fn update_spreadsheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
    Json(request): Json<UpdateSpreadsheetRequest>,
) -> ApiResult<Json<SpreadsheetResponse>> {
    let mut spreadsheet = state.spreadsheet_repository.get_spreadsheet_by_id(spreadsheet_id).await?
        .ok_or(ApiError::NotFound("Spreadsheet not found".to_string()))?;
    
    // Check permissions (assuming document-level permissions)
    // TODO: Implement proper permission checking
    
    if let Some(title) = request.title {
        spreadsheet.title = title;
    }
    
    spreadsheet.updated_at = chrono::Utc::now();
    spreadsheet.version += 1;
    
    let updated_spreadsheet = state.spreadsheet_repository.update_spreadsheet(spreadsheet).await?;
    
    // Convert to response format
    let response = SpreadsheetResponse {
        id: updated_spreadsheet.id,
        title: updated_spreadsheet.title,
        sheets: updated_spreadsheet.sheets.into_iter().map(|sheet| {
            kingshare_domain::SheetResponse {
                id: sheet.id,
                title: sheet.title,
                index: sheet.index,
                grid_properties: sheet.grid_properties,
                is_hidden: sheet.is_hidden,
                tab_color: sheet.tab_color,
            }
        }).collect(),
        named_ranges: updated_spreadsheet.named_ranges,
        charts: updated_spreadsheet.charts,
        pivot_tables: updated_spreadsheet.pivot_tables,
        version: updated_spreadsheet.version,
        created_at: updated_spreadsheet.created_at,
        updated_at: updated_spreadsheet.updated_at,
    };
    
    Ok(Json(response))
}

pub async fn delete_spreadsheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
) -> ApiResult<StatusCode> {
    let spreadsheet = state.spreadsheet_repository.get_spreadsheet_by_id(spreadsheet_id).await?
        .ok_or(ApiError::NotFound("Spreadsheet not found".to_string()))?;
    
    // TODO: Check permissions
    
    state.spreadsheet_repository.delete_spreadsheet(spreadsheet_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Sheet management endpoints
pub async fn create_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
    Json(request): Json<CreateSheetRequest>,
) -> ApiResult<Json<Sheet>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let sheet = state.spreadsheet_service.add_sheet(spreadsheet_id, request, claims.user_id).await?;
    Ok(Json(sheet))
}

pub async fn get_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
) -> ApiResult<Json<Sheet>> {
    let sheet = state.spreadsheet_repository.get_sheet_by_id(&sheet_id).await?
        .ok_or(ApiError::NotFound("Sheet not found".to_string()))?;
    
    // TODO: Check permissions
    
    Ok(Json(sheet))
}

pub async fn update_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Json(request): Json<UpdateSheetRequest>,
) -> ApiResult<Json<Sheet>> {
    let mut sheet = state.spreadsheet_repository.get_sheet_by_id(&sheet_id).await?
        .ok_or(ApiError::NotFound("Sheet not found".to_string()))?;
    
    // TODO: Check permissions
    
    if let Some(title) = request.title {
        sheet.title = title;
    }
    if let Some(tab_color) = request.tab_color {
        sheet.tab_color = Some(tab_color);
    }
    if let Some(is_hidden) = request.is_hidden {
        sheet.is_hidden = is_hidden;
    }
    
    let updated_sheet = state.spreadsheet_repository.update_sheet(sheet).await?;
    Ok(Json(updated_sheet))
}

pub async fn delete_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
) -> ApiResult<StatusCode> {
    state.spreadsheet_service.delete_sheet(&sheet_id, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn duplicate_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Json(request): Json<DuplicateSheetRequest>,
) -> ApiResult<Json<Sheet>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let duplicated_sheet = state.spreadsheet_repository.duplicate_sheet(&sheet_id, request.new_title).await?;
    Ok(Json(duplicated_sheet))
}

// Cell operations endpoints
pub async fn update_cell(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((sheet_id, cell_ref)): Path<(String, String)>,
    Json(request): Json<UpdateCellRequest>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    let cell = Cell {
        value: request.value.unwrap_or(CellValue::Empty),
        formula: request.formula,
        format: request.format.unwrap_or_default(),
        note: None,
        hyperlink: None,
        data_validation: None,
    };
    
    state.spreadsheet_repository.update_cell(&sheet_id, &cell_ref, cell).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_update_cells(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Json(request): Json<BatchUpdateCellsRequest>,
) -> ApiResult<StatusCode> {
    state.spreadsheet_service.update_cells(&sheet_id, request, claims.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_cell(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((sheet_id, cell_ref)): Path<(String, String)>,
) -> ApiResult<Json<Option<Cell>>> {
    // TODO: Check permissions
    
    let cell = state.spreadsheet_repository.get_cell(&sheet_id, &cell_ref).await?;
    Ok(Json(cell))
}

pub async fn get_range(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Query(params): Query<RangeQuery>,
) -> ApiResult<Json<RangeResponse>> {
    // TODO: Check permissions
    
    let range = GridRange {
        sheet_id: sheet_id.clone(),
        start_row_index: params.start_row,
        end_row_index: params.end_row,
        start_column_index: params.start_col,
        end_column_index: params.end_col,
    };
    
    let cells = state.spreadsheet_repository.get_range(&sheet_id, &range).await?;
    
    Ok(Json(RangeResponse {
        range,
        cells: cells.into_iter().map(|row| {
            row.into_iter().map(|cell| cell.cloned()).collect()
        }).collect(),
    }))
}

pub async fn clear_range(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Json(request): Json<ClearRangeRequest>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    state.spreadsheet_repository.clear_range(&sheet_id, &request.range).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Formula and calculation endpoints
pub async fn calculate_formula(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Json(request): Json<CalculateFormulaRequest>,
) -> ApiResult<Json<CalculationResponse>> {
    // TODO: Check permissions
    
    let result = state.spreadsheet_repository.calculate_formula(&sheet_id, &request.formula).await?;
    
    Ok(Json(CalculationResponse {
        result,
        formula: request.formula,
    }))
}

pub async fn recalculate_sheet(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    state.spreadsheet_repository.recalculate_sheet(&sheet_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Chart endpoints
pub async fn create_chart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
    Json(request): Json<CreateChartRequest>,
) -> ApiResult<Json<Chart>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let chart = state.spreadsheet_service.create_chart(spreadsheet_id, request, claims.user_id).await?;
    Ok(Json(chart))
}

pub async fn get_chart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(chart_id): Path<String>,
) -> ApiResult<Json<Chart>> {
    let chart = state.spreadsheet_repository.get_chart_by_id(&chart_id).await?
        .ok_or(ApiError::NotFound("Chart not found".to_string()))?;
    
    // TODO: Check permissions
    
    Ok(Json(chart))
}

pub async fn update_chart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(chart_id): Path<String>,
    Json(request): Json<UpdateChartRequest>,
) -> ApiResult<Json<Chart>> {
    let mut chart = state.spreadsheet_repository.get_chart_by_id(&chart_id).await?
        .ok_or(ApiError::NotFound("Chart not found".to_string()))?;
    
    // TODO: Check permissions
    
    if let Some(title) = request.title {
        chart.title = title;
    }
    if let Some(chart_type) = request.chart_type {
        chart.chart_type = chart_type;
    }
    
    let updated_chart = state.spreadsheet_repository.update_chart(chart).await?;
    Ok(Json(updated_chart))
}

pub async fn delete_chart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(chart_id): Path<String>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    state.spreadsheet_repository.delete_chart(&chart_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Pivot table endpoints
pub async fn create_pivot_table(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
    Json(request): Json<CreatePivotTableRequest>,
) -> ApiResult<Json<PivotTable>> {
    request.validate().map_err(ApiError::ValidationError)?;
    
    let pivot_table = state.spreadsheet_service.create_pivot_table(spreadsheet_id, request, claims.user_id).await?;
    Ok(Json(pivot_table))
}

pub async fn get_pivot_table(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(pivot_table_id): Path<String>,
) -> ApiResult<Json<PivotTable>> {
    let pivot_table = state.spreadsheet_repository.get_pivot_table_by_id(&pivot_table_id).await?
        .ok_or(ApiError::NotFound("Pivot table not found".to_string()))?;
    
    // TODO: Check permissions
    
    Ok(Json(pivot_table))
}

pub async fn refresh_pivot_table(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(pivot_table_id): Path<String>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    state.spreadsheet_repository.refresh_pivot_table(&pivot_table_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Import/Export endpoints
pub async fn import_csv(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((spreadsheet_id, sheet_id)): Path<(Id, String)>,
    Json(request): Json<ImportCsvRequest>,
) -> ApiResult<StatusCode> {
    // TODO: Check permissions
    
    state.spreadsheet_repository.import_csv(
        spreadsheet_id,
        &sheet_id,
        &request.csv_data,
        &request.start_cell.unwrap_or_else(|| "A1".to_string()),
    ).await?;
    
    Ok(StatusCode::NO_CONTENT)
}

pub async fn export_csv(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(sheet_id): Path<String>,
    Query(params): Query<ExportQuery>,
) -> ApiResult<Json<ExportResponse>> {
    // TODO: Check permissions
    
    let range = params.range.map(|r| GridRange {
        sheet_id: sheet_id.clone(),
        start_row_index: 0, // TODO: Parse range string
        end_row_index: 100,
        start_column_index: 0,
        end_column_index: 26,
    });
    
    let csv_data = state.spreadsheet_repository.export_csv(&sheet_id, range.as_ref()).await?;
    
    Ok(Json(ExportResponse {
        data: csv_data,
        content_type: "text/csv".to_string(),
        filename: format!("{}.csv", sheet_id),
    }))
}

// Analytics endpoints
pub async fn get_spreadsheet_analytics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
) -> ApiResult<Json<kingshare_domain::SpreadsheetAnalytics>> {
    // TODO: Check permissions
    
    let analytics = state.spreadsheet_repository.get_spreadsheet_analytics(spreadsheet_id).await?;
    Ok(Json(analytics))
}

pub async fn detect_circular_references(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(spreadsheet_id): Path<Id>,
) -> ApiResult<Json<Vec<kingshare_domain::CircularReference>>> {
    // TODO: Check permissions
    
    let circular_refs = state.spreadsheet_repository.detect_circular_references(spreadsheet_id).await?;
    Ok(Json(circular_refs))
}

// Request/Response DTOs
#[derive(Debug, Deserialize, Validate)]
pub struct CreateSpreadsheetRequest {
    pub document_id: Id,
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    pub template_id: Option<Id>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSpreadsheetRequest {
    pub title: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSheetRequest {
    pub title: Option<String>,
    pub tab_color: Option<kingshare_domain::Color>,
    pub is_hidden: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct DuplicateSheetRequest {
    #[validate(length(min = 1, max = 100))]
    pub new_title: String,
}

#[derive(Debug, Deserialize)]
pub struct RangeQuery {
    pub start_row: u32,
    pub end_row: u32,
    pub start_col: u32,
    pub end_col: u32,
}

#[derive(Debug, Serialize)]
pub struct RangeResponse {
    pub range: GridRange,
    pub cells: Vec<Vec<Option<Cell>>>,
}

#[derive(Debug, Deserialize)]
pub struct ClearRangeRequest {
    pub range: GridRange,
}

#[derive(Debug, Deserialize)]
pub struct CalculateFormulaRequest {
    pub formula: String,
}

#[derive(Debug, Serialize)]
pub struct CalculationResponse {
    pub result: CellValue,
    pub formula: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateChartRequest {
    pub title: Option<String>,
    pub chart_type: Option<kingshare_domain::ChartType>,
}

#[derive(Debug, Deserialize)]
pub struct ImportCsvRequest {
    pub csv_data: String,
    pub start_cell: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ExportQuery {
    pub range: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ExportResponse {
    pub data: String,
    pub content_type: String,
    pub filename: String,
}