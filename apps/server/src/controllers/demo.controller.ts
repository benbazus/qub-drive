import { Request, Response } from 'express';
import demoService from '../services/demo.service';
import { DemoRequestData, DemoScheduleRequest } from '../types/demo.types';

export class DemoController {
  async submitDemoRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData: DemoRequestData = req.body;

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'company', 'companySize', 'useCase', 'demoType', 'planInterest'];
      const missingFields = requiredFields.filter(field => !requestData[field as keyof DemoRequestData]);

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(requestData.email)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid email format'
        });
        return;
      }

      // Validate demo type
      const validDemoTypes = ['live', 'recorded', 'trial'];
      if (!validDemoTypes.includes(requestData.demoType)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid demo type. Must be one of: ${validDemoTypes.join(', ')}`
        });
        return;
      }

      const request = await demoService.submitDemoRequest(requestData);

      res.status(201).json({
        success: true,
        data: {
          requestId: request.id,
          submittedAt: request.submittedAt
        },
        message: 'Demo request submitted successfully. We will contact you within 24 hours.'
      });
    } catch (error) {
      console.error('Error submitting demo request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit demo request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDemoRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const request = await demoService.getDemoRequest(requestId);

      if (!request) {
        res.status(404).json({
          success: false,
          error: 'Request not found',
          message: `Demo request with ID ${requestId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
        message: 'Demo request retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting demo request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demo request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAllDemoRequests(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view all demo requests'
        });
        return;
      }

      const requests = await demoService.getAllDemoRequests();

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Demo requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting all demo requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demo requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateDemoStatus(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to update demo requests'
        });
        return;
      }

      const { requestId } = req.params;
      const { status, assignedTo, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Status is required'
        });
        return;
      }

      const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const request = await demoService.updateDemoStatus(
        requestId,
        status,
        assignedTo,
        notes
      );

      if (!request) {
        res.status(404).json({
          success: false,
          error: 'Request not found',
          message: `Demo request with ID ${requestId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
        message: 'Demo request status updated successfully'
      });
    } catch (error) {
      console.error('Error updating demo request status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update demo request status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async scheduleDemoRequest(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to schedule demos'
        });
        return;
      }

      const { requestId } = req.params;
      const scheduleData: Omit<DemoScheduleRequest, 'requestId'> = req.body;

      if (!scheduleData.scheduledDate) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Scheduled date is required'
        });
        return;
      }

      const request = await demoService.scheduleDemoRequest({
        requestId,
        ...scheduleData,
        scheduledDate: new Date(scheduleData.scheduledDate)
      });

      if (!request) {
        res.status(404).json({
          success: false,
          error: 'Request not found',
          message: `Demo request with ID ${requestId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
        message: 'Demo scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling demo request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule demo request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDemoRequestsByStatus(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view demo requests'
        });
        return;
      }

      const { status } = req.params;
      const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const requests = await demoService.getDemoRequestsByStatus(status as any);

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Demo requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting demo requests by status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demo requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDemoRequestsByType(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view demo requests'
        });
        return;
      }

      const { type } = req.params;
      const validTypes = ['live', 'recorded', 'trial'];

      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid demo type. Must be one of: ${validTypes.join(', ')}`
        });
        return;
      }

      const requests = await demoService.getDemoRequestsByType(type as any);

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Demo requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting demo requests by type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demo requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getDemoRequestsByPlan(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view demo requests'
        });
        return;
      }

      const { plan } = req.params;
      const requests = await demoService.getDemoRequestsByPlan(plan);

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Demo requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting demo requests by plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demo requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}