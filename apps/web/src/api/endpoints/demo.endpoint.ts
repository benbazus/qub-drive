import { apiClient } from '../api.client';

// Type definitions
export interface DemoRequestData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle?: string;
  phone?: string;
  companySize: string;
  useCase: string;
  preferredDate?: string;
  preferredTime?: string;
  demoType: 'live' | 'recorded' | 'trial';
  message?: string;
  planInterest: string;
}

export interface DemoRequest extends DemoRequestData {
  id: string;
  submittedAt: Date;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  assignedTo?: string;
  scheduledDate?: Date;
  meetingLink?: string;
  notes?: string;
}

export interface DemoResponse {
  success: boolean;
  message: string;
  requestId?: string;
  submittedAt?: Date;
}

export interface DemoScheduleRequest {
  scheduledDate: Date;
  meetingLink?: string;
  assignedTo?: string;
  notes?: string;
}

class DemoEndpoint {
  private readonly endpoints = {
    submitDemo: '/demo',
    getDemoRequest: (requestId: string) => `/demo/${requestId}`,
    getAllDemoRequests: '/demo',
    updateDemoStatus: (requestId: string) => `/demo/${requestId}/status`,
    scheduleDemoRequest: (requestId: string) => `/demo/${requestId}/schedule`,
    getDemoRequestsByStatus: (status: string) => `/demo/status/${status}`,
    getDemoRequestsByType: (type: string) => `/demo/type/${type}`,
    getDemoRequestsByPlan: (plan: string) => `/demo/plan/${plan}`,
  };

  async submitDemoRequest(requestData: DemoRequestData): Promise<DemoResponse> {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { requestId: string; submittedAt: Date }; 
      message: string 
    }>(this.endpoints.submitDemo, requestData);
    
    if (response.error || !response.data?.success) {
      throw new Error(response.error || 'Failed to submit demo request');
    }

    return {
      success: response.data.success,
      message: response.data.message,
      requestId: response.data.data.requestId,
      submittedAt: response.data.data.submittedAt
    };
  }

  async getDemoRequest(requestId: string): Promise<DemoRequest> {
    const response = await apiClient.get<{ success: boolean; data: DemoRequest }>(
      this.endpoints.getDemoRequest(requestId)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get demo request');
    }
    return response.data.data;
  }

  async getAllDemoRequests(): Promise<DemoRequest[]> {
    const response = await apiClient.get<{ success: boolean; data: DemoRequest[] }>(
      this.endpoints.getAllDemoRequests
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get demo requests');
    }
    return response.data.data;
  }

  async updateDemoStatus(
    requestId: string,
    status: DemoRequest['status'],
    assignedTo?: string,
    notes?: string
  ): Promise<DemoRequest> {
    const response = await apiClient.put<{ success: boolean; data: DemoRequest }>(
      this.endpoints.updateDemoStatus(requestId),
      { status, assignedTo, notes }
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update demo status');
    }
    return response.data.data;
  }

  async scheduleDemoRequest(
    requestId: string,
    scheduleData: DemoScheduleRequest
  ): Promise<DemoRequest> {
    const response = await apiClient.post<{ success: boolean; data: DemoRequest }>(
      this.endpoints.scheduleDemoRequest(requestId),
      scheduleData
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to schedule demo');
    }
    return response.data.data;
  }

  async getDemoRequestsByStatus(status: DemoRequest['status']): Promise<DemoRequest[]> {
    const response = await apiClient.get<{ success: boolean; data: DemoRequest[] }>(
      this.endpoints.getDemoRequestsByStatus(status)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get demo requests by status');
    }
    return response.data.data;
  }

  async getDemoRequestsByType(type: DemoRequest['demoType']): Promise<DemoRequest[]> {
    const response = await apiClient.get<{ success: boolean; data: DemoRequest[] }>(
      this.endpoints.getDemoRequestsByType(type)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get demo requests by type');
    }
    return response.data.data;
  }

  async getDemoRequestsByPlan(plan: string): Promise<DemoRequest[]> {
    const response = await apiClient.get<{ success: boolean; data: DemoRequest[] }>(
      this.endpoints.getDemoRequestsByPlan(plan)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get demo requests by plan');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const demoEndpoint = new DemoEndpoint();
export default demoEndpoint;