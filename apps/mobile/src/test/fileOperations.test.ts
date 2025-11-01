import { fileOperations } from '@/services/fileOperations'
import { FileUtils } from '@/utils/fileUtils'

describe('File Operations', () => {
  describe('File validation', () => {
    it('should validate file size correctly', () => {
      const largeFile = { size: 200 * 1024 * 1024, name: 'large.pdf', type: 'application/pdf' }
      const smallFile = { size: 1024, name: 'small.txt', type: 'text/plain' }

      const largeResult = fileOperations.validateFile(largeFile, { maxSize: 100 * 1024 * 1024 })
      const smallResult = fileOperations.validateFile(smallFile, { maxSize: 100 * 1024 * 1024 })

      expect(largeResult.valid).toBe(false)
      expect(largeResult.error).toContain('exceeds maximum')
      expect(smallResult.valid).toBe(true)
    })

    it('should validate file types correctly', () => {
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
  })

  describe('File size formatting', () => {
    it('should format file sizes correctly', () => {
      expect(fileOperations.formatFileSize(0)).toBe('0 Bytes')
      expect(fileOperations.formatFileSize(1024)).toBe('1 KB')
      expect(fileOperations.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(fileOperations.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })
})

describe('File Utils', () => {
  describe('File type detection', () => {
    it('should detect image files correctly', () => {
      expect(FileUtils.isImage('photo.jpg')).toBe(true)
      expect(FileUtils.isImage('image.png')).toBe(true)
      expect(FileUtils.isImage('document.pdf')).toBe(false)
    })

    it('should detect video files correctly', () => {
      expect(FileUtils.isVideo('movie.mp4')).toBe(true)
      expect(FileUtils.isVideo('clip.avi')).toBe(true)
      expect(FileUtils.isVideo('song.mp3')).toBe(false)
    })

    it('should detect document files correctly', () => {
      expect(FileUtils.isDocument('report.pdf')).toBe(true)
      expect(FileUtils.isDocument('spreadsheet.xlsx')).toBe(true)
      expect(FileUtils.isDocument('image.jpg')).toBe(false)
    })
  })

  describe('File name validation', () => {
    it('should validate file names correctly', () => {
      expect(FileUtils.validateFilename('valid-file.txt').valid).toBe(true)
      expect(FileUtils.validateFilename('').valid).toBe(false)
      expect(FileUtils.validateFilename('file<with>invalid:chars.txt').valid).toBe(false)
    })

    it('should generate unique file names', () => {
      const existingNames = ['file.txt', 'file (1).txt']
      const uniqueName = FileUtils.generateUniqueFilename('file.txt', existingNames)
      
      expect(uniqueName).toBe('file (2).txt')
      expect(existingNames.includes(uniqueName)).toBe(false)
    })
  })

  describe('File sorting', () => {
    const mockFiles = [
      { id: '1', name: 'zebra.txt', type: 'file' as const, size: 100, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: '2', name: 'apple.txt', type: 'file' as const, size: 200, createdAt: '2023-01-02', updatedAt: '2023-01-02' },
      { id: '3', name: 'folder', type: 'folder' as const, createdAt: '2023-01-03', updatedAt: '2023-01-03' },
    ]

    it('should sort files by name', () => {
      const sorted = FileUtils.sortFiles(mockFiles, { field: 'name', direction: 'asc' })
      expect(sorted[0].name).toBe('apple.txt')
      expect(sorted[1].name).toBe('zebra.txt')
    })

    it('should sort files by size', () => {
      const sorted = FileUtils.sortFiles(mockFiles, { field: 'size', direction: 'desc' })
      expect(sorted[0].size).toBe(200)
      expect(sorted[1].size).toBe(100)
    })

    it('should put folders first when sorting by type', () => {
      const sorted = FileUtils.sortFiles(mockFiles, { field: 'type', direction: 'asc' })
      expect(sorted[0].type).toBe('folder')
    })
  })

  describe('MIME type detection', () => {
    it('should return correct MIME types', () => {
      expect(FileUtils.getMimeType('image.jpg')).toBe('image/jpeg')
      expect(FileUtils.getMimeType('document.pdf')).toBe('application/pdf')
      expect(FileUtils.getMimeType('script.js')).toBe('text/javascript')
      expect(FileUtils.getMimeType('unknown.xyz')).toBe('application/octet-stream')
    })
  })

  describe('Breadcrumb generation', () => {
    it('should generate breadcrumbs correctly', () => {
      const breadcrumbs = FileUtils.getBreadcrumbPath('/folder1/folder2/folder3')
      
      expect(breadcrumbs).toHaveLength(4)
      expect(breadcrumbs[0]).toEqual({ name: 'Home', id: '' })
      expect(breadcrumbs[1]).toEqual({ name: 'folder1', id: '/folder1' })
      expect(breadcrumbs[2]).toEqual({ name: 'folder2', id: '/folder1/folder2' })
      expect(breadcrumbs[3]).toEqual({ name: 'folder3', id: '/folder1/folder2/folder3' })
    })

    it('should handle root path', () => {
      const breadcrumbs = FileUtils.getBreadcrumbPath('/')
      
      expect(breadcrumbs).toHaveLength(1)
      expect(breadcrumbs[0]).toEqual({ name: 'Home', id: '' })
    })
  })
})