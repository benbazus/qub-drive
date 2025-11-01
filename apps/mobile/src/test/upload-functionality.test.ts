import { uploadManager } from '@/services/uploadManager'
import { uploadQueueStore } from '@/stores/uploadQueue/uploadQueueStore'
import { fileApi } from '@/services/api/fileApi'
import NetInfo from '@react-native-community/netinfo'

// Mock dependencies
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}))

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
}))

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: {
    NewData: 'newData',
    Failed: 'failed',
  },
}))

jest.mock('@react-native-community/netinfo')

jest.mock('@/services/api/fileApi')

jest.mock('@/utils/storage', () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock fetch for file URI reading
global.fetch = jest.fn()

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>
const mockFileApi = fileApi as jest.Mocked<typeof fileApi>

describe('Upload Functionality Tests', () => {
  beforeEach(() => {
    // Clear the upload queue before each test
    uploadQueueStore.getState().clearAll()
    jest.clearAllMocks()
    
    // Setup default network state
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    } as any)
    
    mockNetInfo.addEventListener.mockReturnValue(() => {})
  })

  describe('Various File Types and Sizes', () => {
    const createMockFile = (name: string, size: number, type: string) => {
      const blob = new Blob(['x'.repeat(size)], { type })
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(blob),
      })
      return {
        uri: `file://${name}`,
        fileName: name,
        size,
      }
    }

    it('should handle small text files (< 1MB)', async () => {
      await uploadManager.initialize()
      
      const smallFile = createMockFile('small.txt', 500 * 1024, 'text/plain') // 500KB
      
      mockFileApi.uploadFile.mockResolvedValue({
        id: 'file-1',
        name: 'small.txt',
        type: 'file',
        size: 500 * 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const uploadIds = await uploadManager.addToQueue([smallFile])
      expect(uploadIds).toHaveLength(1)

      // Wait for upload to process
      await new Promise(resolve => setTimeout(resolve, 100))

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(1)
    })

    it('should handle medium image files (1-10MB)', async () => {
      await uploadManager.initialize()
      
      const imageFile = createMockFile('image.jpg', 5 * 1024 * 1024, 'image/jpeg') // 5MB
      
      mockFileApi.uploadFile.mockResolvedValue({
        id: 'file-2',
        name: 'image.jpg',
        type: 'file',
        size: 5 * 1024 * 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const uploadIds = await uploadManager.addToQueue([imageFile])
      expect(uploadIds).toHaveLength(1)

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(1)
      expect(stats.pending).toBe(1)
    })

    it('should handle large video files (> 10MB)', async () => {
      await uploadManager.initialize()
      
      const videoFile = createMockFile('video.mp4', 50 * 1024 * 1024, 'video/mp4') // 50MB
      
      mockFileApi.uploadFile.mockResolvedValue({
        id: 'file-3',
        name: 'video.mp4',
        type: 'file',
        size: 50 * 1024 * 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const uploadIds = await uploadManager.addToQueue([videoFile])
      expect(uploadIds).toHaveLength(1)

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(1)
      expect(stats.pending).toBe(1)
    })

    it('should handle multiple file types simultaneously', async () => {
      await uploadManager.initialize()
      
      const files = [
        createMockFile('document.pdf', 2 * 1024 * 1024, 'application/pdf'), // 2MB PDF
        createMockFile('photo.png', 3 * 1024 * 1024, 'image/png'), // 3MB PNG
        createMockFile('audio.mp3', 4 * 1024 * 1024, 'audio/mpeg'), // 4MB MP3
        createMockFile('archive.zip', 10 * 1024 * 1024, 'application/zip'), // 10MB ZIP
      ]
      
      mockFileApi.uploadFile.mockImplementation((file, fileName) => 
        Promise.resolve({
          id: `file-${fileName}`,
          name: fileName,
          type: 'file',
          size: files.find(f => f.fileName === fileName)?.size || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )

      const uploadIds = await uploadManager.addToQueue(files)
      expect(uploadIds).toHaveLength(4)

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(4)
    })

    it('should handle zero-byte files', async () => {
      await uploadManager.initialize()
      
      const emptyFile = createMockFile('empty.txt', 0, 'text/plain')
      
      mockFileApi.uploadFile.mockResolvedValue({
        id: 'file-empty',
        name: 'empty.txt',
        type: 'file',
        size: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const uploadIds = await uploadManager.addToQueue([emptyFile])
      expect(uploadIds).toHaveLength(1)

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(1)
    })

    it('should handle files with special characters in names', async () => {
      await uploadManager.initialize()
      
      const specialFile = createMockFile('file with spaces & symbols (1).txt', 1024, 'text/plain')
      
      mockFileApi.uploadFile.mockResolvedValue({
        id: 'file-special',
        name: 'file with spaces & symbols (1).txt',
        type: 'file',
        size: 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const uploadIds = await uploadManager.addToQueue([specialFile])
      expect(uploadIds).toHaveLength(1)

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('Progress Tracking Accuracy', () => {
    it('should track upload progress from 0 to 100%', async () => {
      await uploadManager.initialize()
      
      const file = {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      }

      const progressUpdates: number[] = []
      
      mockFileApi.uploadFile.mockImplementation((file, fileName, parentId, options) => {
        // Simulate progress updates
        const progressSteps = [0, 25, 50, 75, 100]
        progressSteps.forEach((progress, index) => {
          setTimeout(() => {
            if (options?.onProgress) {
              options.onProgress({
                id: 'test-upload',
                fileName,
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
                loaded: (progress / 100) * 1024,
                total: 1024,
              })
              progressUpdates.push(progress)
            }
          }, index * 10)
        })

        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: 'file-test',
              name: fileName,
              type: 'file',
              size: 1024,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }, 50)
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue([file])
      
      // Wait for progress updates
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(progressUpdates).toEqual([0, 25, 50, 75, 100])
    })

    it('should calculate accurate progress for multiple files', async () => {
      await uploadManager.initialize()
      
      const files = [
        { uri: 'file://file1.txt', fileName: 'file1.txt', size: 1000 },
        { uri: 'file://file2.txt', fileName: 'file2.txt', size: 2000 },
      ]

      let totalProgressUpdates: number[] = []
      
      mockFileApi.uploadFile.mockImplementation((file, fileName, parentId, options) => {
        const fileSize = files.find(f => f.fileName === fileName)?.size || 1000
        
        // Simulate progress for individual file
        setTimeout(() => {
          if (options?.onProgress) {
            options.onProgress({
              id: `upload-${fileName}`,
              fileName,
              progress: 50,
              status: 'uploading',
              loaded: fileSize / 2,
              total: fileSize,
            })
          }
        }, 10)

        setTimeout(() => {
          if (options?.onProgress) {
            options.onProgress({
              id: `upload-${fileName}`,
              fileName,
              progress: 100,
              status: 'completed',
              loaded: fileSize,
              total: fileSize,
            })
          }
        }, 20)

        return Promise.resolve({
          id: `file-${fileName}`,
          name: fileName,
          type: 'file',
          size: fileSize,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue(files)
      
      // Wait for uploads to process
      await new Promise(resolve => setTimeout(resolve, 50))

      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(2)
    })

    it('should handle progress updates with varying file sizes', async () => {
      await uploadManager.initialize()
      
      const files = [
        { uri: 'file://small.txt', fileName: 'small.txt', size: 100 },
        { uri: 'file://large.txt', fileName: 'large.txt', size: 10000 },
      ]

      const progressMap = new Map<string, number[]>()
      
      mockFileApi.uploadFile.mockImplementation((file, fileName, parentId, options) => {
        const fileSize = files.find(f => f.fileName === fileName)?.size || 100
        progressMap.set(fileName, [])
        
        // Simulate different progress rates for different file sizes
        const steps = fileSize > 1000 ? [0, 20, 40, 60, 80, 100] : [0, 50, 100]
        
        steps.forEach((progress, index) => {
          setTimeout(() => {
            if (options?.onProgress) {
              options.onProgress({
                id: `upload-${fileName}`,
                fileName,
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
                loaded: (progress / 100) * fileSize,
                total: fileSize,
              })
              progressMap.get(fileName)?.push(progress)
            }
          }, index * 5)
        })

        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: `file-${fileName}`,
              name: fileName,
              type: 'file',
              size: fileSize,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }, steps.length * 5 + 10)
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue(files)
      
      // Wait for all progress updates
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(progressMap.get('small.txt')).toEqual([0, 50, 100])
      expect(progressMap.get('large.txt')).toEqual([0, 20, 40, 60, 80, 100])
    })
  })

  describe('Network Interruption Scenarios', () => {
    it('should pause uploads when network is lost', async () => {
      await uploadManager.initialize()
      
      const file = {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      }

      // Start with network connected
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      } as any)

      let networkListener: ((state: any) => void) | null = null
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener
        return () => {}
      })

      mockFileApi.uploadFile.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          // Simulate network loss during upload
          setTimeout(() => {
            if (networkListener) {
              networkListener({
                isConnected: false,
                type: 'none',
                isInternetReachable: false,
              })
            }
            reject(new Error('Network error'))
          }, 50)
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue([file])
      
      // Wait for network interruption
      await new Promise(resolve => setTimeout(resolve, 100))

      const networkStatus = uploadManager.getNetworkStatus()
      expect(networkStatus.isConnected).toBe(false)
    })

    it('should resume uploads when network reconnects', async () => {
      await uploadManager.initialize()
      
      const file = {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      }

      let networkListener: ((state: any) => void) | null = null
      let uploadAttempts = 0
      
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener
        return () => {}
      })

      mockFileApi.uploadFile.mockImplementation(() => {
        uploadAttempts++
        
        if (uploadAttempts === 1) {
          // First attempt fails due to network
          return Promise.reject(new Error('Network error'))
        } else {
          // Second attempt succeeds after reconnection
          return Promise.resolve({
            id: 'file-test',
            name: 'test.txt',
            type: 'file',
            size: 1024,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      // Start with network disconnected
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      } as any)

      await uploadManager.addToQueue([file])
      
      // Simulate network reconnection
      setTimeout(() => {
        if (networkListener) {
          networkListener({
            isConnected: true,
            type: 'wifi',
            isInternetReachable: true,
          })
        }
      }, 50)

      // Wait for reconnection and retry
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(uploadAttempts).toBeGreaterThan(1)
    })

    it('should handle intermittent network connectivity', async () => {
      await uploadManager.initialize()
      
      const files = [
        { uri: 'file://file1.txt', fileName: 'file1.txt', size: 1024 },
        { uri: 'file://file2.txt', fileName: 'file2.txt', size: 1024 },
        { uri: 'file://file3.txt', fileName: 'file3.txt', size: 1024 },
      ]

      let networkListener: ((state: any) => void) | null = null
      let uploadAttempts = 0
      
      mockNetInfo.addEventListener.mockImplementation((listener) => {
        networkListener = listener
        return () => {}
      })

      mockFileApi.uploadFile.mockImplementation((file, fileName) => {
        uploadAttempts++
        
        // Simulate intermittent failures
        if (uploadAttempts % 2 === 0) {
          return Promise.reject(new Error('Network timeout'))
        } else {
          return Promise.resolve({
            id: `file-${fileName}`,
            name: fileName,
            type: 'file',
            size: 1024,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue(files)
      
      // Simulate network fluctuations
      const networkStates = [
        { isConnected: true, type: 'wifi' },
        { isConnected: false, type: 'none' },
        { isConnected: true, type: 'cellular' },
        { isConnected: false, type: 'none' },
        { isConnected: true, type: 'wifi' },
      ]

      for (let i = 0; i < networkStates.length; i++) {
        setTimeout(() => {
          if (networkListener) {
            networkListener({
              ...networkStates[i],
              isInternetReachable: networkStates[i].isConnected,
            })
          }
        }, i * 30)
      }

      // Wait for all network changes and retries
      await new Promise(resolve => setTimeout(resolve, 300))

      expect(uploadAttempts).toBeGreaterThan(files.length)
    })

    it('should respect retry limits during network issues', async () => {
      await uploadManager.initialize({
        maxRetries: 2,
        retryOnNetworkReconnect: true,
      })
      
      const file = {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      }

      let uploadAttempts = 0
      
      mockFileApi.uploadFile.mockImplementation(() => {
        uploadAttempts++
        return Promise.reject(new Error('Network error'))
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue([file])
      
      // Wait for all retry attempts
      await new Promise(resolve => setTimeout(resolve, 500))

      // Should attempt initial upload + 2 retries = 3 total attempts
      expect(uploadAttempts).toBeLessThanOrEqual(3)
      
      const stats = uploadManager.getUploadStats()
      expect(stats.failed).toBe(1)
    })

    it('should handle slow network conditions', async () => {
      await uploadManager.initialize()
      
      const file = {
        uri: 'file://large-file.txt',
        fileName: 'large-file.txt',
        size: 10 * 1024 * 1024, // 10MB
      }

      const progressUpdates: number[] = []
      
      mockFileApi.uploadFile.mockImplementation((file, fileName, parentId, options) => {
        // Simulate slow upload with irregular progress
        const progressSteps = [0, 5, 12, 18, 25, 35, 42, 58, 67, 78, 89, 95, 100]
        
        progressSteps.forEach((progress, index) => {
          setTimeout(() => {
            if (options?.onProgress) {
              options.onProgress({
                id: 'slow-upload',
                fileName,
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
                loaded: (progress / 100) * (10 * 1024 * 1024),
                total: 10 * 1024 * 1024,
              })
              progressUpdates.push(progress)
            }
          }, index * 100) // Slow progress updates
        })

        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: 'file-large',
              name: fileName,
              type: 'file',
              size: 10 * 1024 * 1024,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }, progressSteps.length * 100 + 50)
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['x'.repeat(10 * 1024 * 1024)], { type: 'text/plain' })),
      })

      await uploadManager.addToQueue([file])
      
      // Wait for slow upload to complete
      await new Promise(resolve => setTimeout(resolve, 1500))

      expect(progressUpdates.length).toBeGreaterThan(5)
      expect(progressUpdates[0]).toBe(0)
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    })
  })

  describe('Upload Queue Management During Network Issues', () => {
    it('should maintain queue state during network interruptions', async () => {
      await uploadManager.initialize()
      
      const files = [
        { uri: 'file://file1.txt', fileName: 'file1.txt', size: 1024 },
        { uri: 'file://file2.txt', fileName: 'file2.txt', size: 1024 },
      ]

      // Simulate network disconnection
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      } as any)

      await uploadManager.addToQueue(files)
      
      const stats = uploadManager.getUploadStats()
      expect(stats.total).toBe(2)
      expect(stats.pending).toBe(2)
      
      // Queue should be maintained even without network
      expect(uploadQueueStore.getState().queue).toHaveLength(2)
    })

    it('should handle upload cancellation during network issues', async () => {
      await uploadManager.initialize()
      
      const file = {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      }

      mockFileApi.uploadFile.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          // Never resolve to simulate hanging upload
        })
      })

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
      })

      const uploadIds = await uploadManager.addToQueue([file])
      
      // Cancel upload during network issues
      await uploadManager.cancelUpload(uploadIds[0])
      
      const item = uploadQueueStore.getState().getItem(uploadIds[0])
      expect(item?.status).toBe('cancelled')
    })
  })
})