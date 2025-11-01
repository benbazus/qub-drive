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
}

export interface DemoScheduleRequest {
  requestId: string;
  scheduledDate: Date;
  meetingLink?: string;
  assignedTo?: string;
  notes?: string;
}