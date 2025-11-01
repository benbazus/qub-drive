import { formatFileSize, formatDate } from '../format'

describe('Format Utils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-01-01')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
})