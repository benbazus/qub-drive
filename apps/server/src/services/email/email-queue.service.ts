// Simple stub for email queue service
export interface QueuedEmail {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: string;
  sendAt: Date;
  retries: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export class EmailQueueService {
  private queue: QueuedEmail[] = [];

  async queueEmail(email: QueuedEmail): Promise<void> {
    this.queue.push(email);
    console.log(`Email queued for ${email.to} - Subject: ${email.subject}`);
    
    // Simple implementation: process immediately if sendAt is in the past
    if (email.sendAt <= new Date()) {
      // In a real implementation, this would be processed by a background worker
      console.log(`Processing queued email immediately for ${email.to}`);
    }
  }

  async getQueueStatus(): Promise<{ pending: number; failed: number; processed: number }> {
    return {
      pending: this.queue.length,
      failed: 0,
      processed: 0,
    };
  }

  async close(): Promise<void> {
    this.queue = [];
  }
}