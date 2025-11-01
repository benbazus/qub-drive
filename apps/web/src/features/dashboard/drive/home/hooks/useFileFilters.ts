import { useMemo } from 'react'
import { FileItem } from '@/types/file'

interface UseFileFiltersProps {
  files: FileItem[]
  currentView: 'home' | 'my-drives' | 'shared' | 'starred' | 'recent' | 'trash'
  currentFolderId: string | null
  filter: 'all' | 'folders' | 'files'
  searchQuery: string
}

export const useFileFilters = ({
  files,
  currentView,
  currentFolderId,
  filter,
  searchQuery
}: UseFileFiltersProps) => {
  // Filter files by current view
  const getFilteredFilesByView = useMemo(() => {
    let baseFiles = files

    switch (currentView) {
      case 'home':
        return baseFiles.filter((file: FileItem) => file.parentId === currentFolderId)
      case 'my-drives':
        return baseFiles.filter((file: FileItem) => file.parentId === currentFolderId)
      case 'shared':
        return baseFiles.filter((file: FileItem) => file.shared)
      case 'starred':
        return baseFiles.filter((file: FileItem) => file.starred)
      case 'recent':
        return baseFiles
          .sort((a: FileItem, b: FileItem) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          })
          .slice(0, 10)
      case 'trash':
        return baseFiles.filter((file: FileItem) => file.deleted)
      default:
        return baseFiles.filter((file: FileItem) => file.parentId === currentFolderId)
    }
  }, [files, currentView, currentFolderId])

  // Apply additional filters and search
  const filteredFiles = useMemo(() => {
    let result = getFilteredFilesByView

    // Apply type filter
    if (filter === 'folders') {
      result = result.filter((file: FileItem) => file.fileType === 'folder')
    } else if (filter === 'files') {
      result = result.filter((file: FileItem) => file.fileType !== 'folder')
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((file: FileItem) =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return result
  }, [getFilteredFilesByView, filter, searchQuery])

  // Get file counts for different categories
  const fileCounts = useMemo(() => {
    return {
      total: filteredFiles.length,
      folders: filteredFiles.filter(file => file.fileType === 'folder').length,
      files: filteredFiles.filter(file => file.fileType !== 'folder').length,
      shared: filteredFiles.filter(file => file.shared).length,
      starred: filteredFiles.filter(file => file.starred).length
    }
  }, [filteredFiles])

  return {
    filteredFiles,
    fileCounts
  }
}