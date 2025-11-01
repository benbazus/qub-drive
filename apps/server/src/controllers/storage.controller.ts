import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/database.config';
import { StorageService } from '@/services/storage.service';
//import storageService from '../services/storage.service';

export interface StorageBreakdown {
  documents: string;
  images: string;
  videos: string;
  audio: string;
}

export interface StorageData {
  usedStorage: string;
  totalStorage: string;
  breakdown: StorageBreakdown;
}

export class StorageController {

  private storageService: StorageService;

  constructor() {

    this.storageService = new StorageService();
  }


  public getStorageStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const storageData = await this.storageService.calculateUserStorage(userId);

      // console.log(" 0000000000000000000000000000 ")
      // console.log(storageData)
      // console.log(" 0000000000000000000000000000 ")

      res.status(200).json({
        success: true,
        data: storageData
      });

    } catch (error) {
      console.error('Error fetching storage stats:', error);
      res.status(500).json({
        error: 'Failed to fetch storage statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }



  public getDetailedStorageStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const [storageData, additionalStats] = await Promise.all([
        this.storageService.calculateUserStorage(userId),
        this.storageService.getAdditionalStorageStats(userId)
      ]);

      res.status(200).json({
        success: true,
        data: {
          ...storageData,
          additional: additionalStats
        }
      });

    } catch (error) {
      console.error('Error fetching detailed storage stats:', error);
      res.status(500).json({
        error: 'Failed to fetch detailed storage statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }



  public getStorageByDateRange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const whereClause: any = {
        userId: userId,
        isDeleted: false,
        isTemporary: false,
        isFolder: false
      };

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const files = await prisma.file.findMany({
        where: whereClause,
        select: {
          fileSize: true,
          createdAt: true,
          mimeType: true,
          contentType: true
        }
      });

      let totalBytes = 0n;
      files.forEach(file => {
        if (file.fileSize) {
          totalBytes += file.fileSize;
        }
      });

      const totalGB = Math.round(Number(totalBytes) / (1024 * 1024 * 1024) * 10) / 10;

      res.status(200).json({
        success: true,
        data: {
          usedStorage: totalGB,
          fileCount: files.length,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      });

    } catch (error) {
      console.error('Error fetching storage by date range:', error);
      res.status(500).json({
        error: 'Failed to fetch storage by date range',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}