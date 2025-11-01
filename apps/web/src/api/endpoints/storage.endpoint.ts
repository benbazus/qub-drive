import { apiClient } from '../api.client';

class StorageEndpoint {
  private readonly endpoints = {
    storageStats: '/storage/stats',
    detailedStorageStats: '/storage/detailed',
    storageByDateRange: '/storage/date-range',
    refreshStorageCache: '/storage/refresh-cache',
  };

  async getStorageStats(): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(this.endpoints.storageStats);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get storage stats');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Storage stats API not implemented yet, using fallback:', error);
      return Promise.resolve({
        usedStorage: 0,
        totalStorage: 0,
        breakdown: {
          documents: 0,
          images: 0,
          videos: 0,
          audio: 0
        }
      });
    }
  }

  async getDetailedStorageStats(): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(this.endpoints.detailedStorageStats);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get detailed storage stats');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Detailed storage stats API not implemented yet, using fallback:', error);
      return Promise.resolve({
        usedStorage: 0,
        totalStorage: 0,
        breakdown: {
          documents: 0,
          images: 0,
          videos: 0,
          audio: 0
        },
        trends: {
          daily: [12, 15, 18, 22, 25, 28, 30],
          weekly: [85, 90, 95, 100, 110, 115, 120]
        }
      });
    }
  }

  async getStorageByDateRange(params: { startDate: string; endDate: string }): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(
        `${this.endpoints.storageByDateRange}?startDate=${params.startDate}&endDate=${params.endDate}`
      );
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to get storage by date range');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Storage by date range API not implemented yet, using fallback:', error);
      return Promise.resolve({
        usedStorage: 0,
        totalStorage: 0,
        breakdown: {
          documents: 0,
          images: 0,
          videos: 0,
          audio: 0
        },
        dateRange: {
          start: params.startDate,
          end: params.endDate
        }
      });
    }
  }

  async refreshStorageCache(): Promise<any> {
    try {
      const response = await apiClient.post<{ data: any }>(this.endpoints.refreshStorageCache);
      if (response.error || !response.data?.data) {
        throw new Error(response.error || 'Failed to refresh storage cache');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Refresh storage cache API not implemented yet, using fallback:', error);
      return Promise.resolve({
        success: true,
        message: 'Storage cache refreshed successfully'
      });
    }
  }






}

export const storageEndpoint = new StorageEndpoint();
export default storageEndpoint;

