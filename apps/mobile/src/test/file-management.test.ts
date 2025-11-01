import { fileOperations } from '@/services/fileOperations'
import { fileApi } from '@/services/api/fileApi'
import { FileUtils } from '@/utils/fileUtils'
import { FileItem, UploadProgress, FileFilter, SortOption } from '@/types/file'

// Mock the API client
jest.mock('@/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
  },
}))

// Mock Expo modules
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}))

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}))

describe('File Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('File Listing and Filtering', () => {
    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: 'document.pdf',
        type: 'file',
        size: 1024000,
        mimeType: 'application/pdf',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      },
      {
        id: '2',
        name: 'image.jpg',
        type: 'file',
        size: 512000,
        mimeType: 'image/jpeg',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        isShared: true,
        isStarred: true,
        isPublic: false,
      },
      {
        id: '3',
        name: 'My Folder',
        type: 'folder',
        createdAt: '2023-01-03T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      },
    ]

    it('should retrieve files successfully', async () => {
      const mockApiResponse = {
        data: {
          success: true,
          data: mockFiles,
        },
      }

      const mockGet = jest.fn().mockResolvedValue(mockApiResponse)
      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFiles({ parentId: 'root' })

      expect(mockGet).toHaveBeenCalledWith('/files', {
        params: {
          parent_id: 'root',
          limit: 50,
          offset: 0,
          sort_by: undefined,
          sort_order: undefined,
          public_only: false,
        },
      })
      expect(result).toEqual(mockFiles)
    })

    it('should handle file listing errors with retry', async () => {
      const mockGet = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: mockFiles,
          },
        })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFiles()

      expect(mockGet).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockFiles)
    })

    it('should filter files by search query', () => {
      const filteredFiles = FileUtils.filterFiles(mockFiles, 'document')

      expect(filteredFiles).toHaveLength(1)
      expect(filteredFiles[0].name).toBe('document.pdf')
    })

    it('should filter files by category', () => {
      const imageFiles = mockFiles.filter(file => 
        file.type === 'file' && FileUtils.getFileCategory(file.name) === 'image'
      )

      expect(imageFiles).toHaveLength(1)
      expect(imageFiles[0].name).toBe('image.jpg')
    })

    it('should sort files correctly', () => {
      const sortOptions: SortOption = { field: 'name', direction: 'asc' }
      const sortedFiles = FileUtils.sortFiles(mockFiles, sortOptions)

      expect(sortedFiles[0].name).toBe('document.pdf')
      expect(sortedFiles[1].name).toBe('image.jpg')
      expect(sortedFiles[2].name).toBe('My Folder')
    })

    it('should sort files by size descending', () => {
      const sortOptions: SortOption = { field: 'size', direction: 'desc' }
      const sortedFiles = FileUtils.sortFiles(mockFiles, sortOptions)

      expect(sortedFiles[0].size).toBe(1024000)
      expect(sortedFiles[1].size).toBe(512000)
    })

    it('should put folders first when sorting by type', () => {
      const sortOptions: SortOption = { field: 'type', direction: 'asc' }
      const sortedFiles = FileUtils.sortFiles(mockFiles, sortOptions)

      expect(sortedFiles[0].type).toBe('folder')
      expect(sortedFiles[1].type).toBe('file')
      expect(sortedFiles[2].type).toBe('file')
    })

    it('should get folder contents with pagination', async () => {
      const mockFolderContents = {
        folders: [mockFiles[2]],
        files: [mockFiles[0], mockFiles[1]],
        totalCount: 3,
      }

      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockFolderContents,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFolderContents('drive1', 'folder1', {
        limit: 10,
        offset: 0,
      })

      expect(mockGet).toHaveBeenCalledWith('/drive/drive1/folders/folder1/contents', {
        params: {
          limit: 10,
          offset: 0,
          sort_by: undefined,
          sort_order: undefined,
        },
      })
      expect(result).toEqual(mockFolderContents)
    })
  })

  describe('File Operations', () => {
    it('should create folder successfully', async () => {
      const newFolder: FileItem = {
        id: 'new-folder-id',
        name: 'New Folder',
        type: 'folder',
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      }

      const mockPost = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: newFolder,
        },
      })

      require('@/services/api/client').apiClient.post = mockPost

      const result = await fileOperations.createFolder({
        name: 'New Folder',
        parentId: 'parent-id',
      })

      expect(mockPost).toHaveBeenCalledWith('/drive/default/folders', {
        name: 'New Folder',
        parentId: 'parent-id',
      })
      expect(result).toEqual(newFolder)
    })

    it('should validate folder name before creation', async () => {
      await expect(
        fileOperations.createFolder({
          name: 'Invalid<Name>',
          validation: { maxNameLength: 50 },
        })
      ).rejects.toThrow('Folder name contains invalid characters')
    })

    it('should delete file successfully', async () => {
      const mockDelete = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.delete = mockDelete

      await fileOperations.deleteFile('file-id', 'test.txt', true)

      expect(mockDelete).toHaveBeenCalledWith('/files/file-id')
    })

    it('should move item to different folder', async () => {
      const mockPost = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.post = mockPost

      await fileOperations.moveItem('item-id', 'new-parent-id')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/item-id/move', {
        newParentId: 'new-parent-id',
      })
    })

    it('should copy item successfully', async () => {
      const copiedFile: FileItem = {
        id: 'copied-file-id',
        name: 'Copy of test.txt',
        type: 'file',
        size: 1024,
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      }

      const mockPost = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: copiedFile,
        },
      })

      require('@/services/api/client').apiClient.post = mockPost

      const result = await fileOperations.copyItem('item-id', 'new-parent-id', 'Copy of test.txt')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/item-id/copy', {
        newParentId: 'new-parent-id',
        newName: 'Copy of test.txt',
      })
      expect(result).toEqual(copiedFile)
    })

    it('should toggle star status', async () => {
      const mockPost = jest.fn().mockResolvedValue({})
      const mockDelete = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.post = mockPost
      require('@/services/api/client').apiClient.delete = mockDelete

      // Star item
      await fileOperations.toggleStar('item-id', false)
      expect(mockPost).toHaveBeenCalledWith('/drive/items/item-id/star')

      // Unstar item
      await fileOperations.toggleStar('item-id', true)
      expect(mockDelete).toHaveBeenCalledWith('/drive/items/item-id/star')
    })

    it('should move item to trash', async () => {
      const mockPost = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.post = mockPost

      await fileOperations.moveToTrash('item-id')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/item-id/trash')
    })

    it('should restore item from trash', async () => {
      const mockPost = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.post = mockPost

      await fileOperations.restoreFromTrash('item-id')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/item-id/restore')
    })
  })

  describe('File Search and Special Collections', () => {
    const mockSearchResults: FileItem[] = [
      {
        id: '1',
        name: 'search-result.pdf',
        type: 'file',
        size: 1024,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      },
    ]

    it('should search files successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockSearchResults,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.searchFiles('search query', {
        fileType: 'pdf',
      })

      expect(mockGet).toHaveBeenCalledWith('/drive/default/search', {
        params: {
          q: 'search query',
          file_type: 'pdf',
          modified_after: undefined,
          modified_before: undefined,
        },
      })
      expect(result).toEqual(mockSearchResults)
    })

    it('should return empty array for empty search query', async () => {
      const result = await fileOperations.searchFiles('')
      expect(result).toEqual([])
    })

    it('should get recent files', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockSearchResults,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getRecentFiles(10)

      expect(mockGet).toHaveBeenCalledWith('/drive/recent', {
        params: { limit: 10 },
      })
      expect(result).toEqual(mockSearchResults)
    })

    it('should get starred files', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockSearchResults,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getStarredFiles()

      expect(mockGet).toHaveBeenCalledWith('/drive/starred')
      expect(result).toEqual(mockSearchResults)
    })

    it('should get shared files', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockSearchResults,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getSharedFiles()

      expect(mockGet).toHaveBeenCalledWith('/drive/shared-with-me')
      expect(result).toEqual(mockSearchResults)
    })

    it('should get trash items', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockSearchResults,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getTrashItems('drive-id')

      expect(mockGet).toHaveBeenCalledWith('/drive/drive-id/trash')
      expect(result).toEqual(mockSearchResults)
    })
  })

  describe('File Upload and Validation', () => {
    it('should validate file size correctly', () => {
      const largeFile = { size: 200 * 1024 * 1024, name: 'large.pdf', type: 'application/pdf' }
      const smallFile = { size: 1024, name: 'small.txt', type: 'text/plain' }

      const largeResult = fileOperations.validateFile(largeFile, { maxSize: 100 * 1024 * 1024 })
      const smallResult = fileOperations.validateFile(smallFile, { maxSize: 100 * 1024 * 1024 })

      expect(largeResult.valid).toBe(false)
      expect(largeResult.error).toContain('exceeds maximum')
      expect(smallResult.valid).toBe(true)
    })

    it('should validate allowed file types', () => {
      const imageFile = { size: 1024, name: 'image.jpg', type: 'image/jpeg' }
      const textFile = { size: 1024, name: 'document.txt', type: 'text/plain' }

      const imageResult = fileOperations.validateFile(imageFile, { allowedTypes: ['jpg', 'png'] })
      const textResult = fileOperations.validateFile(textFile, { allowedTypes: ['jpg', 'png'] })

      expect(imageResult.valid).toBe(true)
      expect(textResult.valid).toBe(false)
      expect(textResult.error).toContain('not allowed')
    })

    it('should block dangerous file types', () => {
      const exeFile = { size: 1024, name: 'virus.exe', type: 'application/x-executable' }
      
      const result = fileOperations.validateFile(exeFile, { blockedTypes: ['.exe', '.bat'] })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })

    it('should upload file with progress tracking', async () => {
      const mockFile = new Blob(['test content'], { type: 'text/plain' })
      const mockUploadedFile: FileItem = {
        id: 'uploaded-file-id',
        name: 'test.txt',
        type: 'file',
        size: 12,
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z',
        isShared: false,
        isStarred: false,
        isPublic: false,
      }

      const mockUpload = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockUploadedFile,
        },
      })

      require('@/services/api/client').apiClient.upload = mockUpload

      const progressCallback = jest.fn()
      const successCallback = jest.fn()

      const result = await fileApi.uploadFile(mockFile, 'test.txt', 'parent-id', {
        onProgress: progressCallback,
        onSuccess: successCallback,
      })

      expect(mockUpload).toHaveBeenCalled()
      expect(result).toEqual(mockUploadedFile)
    })

    it('should handle upload errors', async () => {
      const mockFile = new Blob(['test content'], { type: 'text/plain' })
      const uploadError = new Error('Upload failed')

      const mockUpload = jest.fn().mockRejectedValue(uploadError)
      require('@/services/api/client').apiClient.upload = mockUpload

      const errorCallback = jest.fn()

      await expect(
        fileApi.uploadFile(mockFile, 'test.txt', undefined, {
          onError: errorCallback,
        })
      ).rejects.toThrow('Upload failed')

      expect(errorCallback).toHaveBeenCalledWith(uploadError)
    })
  })

  describe('File Download and Storage', () => {
    it('should download file successfully', async () => {
      const mockDownloadUrl = 'https://example.com/download/file.pdf'
      const mockLocalUri = '/mock/documents/downloads/file.pdf'

      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: { url: mockDownloadUrl },
        },
      })

      const mockGetInfoAsync = jest.fn().mockResolvedValue({ exists: false })
      const mockMakeDirectoryAsync = jest.fn().mockResolvedValue({})
      const mockDownloadAsync = jest.fn().mockResolvedValue({ uri: mockLocalUri })

      require('@/services/api/client').apiClient.get = mockGet
      require('expo-file-system').getInfoAsync = mockGetInfoAsync
      require('expo-file-system').makeDirectoryAsync = mockMakeDirectoryAsync
      require('expo-file-system').downloadAsync = mockDownloadAsync

      const result = await fileOperations.downloadFile('file-id', 'file.pdf')

      expect(mockGet).toHaveBeenCalledWith('/files/file-id/download-url')
      expect(mockMakeDirectoryAsync).toHaveBeenCalled()
      expect(mockDownloadAsync).toHaveBeenCalledWith(mockDownloadUrl, expect.stringContaining('file.pdf'))
      expect(result).toBe(mockLocalUri)
    })

    it('should handle download errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'))
      require('@/services/api/client').apiClient.get = mockGet

      await expect(
        fileOperations.downloadFile('file-id', 'file.pdf')
      ).rejects.toThrow('Network error')
    })

    it('should get storage statistics', async () => {
      const mockStats = {
        fileCount: 100,
        totalSize: 1024000000,
        usedSpace: 512000000,
        availableSpace: 512000000,
        usageByType: {
          images: 200000000,
          documents: 300000000,
          videos: 12000000,
        },
      }

      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockStats,
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getStorageStats()

      expect(mockGet).toHaveBeenCalledWith('/files/storage-stats')
      expect(result).toEqual(mockStats)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors with retry mechanism', async () => {
      const mockGet = jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: [],
          },
        })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFiles()

      expect(mockGet).toHaveBeenCalledTimes(3)
      expect(result).toEqual([])
    })

    it('should not retry non-retryable errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Authentication required'))
      require('@/services/api/client').apiClient.get = mockGet

      await expect(fileOperations.getFiles()).rejects.toThrow('Authentication required')
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it('should handle empty file lists', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFiles()
      expect(result).toEqual([])
    })

    it('should handle malformed API responses', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          success: false,
          message: 'Invalid request',
        },
      })

      require('@/services/api/client').apiClient.get = mockGet

      // The API should handle this gracefully
      await expect(fileOperations.getFiles()).rejects.toThrow()
    })

    it('should validate file existence before operations', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { exists: true },
      })

      require('@/services/api/client').apiClient.get = mockGet

      const exists = await fileOperations.fileExists('test.txt', 'parent-id')

      expect(mockGet).toHaveBeenCalledWith('/files/exists', {
        params: {
          filename: 'test.txt',
          parent_id: 'parent-id',
        },
      })
      expect(exists).toBe(true)
    })

    it('should handle file existence check errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'))
      require('@/services/api/client').apiClient.get = mockGet

      const exists = await fileOperations.fileExists('test.txt')
      expect(exists).toBe(false)
    })
  })

  describe('File Sharing Operations', () => {
    it('should share file with users', async () => {
      const mockPost = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.post = mockPost

      await fileOperations.shareFile('file-id', ['user1', 'user2'], 'editor')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/file-id/share', {
        user_ids: ['user1', 'user2'],
        role: 'editor',
      })
    })

    it('should create sharing link', async () => {
      const mockShareLink = 'https://example.com/share/abc123'
      const mockPost = jest.fn().mockResolvedValue({
        data: { link: mockShareLink },
      })

      require('@/services/api/client').apiClient.post = mockPost

      const result = await fileOperations.createSharingLink('file-id', 'edit')

      expect(mockPost).toHaveBeenCalledWith('/drive/items/file-id/sharing-link', {
        access_level: 'edit',
      })
      expect(result).toBe(mockShareLink)
    })

    it('should revoke sharing link', async () => {
      const mockDelete = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.delete = mockDelete

      await fileOperations.revokeSharingLink('file-id')

      expect(mockDelete).toHaveBeenCalledWith('/drive/items/file-id/sharing-link')
    })

    it('should get file sharing information', async () => {
      const mockSharingInfo = {
        isShared: true,
        shareLink: 'https://example.com/share/abc123',
        permissions: [
          {
            userId: 'user1',
            email: 'user1@example.com',
            role: 'editor',
          },
        ],
      }

      const mockGet = jest.fn().mockResolvedValue({
        data: mockSharingInfo,
      })

      require('@/services/api/client').apiClient.get = mockGet

      const result = await fileOperations.getFileSharing('file-id')

      expect(mockGet).toHaveBeenCalledWith('/files/file-id/sharing')
      expect(result).toEqual(mockSharingInfo)
    })
  })

  describe('Trash Management', () => {
    it('should empty trash successfully', async () => {
      const mockDelete = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.delete = mockDelete

      await fileOperations.emptyTrash('drive-id', true)

      expect(mockDelete).toHaveBeenCalledWith('/drive/drive-id/trash')
    })

    it('should handle trash operations with confirmation', async () => {
      const mockAlert = require('react-native').Alert.alert
      const mockDelete = jest.fn().mockResolvedValue({})
      require('@/services/api/client').apiClient.delete = mockDelete

      // Mock user confirming the action
      mockAlert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons.find((btn: any) => btn.text === 'Empty Trash')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      await fileOperations.emptyTrash('drive-id', false)

      expect(mockAlert).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalledWith('/drive/drive-id/trash')
    })
  })
})