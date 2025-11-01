import { Plan, PlanSubscription, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../types/plan.types';

class PlanService {
  private plans: Plan[] = [
    {
      id: 'personal',
      name: 'Personal',
      price: 'Free',
      monthlyPrice: 0,
      storage: '5 GB',
      description: 'Perfect for personal use and small projects',
      buttonText: 'Get Started',
      features: [
        '5 GB Storage',
        'Basic File Sharing',
        'Mobile & Web Access',
        'Email Support',
        'Basic Version History',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99/mo',
      monthlyPrice: 9.99,
      storage: '1 TB',
      description: 'Ideal for professionals and growing teams',
      buttonText: 'Start Free Trial',
      popular: true,
      features: [
        '1 TB Storage',
        'Advanced Sharing Controls',
        'Full Version History',
        'Priority Support',
        'Team Collaboration',
        'Advanced Security',
        'Custom Branding',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$29.99/mo',
      monthlyPrice: 29.99,
      storage: 'Unlimited',
      description: 'Complete solution for large organizations',
      buttonText: 'Contact Sales',
      features: [
        'Unlimited Storage',
        'Advanced Admin Controls',
        'SSO Integration',
        '24/7 Phone Support',
        'Custom Integrations',
        'Compliance Tools',
        'Dedicated Account Manager',
        'Advanced Analytics',
      ],
    },
  ];

  private subscriptions: Map<string, PlanSubscription> = new Map();

  async getAllPlans(): Promise<Plan[]> {
    return this.plans;
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    const plan = this.plans.find(p => p.id === planId);
    return plan || null;
  }

  async getUserSubscription(userId: string): Promise<PlanSubscription | null> {
    // In a real implementation, this would query the database
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId && subscription.status === 'active') {
        return subscription;
      }
    }
    return null;
  }

  async createSubscription(userId: string, request: CreateSubscriptionRequest): Promise<PlanSubscription> {
    const plan = await this.getPlanById(request.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const trialEndDate = request.trialDays ? new Date(now.getTime() + request.trialDays * 24 * 60 * 60 * 1000) : undefined;

    const subscription: PlanSubscription = {
      id: subscriptionId,
      userId,
      planId: request.planId,
      status: request.trialDays ? 'trial' : 'active',
      startDate: now,
      trialEndDate,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<PlanSubscription | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return null;
    }

    if (request.planId) {
      const plan = await this.getPlanById(request.planId);
      if (!plan) {
        throw new Error('Plan not found');
      }
      subscription.planId = request.planId;
    }

    if (request.status) {
      subscription.status = request.status;
    }

    subscription.updatedAt = new Date();
    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<PlanSubscription | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return null;
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    subscription.updatedAt = new Date();
    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  async getPlanFeatures(planId: string): Promise<string[]> {
    const plan = await this.getPlanById(planId);
    return plan?.features || [];
  }

  async validateUserAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      // Check if it's a free plan feature
      const personalPlan = await this.getPlanById('personal');
      return personalPlan?.features.includes(feature) || false;
    }

    const plan = await this.getPlanById(subscription.planId);
    return plan?.features.includes(feature) || false;
  }
}

export default new PlanService();