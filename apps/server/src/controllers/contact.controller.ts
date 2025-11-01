import { Request, Response } from 'express';
import contactService from '../services/contact.service';
import { ContactFormData } from '../types/contact.types';

export class ContactController {
  async submitContactForm(req: Request, res: Response): Promise<void> {
    try {
      const formData: ContactFormData = req.body;

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'company', 'message', 'planInterest'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof ContactFormData]);

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
      if (!emailRegex.test(formData.email)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid email format'
        });
        return;
      }

      const submission = await contactService.submitContactForm(formData);

      res.status(201).json({
        success: true,
        data: {
          submissionId: submission.id,
          submittedAt: submission.submittedAt
        },
        message: 'Contact form submitted successfully. We will get back to you within 24 hours.'
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit contact form',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const submission = await contactService.getSubmission(submissionId);

      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found',
          message: `Contact submission with ID ${submissionId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: submission,
        message: 'Submission retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAllSubmissions(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view all submissions'
        });
        return;
      }

      const submissions = await contactService.getAllSubmissions();

      res.status(200).json({
        success: true,
        data: submissions,
        message: 'Submissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting all submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve submissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSubmissionStatus(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to update submissions'
        });
        return;
      }

      const { submissionId } = req.params;
      const { status, assignedTo, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Status is required'
        });
        return;
      }

      const validStatuses = ['new', 'contacted', 'qualified', 'closed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const submission = await contactService.updateSubmissionStatus(
        submissionId,
        status,
        assignedTo,
        notes
      );

      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found',
          message: `Contact submission with ID ${submissionId} does not exist`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: submission,
        message: 'Submission status updated successfully'
      });
    } catch (error) {
      console.error('Error updating submission status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update submission status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSubmissionsByStatus(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view submissions'
        });
        return;
      }

      const { status } = req.params;
      const validStatuses = ['new', 'contacted', 'qualified', 'closed'];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const submissions = await contactService.getSubmissionsByStatus(status as any);

      res.status(200).json({
        success: true,
        data: submissions,
        message: 'Submissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting submissions by status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve submissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSubmissionsByPlan(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint should be protected and only accessible to admin users
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required to view submissions'
        });
        return;
      }

      const { plan } = req.params;
      const submissions = await contactService.getSubmissionsByPlan(plan);

      res.status(200).json({
        success: true,
        data: submissions,
        message: 'Submissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting submissions by plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve submissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}