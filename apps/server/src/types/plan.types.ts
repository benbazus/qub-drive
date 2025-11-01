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

export interface PlanFeature {
  id: string;
  planId: string;
  feature: string;
  enabled: boolean;
  limit?: number;
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