import { Request, Response } from 'express';
import planService from '../services/plan.service';
import { CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../types/plan.types';

export class PlanController {
  async getAllPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await planService.getAllPlans();

      res.status(200).json({
        success: true,
        data: plans,
        message: 'Plans retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting plans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const plan = await planService.getPlanById(planId);

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Plan not found',
          message: `Plan with ID ${planId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: plan,
        message: 'Plan retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const subscription = await planService.getUserSubscription(userId);

      res.status(200).json({
        success: true,
        data: subscription,
        message: subscription ? 'Subscription retrieved successfully' : 'No active subscription found'
      });
    } catch (error) {
      console.error('Error getting user subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const request: CreateSubscriptionRequest = req.body;

      // Validate required fields
      if (!request.planId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Plan ID is required'
        });
        return;
      }

      // Check if user already has an active subscription
      const existingSubscription = await planService.getUserSubscription(userId);
      if (existingSubscription) {
        res.status(409).json({
          success: false,
          error: 'Subscription exists',
          message: 'User already has an active subscription'
        });
        return;
      }

      const subscription = await planService.createSubscription(userId, request);

      res.status(201).json({
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const { subscriptionId } = req.params;
      const request: UpdateSubscriptionRequest = req.body;

      const subscription = await planService.updateSubscription(subscriptionId, request);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: `Subscription with ID ${subscriptionId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const { subscriptionId } = req.params;

      const subscription = await planService.cancelSubscription(subscriptionId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: `Subscription with ID ${subscriptionId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPlanFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const features = await planService.getPlanFeatures(planId);

      res.status(200).json({
        success: true,
        data: { features },
        message: 'Plan features retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting plan features:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve plan features',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async validateUserAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const { feature } = req.query;
      if (!feature || typeof feature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Feature parameter is required'
        });
        return;
      }

      const hasAccess = await planService.validateUserAccess(userId, feature);

      res.status(200).json({
        success: true,
        data: { hasAccess, feature },
        message: 'Access validation completed'
      });
    } catch (error) {
      console.error('Error validating user access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate user access',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}