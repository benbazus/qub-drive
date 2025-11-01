import { uploadManager } from '@/services/uploadManager'
import { uploadQueueStore } from '@/stores/uploadQueue/uploadQueueStore'

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

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
}))

jest.mock('@/services/api/fileApi', () => ({
  fileApi: {
    uploadFile: jest.fn().mockResolvedValue({
      id: 'test-file-id',
      name: 'test-file.txt',
      type: 'file',
      size: 1024,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  },
}))

jest.mock('@/utils/storage', () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock fetch for file URI reading
global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
})

describe('UploadManager', () => {
  beforeEach(() => {
    // Clear the upload queue before each test
    uploadQueueStore.getState().clearAll()
    jest.clearAllMocks()
  })

  it('should initialize successfully', async () => {
    await uploadManager.initialize({
      maxConcurrentUploads: 2,
      enableBackgroundUploads: true,
      enableNotifications: true,
      retryOnNetworkReconnect: true,
      maxRetries: 3,
    })

    expect(uploadManager.getNetworkStatus().isConnected).toBe(true)
  })

  it('should add files to upload queue', async () => {
    await uploadManager.initialize()

    const files = [
      {
        uri: 'file://test1.txt',
        fileName: 'test1.txt',
        size: 1024,
      },
      {
        uri: 'file://test2.txt',
        fileName: 'test2.txt',
        size: 2048,
        parentId: 'parent-folder-id',
      },
    ]

    const uploadIds = await uploadManager.addToQueue(files)

    expect(uploadIds).toHaveLength(2)
    expect(uploadIds[0]).toMatch(/^upload_/)
    expect(uploadIds[1]).toMatch(/^upload_/)

    const stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(2)
    expect(stats.pending).toBe(2)
  })

  it('should get upload statistics', async () => {
    await uploadManager.initialize()

    // Initially empty
    let stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(0)
    expect(stats.pending).toBe(0)
    expect(stats.uploading).toBe(0)
    expect(stats.completed).toBe(0)
    expect(stats.failed).toBe(0)

    // Add some files
    await uploadManager.addToQueue([
      {
        uri: 'file://test1.txt',
        fileName: 'test1.txt',
        size: 1024,
      },
    ])

    stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(1)
    expect(stats.pending).toBe(1)
  })

  it('should handle network status', () => {
    const networkStatus = uploadManager.getNetworkStatus()
    
    expect(networkStatus).toHaveProperty('isConnected')
    expect(networkStatus).toHaveProperty('type')
    expect(networkStatus).toHaveProperty('isInternetReachable')
  })

  it('should clear completed uploads', async () => {
    await uploadManager.initialize()

    // Add a file and simulate completion
    await uploadManager.addToQueue([
      {
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
      },
    ])

    // Simulate completed upload by updating store directly
    const queue = uploadQueueStore.getState().queue
    if (queue.length > 0) {
      uploadQueueStore.getState().updateItem(queue[0].id, {
        status: 'completed',
        progress: { ...queue[0].progress, progress: 100, status: 'completed' },
      })
    }

    let stats = uploadManager.getUploadStats()
    expect(stats.completed).toBe(1)

    await uploadManager.clearCompleted()

    stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(0)
  })

  it('should clear all uploads', async () => {
    await uploadManager.initialize()

    await uploadManager.addToQueue([
      {
        uri: 'file://test1.txt',
        fileName: 'test1.txt',
        size: 1024,
      },
      {
        uri: 'file://test2.txt',
        fileName: 'test2.txt',
        size: 2048,
      },
    ])

    let stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(2)

    await uploadManager.clearAll()

    stats = uploadManager.getUploadStats()
    expect(stats.total).toBe(0)
  })
})

describe('UploadQueueStore', () => {
  beforeEach(() => {
    uploadQueueStore.getState().clearAll()
  })

  it('should add items to queue', () => {
    const items = [
      {
        id: 'upload-1',
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
        progress: {
          id: 'upload-1',
          fileName: 'test.txt',
          progress: 0,
          status: 'pending' as const,
          loaded: 0,
          total: 1024,
        },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    uploadQueueStore.getState().addItems(items)

    const stats = uploadQueueStore.getState().getStats()
    expect(stats.total).toBe(1)
    expect(stats.pending).toBe(1)
  })

  it('should update item status', () => {
    const items = [
      {
        id: 'upload-1',
        uri: 'file://test.txt',
        fileName: 'test.txt',
        size: 1024,
        progress: {
          id: 'upload-1',
          fileName: 'test.txt',
          progress: 0,
          status: 'pending' as const,
          loaded: 0,
          total: 1024,
        },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    uploadQueueStore.getState().addItems(items)
    uploadQueueStore.getState().updateItem('upload-1', {
      status: 'uploading',
      progress: {
        id: 'upload-1',
        fileName: 'test.txt',
        progress: 50,
        status: 'uploading',
        loaded: 512,
        total: 1024,
      },
    })

    const item = uploadQueueStore.getState().getItem('upload-1')
    expect(item?.status).toBe('uploading')
    expect(item?.progress.progress).toBe(50)
  })

  it('should calculate statistics correctly', () => {
    const items = [
      {
        id: 'upload-1',
        uri: 'file://test1.txt',
        fileName: 'test1.txt',
        size: 1024,
        progress: {
          id: 'upload-1',
          fileName: 'test1.txt',
          progress: 0,
          status: 'pending' as const,
          loaded: 0,
          total: 1024,
        },
        status: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'upload-2',
        uri: 'file://test2.txt',
        fileName: 'test2.txt',
        size: 2048,
        progress: {
          id: 'upload-2',
          fileName: 'test2.txt',
          progress: 100,
          status: 'completed' as const,
          loaded: 2048,
          total: 2048,
        },
        status: 'completed' as const,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    uploadQueueStore.getState().addItems(items)

    const stats = uploadQueueStore.getState().getStats()
    expect(stats.total).toBe(2)
    expect(stats.pending).toBe(1)
    expect(stats.completed).toBe(1)
    expect(stats.totalProgress).toBe(50) // (0 + 100) / 2
  })
})