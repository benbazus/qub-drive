import { apiClient } from './client';
import {
  Spreadsheet,
  SpreadsheetResponse,
  SpreadsheetCreateRequest,
  SpreadsheetUpdateRequest,
  UpdateCellRequest,
  BatchUpdateCellsRequest,
  CreateSheetRequest,
  CreateChartRequest,
  CreatePivotTableRequest,
  Sheet,
  Chart,
  PivotTable,
} from '@/types/spreadsheet';

export class SpreadsheetApi {
  private static readonly BASE_PATH = '/api/spreadsheets';

  /**
   * Get all spreadsheets for the current user
   */
  static async getSpreadsheets(): Promise<SpreadsheetResponse[]> {
    const response = await apiClient.get<SpreadsheetResponse[]>(this.BASE_PATH);
    return response.data;
  }

  /**
   * Get a specific spreadsheet by ID
   */
  static async getSpreadsheet(id: string): Promise<Spreadsheet> {
    const response = await apiClient.get<Spreadsheet>(`${this.BASE_PATH}/${id}`);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Create a new spreadsheet
   */
  static async createSpreadsheet(data: SpreadsheetCreateRequest): Promise<Spreadsheet> {
    const response = await apiClient.post<Spreadsheet>(this.BASE_PATH, data);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Update spreadsheet metadata
   */
  static async updateSpreadsheet(id: string, data: SpreadsheetUpdateRequest): Promise<Spreadsheet> {
    const response = await apiClient.put<Spreadsheet>(`${this.BASE_PATH}/${id}`, data);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Delete a spreadsheet
   */
  static async deleteSpreadsheet(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Update a single cell
   */
  static async updateCell(spreadsheetId: string, data: UpdateCellRequest): Promise<void> {
    await apiClient.patch(`${this.BASE_PATH}/${spreadsheetId}/cells`, data);
  }

  /**
   * Batch update multiple cells
   */
  static async batchUpdateCells(spreadsheetId: string, data: BatchUpdateCellsRequest): Promise<void> {
    await apiClient.patch(`${this.BASE_PATH}/${spreadsheetId}/cells/batch`, data);
  }

  /**
   * Get a specific sheet from a spreadsheet
   */
  static async getSheet(spreadsheetId: string, sheetId: string): Promise<Sheet> {
    const response = await apiClient.get<Sheet>(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}`);
    return response.data;
  }

  /**
   * Create a new sheet in a spreadsheet
   */
  static async createSheet(spreadsheetId: string, data: CreateSheetRequest): Promise<Sheet> {
    const response = await apiClient.post<Sheet>(`${this.BASE_PATH}/${spreadsheetId}/sheets`, data);
    return response.data;
  }

  /**
   * Update sheet properties
   */
  static async updateSheet(spreadsheetId: string, sheetId: string, data: Partial<CreateSheetRequest>): Promise<Sheet> {
    const response = await apiClient.put<Sheet>(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}`, data);
    return response.data;
  }

  /**
   * Delete a sheet from a spreadsheet
   */
  static async deleteSheet(spreadsheetId: string, sheetId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}`);
  }

  /**
   * Create a chart in a spreadsheet
   */
  static async createChart(spreadsheetId: string, data: CreateChartRequest): Promise<Chart> {
    const response = await apiClient.post<Chart>(`${this.BASE_PATH}/${spreadsheetId}/charts`, data);
    return response.data;
  }

  /**
   * Update a chart
   */
  static async updateChart(spreadsheetId: string, chartId: string, data: Partial<CreateChartRequest>): Promise<Chart> {
    const response = await apiClient.put<Chart>(`${this.BASE_PATH}/${spreadsheetId}/charts/${chartId}`, data);
    return response.data;
  }

  /**
   * Delete a chart
   */
  static async deleteChart(spreadsheetId: string, chartId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${spreadsheetId}/charts/${chartId}`);
  }

  /**
   * Create a pivot table in a spreadsheet
   */
  static async createPivotTable(spreadsheetId: string, data: CreatePivotTableRequest): Promise<PivotTable> {
    const response = await apiClient.post<PivotTable>(`${this.BASE_PATH}/${spreadsheetId}/pivot-tables`, data);
    return response.data;
  }

  /**
   * Update a pivot table
   */
  static async updatePivotTable(spreadsheetId: string, pivotTableId: string, data: Partial<CreatePivotTableRequest>): Promise<PivotTable> {
    const response = await apiClient.put<PivotTable>(`${this.BASE_PATH}/${spreadsheetId}/pivot-tables/${pivotTableId}`, data);
    return response.data;
  }

  /**
   * Delete a pivot table
   */
  static async deletePivotTable(spreadsheetId: string, pivotTableId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${spreadsheetId}/pivot-tables/${pivotTableId}`);
  }

  /**
   * Export spreadsheet to various formats
   */
  static async exportSpreadsheet(id: string, format: 'xlsx' | 'csv' | 'pdf' | 'ods'): Promise<Blob> {
    const response = await apiClient.get(`${this.BASE_PATH}/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Import spreadsheet from file
   */
  static async importSpreadsheet(file: FormData): Promise<Spreadsheet> {
    const response = await apiClient.post<Spreadsheet>(`${this.BASE_PATH}/import`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Get spreadsheet templates
   */
  static async getTemplates(): Promise<SpreadsheetResponse[]> {
    const response = await apiClient.get<SpreadsheetResponse[]>(`${this.BASE_PATH}/templates`);
    return response.data;
  }

  /**
   * Create spreadsheet from template
   */
  static async createFromTemplate(templateId: string, data: Omit<SpreadsheetCreateRequest, 'templateId'>): Promise<Spreadsheet> {
    const response = await apiClient.post<Spreadsheet>(`${this.BASE_PATH}/templates/${templateId}`, data);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Get cell range data
   */
  static async getCellRange(spreadsheetId: string, sheetId: string, range: string): Promise<any[][]> {
    const response = await apiClient.get(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}/range`, {
      params: { range },
    });
    return response.data;
  }

  /**
   * Update cell range data
   */
  static async updateCellRange(spreadsheetId: string, sheetId: string, range: string, values: any[][]): Promise<void> {
    await apiClient.put(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}/range`, {
      range,
      values,
    });
  }

  /**
   * Calculate formula
   */
  static async calculateFormula(spreadsheetId: string, sheetId: string, formula: string): Promise<any> {
    const response = await apiClient.post(`${this.BASE_PATH}/${spreadsheetId}/sheets/${sheetId}/calculate`, {
      formula,
    });
    return response.data;
  }

  /**
   * Get formula suggestions
   */
  static async getFormulaSuggestions(query: string): Promise<any[]> {
    const response = await apiClient.get(`${this.BASE_PATH}/formulas/suggestions`, {
      params: { query },
    });
    return response.data;
  }
}