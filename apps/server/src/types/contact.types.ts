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
}