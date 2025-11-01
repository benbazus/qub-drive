import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useFileQueryInvalidation } from '@/hooks/useFileQueryInvalidation'

import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Upload,
  Download,
  File,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Move,
  Trash2,
} from 'lucide-react'



import { fileEndPoint } from '@/api/endpoints/file.endpoint'
import { formatFileSize, formatTime } from '@/utils/file.utils'


// Type definitions
interface FileTransferHook {
  transfers: FileTransfer[]
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  setIsOpen: (open: boolean) => void
  setIsMinimized: (minimized: boolean) => void
  setIsMaximized: (maximized: boolean) => void
  addTransfer: (file: File, type?: 'upload' | 'download', realUpload?: boolean) => number
  addMultipleTransfers: (files: FileList | File[], type?: 'upload' | 'download') => void
  pauseTransfer: (id: number) => void
  resumeTransfer: (id: number) => void
  removeTransfer: (id: number) => void
  clearCompleted: () => void
  clearAll: () => void
  clearFailed: () => void
  clearDownloads: () => void
}

interface TransferItemProps {
  transfer: FileTransfer
  onPause: (id: number) => void
  onResume: (id: number) => void
  onRemove: (id: number) => void
}

interface FileTransferManagerProps {
  fileInputRef?: React.RefObject<HTMLInputElement>
  folderInputRef?: React.RefObject<HTMLInputElement>
}

interface DragOffset {
  x: number
  y: number
}

interface Position {
  x: number
  y: number
}

interface TabCounts {
  all: number
  active: number
  completed: number
  failed: number
  [key: string]: number
}

interface FileTransfer {
  id: number
  uploadId: string
  fileName: string
  fileSize: number
  file: File // Store original file
  type: 'upload' | 'download'
  status: 'active' | 'paused' | 'completed' | 'failed'
  progress: number
  speed: number
  startTime: number
  estimatedTime: number | null
  realUpload: boolean
  error?: string
}


// Utility to create unique upload ID
const createUploadId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const useFileTransfer = (): FileTransferHook => {

  const [transfers, setTransfers] = useState<FileTransfer[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isMinimized, setIsMinimized] = useState<boolean>(false)
  const [isMaximized, setIsMaximized] = useState<boolean>(false)
  const intervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const { invalidateFileQueries } = useFileQueryInvalidation()



  const startUpload = useCallback(
    (transfer: FileTransfer, file: File) => {

      let parentId = localStorage.getItem('currentParentFolder');
      if (parentId) {

        parentId = parentId.replace(/"/g, '');
      }

      console.log("=== FILE UPLOAD DEBUG ===");
      console.log("parentId from utils:", parentId);
      console.log("file name:", file.name);
      console.log("==========================");

      fileEndPoint.uploadFile(file, parentId, {
        onProgress: (progress: any) => {
          setTransfers((prev) =>
            prev.map((t) =>
              t.id === transfer.id
                ? {
                  ...t,
                  progress: progress.percentage,
                  speed:
                    progress.loaded / ((Date.now() - t.startTime) / 1000),
                  estimatedTime:
                    progress.percentage < 100
                      ? Math.round(
                        (((100 - progress.percentage) / 100) *
                          transfer.fileSize) /
                        (progress.loaded /
                          ((Date.now() - t.startTime) / 1000))
                      )
                      : 0,
                }
                : t
            )
          )
        },
        onSuccess: () => {
          setTransfers((prev) =>
            prev.map((t) =>
              t.id === transfer.id
                ? {
                  ...t,
                  status: 'completed',
                  progress: 100,
                  speed: 0,
                  estimatedTime: 0,
                }
                : t
            )
          )
          // Invalidate all file-related queries for immediate UI updates
          invalidateFileQueries(parentId)
        },
        onError: (error: any) => {
          setTransfers((prev) =>
            prev.map((t) =>
              t.id === transfer.id
                ? {
                  ...t,
                  status: 'failed',
                  error: error.message,
                  speed: 0,
                  estimatedTime: 0,
                }
                : t
            )
          )
        },
      })
    },
    [invalidateFileQueries]
  )
  const addTransfer = useCallback(
    (
      file: File,
      type: 'upload' | 'download' = 'upload',
      realUpload: boolean = false
    ): number => {
      const uploadId = createUploadId()
      const newTransfer: FileTransfer = {
        id: Date.now() + Math.random(),
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        file, // Store the file
        type,
        status: 'active',
        progress: 0,
        speed: 0,
        startTime: Date.now(),
        estimatedTime: null,
        realUpload,
      }

      setTransfers((prev) => [...prev, newTransfer])
      setIsOpen(true)

      if (realUpload) {
        // For chunked uploads
        fileEndPoint
          .initializeUpload(file, null!)
          .then((uploadId) => {
            newTransfer.uploadId = uploadId
            startUpload(newTransfer, file)
          })
      } else {
        startUpload(newTransfer, file)
      }

      return newTransfer.id
    },
    [startUpload]
  )

  const addMultipleTransfers = useCallback(
    (
      files: FileList | File[],
      type: 'upload' | 'download' = 'upload'
    ): void => {
      const fileArray = Array.from(files)
      fileArray.forEach((file: File, index: number) => {
        setTimeout(() => {
          addTransfer(file, type)
        }, index * 100) // Stagger the additions slightly
      })
      setIsOpen(true)
    },
    [addTransfer]
  )

  const pauseTransfer = useCallback(
    (id: number): void => {
      const transfer = transfers.find((t) => t.id === id)
      if (transfer?.realUpload) {
        // uploadService.cancelUpload(transfer.uploadId)
      } else {
        const interval = intervalRefs.current.get(id)
        if (interval) {
          clearInterval(interval)
          intervalRefs.current.delete(id)
        }
      }

      setTransfers((prev) =>
        prev.map((transfer) =>
          transfer.id === id ? { ...transfer, status: 'paused' } : transfer
        )
      )
    },
    [transfers]
  )

  const resumeTransfer = useCallback(
    (id: number) => {
      const transfer = transfers.find((t) => t.id === id)
      if (!transfer) return

      setTransfers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'active' } : t))
      )


    },
    [transfers]
  )

  const removeTransfer = useCallback(
    (id: number): void => {
      const transfer = transfers.find((t) => t.id === id)
      if (transfer?.realUpload && transfer.status === 'active') {
        //uploadService.cancelUpload(transfer.uploadId)
      }

      const interval = intervalRefs.current.get(id)
      if (interval) {
        clearInterval(interval)
        intervalRefs.current.delete(id)
      }

      setTransfers((prev) => prev.filter((transfer) => transfer.id !== id))
    },
    [transfers]
  )

  const clearCompleted = useCallback((): void => {
    // Clear intervals for completed transfers
    transfers.forEach((transfer) => {
      if (transfer.status === 'completed') {
        const interval = intervalRefs.current.get(transfer.id)
        if (interval) {
          clearInterval(interval)
          intervalRefs.current.delete(transfer.id)
        }
      }
    })

    setTransfers((prev) =>
      prev.filter((transfer) => transfer.status !== 'completed')
    )
  }, [transfers])

  const clearFailed = useCallback((): void => {
    // Clear intervals for failed transfers
    transfers.forEach((transfer) => {
      if (transfer.status === 'failed') {
        const interval = intervalRefs.current.get(transfer.id)
        if (interval) {
          clearInterval(interval)
          intervalRefs.current.delete(transfer.id)
        }
      }
    })

    setTransfers((prev) =>
      prev.filter((transfer) => transfer.status !== 'failed')
    )
  }, [transfers])

  const clearDownloads = useCallback((): void => {
    // Clear all download transfers
    setTransfers((prev) => prev.filter((transfer) => transfer.type !== 'download'))
  }, [])

  const clearAll = useCallback((): void => {
    // Cancel all active uploads
    transfers.forEach((transfer) => {
      if (transfer.realUpload && transfer.status === 'active') {
        //  uploadService.cancelUpload(transfer.uploadId)
      }
    })

    // Clear all intervals
    intervalRefs.current.forEach((interval) => {
      clearInterval(interval)
    })
    intervalRefs.current.clear()

    setTransfers([])
  }, [transfers])

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach((interval) => {
        clearInterval(interval)
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
      intervalRefs.current.clear()
      // Cancel all uploads on unmount
      //  uploadService.cancelAllUploads()
    }
  }, [])

  // Custom setIsOpen that clears downloads when opening
  const customSetIsOpen = useCallback((open: boolean) => {
    if (open) {
      // Clear existing downloads when opening the manager
      clearDownloads()
    }
    setIsOpen(open)
  }, [clearDownloads])

  return {
    transfers,
    isOpen,
    isMinimized,
    isMaximized,
    setIsOpen: customSetIsOpen,
    setIsMinimized,
    setIsMaximized,
    addTransfer,
    addMultipleTransfers,
    pauseTransfer,
    resumeTransfer,
    removeTransfer,
    clearCompleted,
    clearAll,
    clearFailed,
    clearDownloads,
  }
}

// Transfer Item Component
const TransferItem: React.FC<TransferItemProps> = ({
  transfer,
  onPause,
  onResume,
  onRemove,
}) => {
  const getStatusIcon = () => {
    switch (transfer.status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'paused':
        return <Pause className='h-4 w-4 text-yellow-500' />
      default:
        return <Clock className='h-4 w-4 text-blue-500' />
    }
  }

  const getStatusColor = (): string => {
    switch (transfer.status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className='flex items-center gap-3 border-b border-gray-200 p-3 hover:bg-gray-50'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <div className='flex items-center gap-2'>
          {transfer.type === 'upload' ? (
            <Upload className='h-4 w-4 text-gray-500' />
          ) : (
            <Download className='h-4 w-4 text-gray-500' />
          )}
          <File className='h-4 w-4 text-gray-500' />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between'>
            <span className='truncate text-sm font-medium text-gray-900'>
              {transfer.fileName}
            </span>
            <div className='flex items-center gap-2'>
              {getStatusIcon()}
              <span className='text-xs text-gray-500'>
                {transfer.status === 'active'
                  ? `${Math.round(transfer.progress)}%`
                  : transfer.status}
              </span>
            </div>
          </div>

          <div className='mt-1'>
            <div className='h-2 w-full rounded-full bg-gray-200'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
                style={{ width: `${transfer.progress}%` }}
              />
            </div>
          </div>

          <div className='mt-1 flex justify-between text-xs text-gray-500'>
            <span>{formatFileSize(transfer.fileSize)}</span>
            <span>
              {transfer.status === 'active' && transfer.speed > 0 && (
                <>
                  {formatFileSize(transfer.speed)}/s •{' '}
                  {formatTime(transfer.estimatedTime)} left
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-1'>
        {transfer.status === 'active' && (
          <button
            onClick={() => onPause(transfer.id)}
            className='rounded p-1 hover:bg-gray-200'
            title='Pause transfer'
          >
            <Pause className='h-3 w-3' />
          </button>
        )}
        {transfer.status === 'paused' && (
          <button
            onClick={() => onResume(transfer.id)}
            className='rounded p-1 hover:bg-gray-200'
            title='Resume transfer'
          >
            <Play className='h-3 w-3' />
          </button>
        )}
        <button
          onClick={() => onRemove(transfer.id)}
          className='rounded p-1 text-red-500 hover:bg-gray-200'
          title='Remove transfer'
        >
          <X className='h-3 w-3' />
        </button>
      </div>
    </div>
  )
}

// Main File Transfer Manager Component
const FileTransferManager: React.FC<FileTransferManagerProps> = ({
  fileInputRef,
  folderInputRef,
}) => {
  const {
    transfers,
    isOpen,
    isMinimized,
    isMaximized,
    setIsOpen,
    setIsMinimized,
    setIsMaximized,
    addMultipleTransfers,
    pauseTransfer,
    resumeTransfer,
    removeTransfer,
    clearCompleted,
    clearAll,
    clearFailed,
    clearDownloads,
  } = useFileTransfer()
  const [activeTab, setActiveTab] = useState('all')
  //const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 })
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  // Handle file input changes
  const handleFileInputChange = useCallback(
    (event: Event): void => {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (files && files.length > 0) {
        addMultipleTransfers(files, 'upload')
      }
    },
    [addMultipleTransfers]
  )

  const handleFolderInputChange = useCallback(
    (event: Event): void => {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (files && files.length > 0) {
        addMultipleTransfers(files, 'upload')
      }
    },
    [addMultipleTransfers]
  )

  // Set up file input event listeners
  useEffect(() => {
    const fileInput = fileInputRef?.current
    const folderInput = folderInputRef?.current

    if (fileInput) {
      fileInput.addEventListener('change', handleFileInputChange)
    }
    if (folderInput) {
      folderInput.addEventListener('change', handleFolderInputChange)
    }

    return () => {
      if (fileInput) {
        fileInput.removeEventListener('change', handleFileInputChange)
      }
      if (folderInput) {
        folderInput.removeEventListener('change', handleFolderInputChange)
      }
    }
  }, [
    fileInputRef,
    folderInputRef,
    handleFileInputChange,
    handleFolderInputChange,
  ])

  // Set initial position to bottom-right
  useEffect(() => {
    const updatePosition = (): void => {
      if (!isMaximized) {
        setPosition({
          x: window.innerWidth - (isMinimized ? 340 : 500) - 20,
          y: window.innerHeight - (isMinimized ? 60 : 420) - 20,
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isMinimized, isMaximized])

  // Filter transfers based on active tab
  const filteredTransfers: FileTransfer[] = transfers.filter((transfer) => {
    switch (activeTab) {
      case 'active':
        return transfer.status === 'active' || transfer.status === 'paused'
      case 'completed':
        return transfer.status === 'completed'
      case 'failed':
        return transfer.status === 'failed'
      default:
        return true
    }
  })

  // Get tab counts
  const tabCounts: TabCounts = {
    all: transfers.length,
    active: transfers.filter(
      (t) => t.status === 'active' || t.status === 'paused'
    ).length,
    completed: transfers.filter((t) => t.status === 'completed').length,
    failed: transfers.filter((t) => t.status === 'failed').length,
  }

  // Get downloads count for additional actions
  const downloadsCount = transfers.filter((t) => t.type === 'download').length

  // Handle window dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement
    if (target.closest('.window-controls') || target.closest('.window-content'))
      return

    setIsDragging(true)
    const rect = windowRef.current!.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging) return

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = (): void => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Handle clear action based on active tab
  const handleClearAction = (): void => {
    switch (activeTab) {
      case 'completed':
        clearCompleted()
        break
      case 'failed':
        clearFailed()
        break
      case 'all':
        clearAll()
        break
      default:
        break
    }
  }

  const handleClearDownloads = (): void => {
    clearDownloads()
  }

  const getClearButtonText = (): string => {
    switch (activeTab) {
      case 'completed':
        return 'Clear completed'
      case 'failed':
        return 'Clear failed'
      case 'all':
        return 'Clear all'
      default:
        return 'Clear'
    }
  }

  const shouldShowClearButton = (): boolean => {
    switch (activeTab) {
      case 'completed':
        return tabCounts.completed > 0
      case 'failed':
        return tabCounts.failed > 0
      case 'all':
        return tabCounts.all > 0
      default:
        return false
    }
  }

  // Don't render anything if not open
  if (!isOpen) {
    return null
  }

  const windowStyle = {
    position: 'fixed' as 'fixed', // Explicitly cast to 'fixed'
    left: isMaximized ? 0 : position.x,
    top: isMaximized ? 0 : position.y,
    width: isMaximized
      ? '100vw'
      : isMinimized
        ? '340px'
        : window.innerWidth < 640
          ? '95vw'
          : '500px',
    height: isMaximized
      ? '100vh'
      : isMinimized
        ? '48px'
        : window.innerHeight < 640
          ? '70vh'
          : '440px',
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : 'default', // Explicitly cast to 'grabbing' or 'default'
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ]

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      className='overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-gray-600 dark:bg-gray-800'
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div className='dark:to-gray-750 flex cursor-move items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-3 dark:border-gray-700 dark:from-gray-800'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <Move className='h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400' />
          <span className='truncate font-semibold text-gray-900 dark:text-gray-100'>
            File Transfer Manager
          </span>
          {tabCounts.all > 0 && (
            <span className='shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
              {tabCounts.active} active
            </span>
          )}
        </div>

        <div className='window-controls flex shrink-0 items-center gap-1'>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className='rounded-lg p-1.5 transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <Minus className='h-4 w-4 text-gray-600 dark:text-gray-300' />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className='rounded-lg p-1.5 transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className='h-4 w-4 text-gray-600 dark:text-gray-300' />
            ) : (
              <Maximize2 className='h-4 w-4 text-gray-600 dark:text-gray-300' />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className='rounded-lg p-1.5 text-red-600 transition-colors duration-200 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20'
            title='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className='window-content flex h-full flex-col'>
          {/* Tabs */}
          <div className='dark:bg-gray-850 flex overflow-x-auto border-b border-gray-200 bg-gray-50 dark:border-gray-700'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.key
                  ? 'border-blue-500 bg-white text-blue-600 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <span>{tab.label}</span>
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${activeTab === tab.key
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {tabCounts[tab.key as keyof TabCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Transfer List */}
          <div className='flex-1 overflow-y-auto'>
            {filteredTransfers.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400'>
                <div className='mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-700'>
                  <File className='h-8 w-8' />
                </div>
                <p className='text-center'>
                  No transfers {activeTab !== 'all' ? `in ${activeTab}` : ''}
                </p>
                <p className='mt-1 text-sm text-gray-400 dark:text-gray-500'>
                  Upload files to see them here
                </p>
              </div>
            ) : (
              <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                {filteredTransfers.map((transfer) => (
                  <TransferItem
                    key={transfer.id}
                    transfer={transfer}
                    onPause={pauseTransfer}
                    onResume={resumeTransfer}
                    onRemove={removeTransfer}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {transfers.length > 0 && (
            <div className='dark:bg-gray-850 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  {transfers.length} total transfer
                  {transfers.length !== 1 ? 's' : ''}
                </span>
                <div className='flex items-center gap-2'>
                  {downloadsCount > 0 && (
                    <button
                      onClick={handleClearDownloads}
                      className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors duration-200 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                      title={`Clear ${downloadsCount} downloads`}
                    >
                      <Download className='h-3.5 w-3.5' />
                      <span className='hidden sm:inline'>
                        Clear downloads ({downloadsCount})
                      </span>
                    </button>
                  )}
                  {shouldShowClearButton() && (
                    <button
                      onClick={handleClearAction}
                      className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      title={getClearButtonText()}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                      <span className='hidden sm:inline'>
                        {getClearButtonText()}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileTransferManager
