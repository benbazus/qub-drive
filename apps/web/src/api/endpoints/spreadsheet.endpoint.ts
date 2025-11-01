import { apiClient } from "../api.client";


export interface SpreadsheetData {
  id: string;
  token: string;
  title: string;
  cells: Record<string, any>;
  metadata?: Record<string, any>;
  isPublic: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  lastSaved: string;
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  collaborators?: Array<{
    id: string;
    userId: string;
    permission: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
  permission?: string;
}

export interface SpreadsheetVersion {
  id: string;
  spreadsheetId: string;
  versionNumber: number;
  cells: Record<string, any>;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateSpreadsheetRequest {
  token: string;
  title?: string;
  cells?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateSpreadsheetRequest {
  title?: string;
  cells?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface GrantAccessRequest {
  userId: string;
  permission: 'VIEW' | 'EDIT' | 'ADMIN';
}

class SpreadsheetAPI {
  private baseURL = '/spreadsheet';

  // Get spreadsheet by token
  async getSpreadsheet(token: string): Promise<SpreadsheetData> {
    const response = await apiClient.get(`${this.baseURL}/${token}`);
    return response.data;
  }

  // Create or update spreadsheet
  async createOrUpdateSpreadsheet(token: string, data: CreateSpreadsheetRequest): Promise<SpreadsheetData> {
    const response = await apiClient.post(`${this.baseURL}/${token}`, data);
    return response.data;
  }

  // Update spreadsheet
  async updateSpreadsheet(token: string, data: UpdateSpreadsheetRequest): Promise<SpreadsheetData> {
    const response = await apiClient.put(`${this.baseURL}/${token}`, data);
    return response.data;
  }

  // Save spreadsheet (convenience method for updating cells)
  async saveSpreadsheet(token: string, cells: Record<string, any>, metadata?: Record<string, any>): Promise<SpreadsheetData> {
    return this.updateSpreadsheet(token, { cells, metadata });
  }

  // Grant access to user
  async grantAccess(token: string, data: GrantAccessRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.baseURL}/${token}/access`, data);
    return response.data;
  }

  // Revoke access from user
  async revokeAccess(token: string, userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`${this.baseURL}/${token}/access/${userId}`);
    return response.data;
  }

  // Get spreadsheet versions
  async getVersions(token: string): Promise<SpreadsheetVersion[]> {
    const response = await apiClient.get(`${this.baseURL}/${token}/versions`);
    return response.data;
  }

  // Get spreadsheet collaborators
  async getCollaborators(token: string): Promise<Array<{
    id: string;
    email: string;
    name: string;
    permission: string;
    status: string;
    isOwner: boolean;
    grantedAt?: string;
  }>> {
    const response = await apiClient.get(`${this.baseURL}/${token}/collaborators`);
    return response.data;
  }

  // Delete spreadsheet
  async deleteSpreadsheet(token: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`${this.baseURL}/${token}`);
    return response.data;
  }
}

export const spreadsheetAPI = new SpreadsheetAPI();