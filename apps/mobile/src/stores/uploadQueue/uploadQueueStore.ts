import { create } from 'zustand'
import { UploadQueueItem } from '@/services/uploadManager'

export interface UploadStats {
  total: number
  pending: number
  uploading: number
  completed: number
  failed: number
  paused: number
  cancelled: number
  totalProgress: number
  isActive: boolean
}

interface UploadQueueState {
  queue: UploadQueueItem[]
  
  // Actions
  addItems: (items: UploadQueueItem[]) => void
  updateItem: (id: string, updates: Partial<UploadQueueItem>) => void
  removeItem: (id: string) => void
  getItem: (id: string) => UploadQueueItem | undefined
  clearCompleted: () => void
  clearAll: () => void
  restoreQueue: (items: UploadQueueItem[]) => void
  
  // Selectors
  getStats: () => UploadStats
  getPendingItems: () => UploadQueueItem[]
  getActiveItems: () => UploadQueueItem[]
  getCompletedItems: () => UploadQueueItem[]
  getFailedItems: () => UploadQueueItem[]
}

export const uploadQueueStore = create<UploadQueueState>((set, get) => ({
  queue: [],

  addItems: (items) => {
    set((state) => ({
      queue: [...state.queue, ...items]
    }))
  },

  updateItem: (id, updates) => {
    set((state) => ({
      queue: state.queue.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }))
  },

  removeItem: (id) => {
    set((state) => ({
      queue: state.queue.filter(item => item.id !== id)
    }))
  },

  getItem: (id) => {
    return get().queue.find(item => item.id === id)
  },

  clearCompleted: () => {
    set((state) => ({
      queue: state.queue.filter(item => 
        item.status !== 'completed' && item.status !== 'cancelled'
      )
    }))
  },

  clearAll: () => {
    set({ queue: [] })
  },

  restoreQueue: (items) => {
    set({ queue: items })
  },

  getStats: () => {
    const queue = get().queue
    
    const stats = queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalProgress = queue.length > 0 
      ? queue.reduce((sum, item) => sum + item.progress.progress, 0) / queue.length
      : 0

    const isActive = queue.some(item => 
      item.status === 'uploading' || item.status === 'pending'
    )

    return {
      total: queue.length,
      pending: stats.pending || 0,
      uploading: stats.uploading || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      paused: stats.paused || 0,
      cancelled: stats.cancelled || 0,
      totalProgress: Math.round(totalProgress),
      isActive
    }
  },

  getPendingItems: () => {
    return get().queue.filter(item => item.status === 'pending')
  },

  getActiveItems: () => {
    return get().queue.filter(item => 
      item.status === 'uploading' || item.status === 'pending'
    )
  },

  getCompletedItems: () => {
    return get().queue.filter(item => item.status === 'completed')
  },

  getFailedItems: () => {
    return get().queue.filter(item => item.status === 'failed')
  }
}))

export default uploadQueueStore