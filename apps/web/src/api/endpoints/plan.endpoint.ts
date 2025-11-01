import { apiClient } from '../api.client';

// Type definitions
export interface Plan {
  id: string;
  name: 'Personal' | 'Pro' | 'Enterprise';
  price: string;
  monthlyPrice: number;
  storage: string;
  features: string[];
  popular?: boolean;
  description: string;
  buttonText: string;
}

export interface PlanSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId?: string;
  trialDays?: number;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  status?: 'active' | 'inactive' | 'cancelled';
}

class PlanEndpoint {
  private readonly endpoints = {
    plans: '/plans',
    planById: (planId: string) => `/plans/${planId}`,
    planFeatures: (planId: string) => `/plans/${planId}/features`,
    userSubscription: '/subscriptions/me',
    createSubscription: '/subscriptions',
    updateSubscription: (subscriptionId: string) => `/subscriptions/${subscriptionId}`,
    cancelSubscription: (subscriptionId: string) => `/subscriptions/${subscriptionId}`,
    validateAccess: '/access/validate',
  };

  async getAllPlans(): Promise<Plan[]> {
    const response = await apiClient.get<{ success: boolean; data: Plan[] }>(this.endpoints.plans);
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get plans');
    }
    return response.data.data;
  }

  async getPlanById(planId: string): Promise<Plan> {
    const response = await apiClient.get<{ success: boolean; data: Plan }>(
      this.endpoints.planById(planId)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get plan');
    }
    return response.data.data;
  }

  async getPlanFeatures(planId: string): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean; data: { features: string[] } }>(
      this.endpoints.planFeatures(planId)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get plan features');
    }
    return response.data.data.features;
  }

  async getUserSubscription(): Promise<PlanSubscription | null> {
    const response = await apiClient.get<{ success: boolean; data: PlanSubscription | null }>(
      this.endpoints.userSubscription
    );
    if (response.error || !response.data?.success) {
      throw new Error(response.error || 'Failed to get user subscription');
    }
    return response.data.data;
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<PlanSubscription> {
    const response = await apiClient.post<{ success: boolean; data: PlanSubscription }>(
      this.endpoints.createSubscription,
      request
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to create subscription');
    }
    return response.data.data;
  }

  async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<PlanSubscription> {
    const response = await apiClient.put<{ success: boolean; data: PlanSubscription }>(
      this.endpoints.updateSubscription(subscriptionId),
      request
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update subscription');
    }
    return response.data.data;
  }

  async cancelSubscription(subscriptionId: string): Promise<PlanSubscription> {
    const response = await apiClient.delete<{ success: boolean; data: PlanSubscription }>(
      this.endpoints.cancelSubscription(subscriptionId)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to cancel subscription');
    }
    return response.data.data;
  }

  async validateUserAccess(feature: string): Promise<{ hasAccess: boolean; feature: string }> {
    const response = await apiClient.get<{ success: boolean; data: { hasAccess: boolean; feature: string } }>(
      `${this.endpoints.validateAccess}?feature=${encodeURIComponent(feature)}`
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to validate user access');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const planEndpoint = new PlanEndpoint();
export default planEndpoint;