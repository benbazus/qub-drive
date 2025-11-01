import { DemoRequestData, DemoRequest, DemoScheduleRequest } from '../types/demo.types';

import { EmailServiceFactory } from './email/email-service.factory';

class DemoService {
  private requests: Map<string, DemoRequest> = new Map();
  private emailService = EmailServiceFactory.create();

  async submitDemoRequest(requestData: DemoRequestData): Promise<DemoRequest> {
    const requestId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const request: DemoRequest = {
      ...requestData,
      id: requestId,
      submittedAt: new Date(),
      status: 'pending'
    };

    // Store the request
    this.requests.set(requestId, request);

    // Send notification email to sales team
    await this.sendSalesNotification(request);

    // Send confirmation email to the customer
    await this.sendCustomerConfirmation(request);

    return request;
  }

  async getDemoRequest(requestId: string): Promise<DemoRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async getAllDemoRequests(): Promise<DemoRequest[]> {
    return Array.from(this.requests.values()).sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
  }

  async updateDemoStatus(
    requestId: string,
    status: DemoRequest['status'],
    assignedTo?: string,
    notes?: string
  ): Promise<DemoRequest | null> {
    const request = this.requests.get(requestId);
    if (!request) {
      return null;
    }

    request.status = status;
    if (assignedTo) request.assignedTo = assignedTo;
    if (notes) request.notes = notes;

    this.requests.set(requestId, request);
    return request;
  }

  async scheduleDemoRequest(scheduleData: DemoScheduleRequest): Promise<DemoRequest | null> {
    const request = this.requests.get(scheduleData.requestId);
    if (!request) {
      return null;
    }

    request.status = 'scheduled';
    request.scheduledDate = scheduleData.scheduledDate;
    request.meetingLink = scheduleData.meetingLink;
    request.assignedTo = scheduleData.assignedTo;
    if (scheduleData.notes) request.notes = scheduleData.notes;

    this.requests.set(scheduleData.requestId, request);

    // Send scheduled demo confirmation to customer
    await this.sendDemoScheduledConfirmation(request);

    return request;
  }

  private async sendSalesNotification(request: DemoRequest): Promise<void> {
    try {
      await this.emailService.sendDemoRequestNotificationEmail(
        process.env.SALES_EMAIL || 'sales@loveworld.com',
        {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          company: request.company,
          jobTitle: request.jobTitle,
          phone: request.phone,
          companySize: request.companySize,
          planInterest: request.planInterest,
          demoType: request.demoType,
          useCase: request.useCase,
          preferredDate: request.preferredDate,
          preferredTime: request.preferredTime,
          message: request.message,
          requestId: request.id,
          submittedAt: request.submittedAt
        }
      );
    } catch (error) {
      console.error('Failed to send sales notification:', error);
    }
  }

  private async sendCustomerConfirmation(request: DemoRequest): Promise<void> {
    try {
      await this.emailService.sendDemoRequestConfirmationEmail(
        request.email,
        {
          firstName: request.firstName,
          lastName: request.lastName,
          demoType: request.demoType,
          planInterest: request.planInterest,
          company: request.company,
          useCase: request.useCase,
          preferredDate: request.preferredDate,
          preferredTime: request.preferredTime,
          requestId: request.id
        }
      );
    } catch (error) {
      console.error('Failed to send customer confirmation:', error);
    }
  }

  private async sendDemoScheduledConfirmation(request: DemoRequest): Promise<void> {
    if (!request.scheduledDate) {
      console.error('Cannot send demo scheduled confirmation: scheduledDate is missing');
      return;
    }

    try {
      await this.emailService.sendDemoScheduledEmail(
        request.email,
        {
          firstName: request.firstName,
          planInterest: request.planInterest,
          company: request.company,
          useCase: request.useCase,
          scheduledDate: request.scheduledDate,
          requestId: request.id,
          meetingLink: request.meetingLink,
          assignedTo: request.assignedTo,
          lastName: request.lastName,
        }
      );
    } catch (error) {
      console.error('Failed to send demo scheduled confirmation:', error);
    }
  }

  async getDemoRequestsByStatus(status: DemoRequest['status']): Promise<DemoRequest[]> {
    return Array.from(this.requests.values())
      .filter(request => request.status === status)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async getDemoRequestsByType(demoType: DemoRequest['demoType']): Promise<DemoRequest[]> {
    return Array.from(this.requests.values())
      .filter(request => request.demoType === demoType)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async getDemoRequestsByPlan(planInterest: string): Promise<DemoRequest[]> {
    return Array.from(this.requests.values())
      .filter(request => request.planInterest.toLowerCase() === planInterest.toLowerCase())
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }
}

export default new DemoService();