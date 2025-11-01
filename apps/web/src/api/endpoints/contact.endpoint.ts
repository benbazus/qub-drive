import { apiClient } from '../api.client';

// Type definitions
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle?: string;
  phone?: string;
  companySize?: string;
  message: string;
  planInterest: string;
}

export interface ContactSubmission extends ContactFormData {
  id: string;
  submittedAt: Date;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  assignedTo?: string;
  notes?: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  submittedAt?: Date;
}

class ContactEndpoint {
  private readonly endpoints = {
    submitContact: '/contact',
    getSubmission: (submissionId: string) => `/contact/${submissionId}`,
    getAllSubmissions: '/contact',
    updateSubmissionStatus: (submissionId: string) => `/contact/${submissionId}/status`,
    getSubmissionsByStatus: (status: string) => `/contact/status/${status}`,
    getSubmissionsByPlan: (plan: string) => `/contact/plan/${plan}`,
  };

  async submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { submissionId: string; submittedAt: Date }; 
      message: string 
    }>(this.endpoints.submitContact, formData);
    
    if (response.error || !response.data?.success) {
      throw new Error(response.error || 'Failed to submit contact form');
    }

    return {
      success: response.data.success,
      message: response.data.message,
      submissionId: response.data.data.submissionId,
      submittedAt: response.data.data.submittedAt
    };
  }

  async getSubmission(submissionId: string): Promise<ContactSubmission> {
    const response = await apiClient.get<{ success: boolean; data: ContactSubmission }>(
      this.endpoints.getSubmission(submissionId)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get contact submission');
    }
    return response.data.data;
  }

  async getAllSubmissions(): Promise<ContactSubmission[]> {
    const response = await apiClient.get<{ success: boolean; data: ContactSubmission[] }>(
      this.endpoints.getAllSubmissions
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get contact submissions');
    }
    return response.data.data;
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: ContactSubmission['status'],
    assignedTo?: string,
    notes?: string
  ): Promise<ContactSubmission> {
    const response = await apiClient.put<{ success: boolean; data: ContactSubmission }>(
      this.endpoints.updateSubmissionStatus(submissionId),
      { status, assignedTo, notes }
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update submission status');
    }
    return response.data.data;
  }

  async getSubmissionsByStatus(status: ContactSubmission['status']): Promise<ContactSubmission[]> {
    const response = await apiClient.get<{ success: boolean; data: ContactSubmission[] }>(
      this.endpoints.getSubmissionsByStatus(status)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get submissions by status');
    }
    return response.data.data;
  }

  async getSubmissionsByPlan(plan: string): Promise<ContactSubmission[]> {
    const response = await apiClient.get<{ success: boolean; data: ContactSubmission[] }>(
      this.endpoints.getSubmissionsByPlan(plan)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get submissions by plan');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const contactEndpoint = new ContactEndpoint();
export default contactEndpoint;