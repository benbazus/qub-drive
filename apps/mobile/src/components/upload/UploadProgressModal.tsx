import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  // Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { uploadQueueStore } from '@/stores/uploadQueue/uploadQueueStore'
import { uploadManager, UploadQueueItem } from '@/services/uploadManager'
import { Colors } from '@/constants/theme'

interface UploadProgressModalProps {
  visible: boolean
  onClose: () => void
}

// const { width } = Dimensions.get('window')

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  visible,
  onClose
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [stats, setStats] = useState(uploadQueueStore.getState().getStats())

  useEffect(() => {
    if (!visible) return

    const unsubscribe = uploadQueueStore.subscribe((state) => {
      setQueue(state.queue)
      setStats(state.getStats())
    })

    // Initial load
    setQueue(uploadQueueStore.getState().queue)
    setStats(uploadQueueStore.getState().getStats())

    return unsubscribe
  }, [visible])

  const handlePauseUpload = async (uploadId: string) => {
    try {
      await uploadManager.pauseUpload(uploadId)
    } catch (error) {
      console.error('Failed to pause upload:', error)
    }
  }

  const handleResumeUpload = async (uploadId: string) => {
    try {
      await uploadManager.resumeUpload(uploadId)
    } catch (error) {
      console.error('Failed to resume upload:', error)
    }
  }

  const handleCancelUpload = async (uploadId: string, fileName: string) => {
    Alert.alert(
      'Cancel Upload',
      `Are you sure you want to cancel uploading "${fileName}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await uploadManager.cancelUpload(uploadId)
            } catch (error) {
              console.error('Failed to cancel upload:', error)
            }
          }
        }
      ]
    )
  }

  const handleRetryUpload = async (uploadId: string) => {
    try {
      await uploadManager.retryUpload(uploadId)
    } catch (error) {
      console.error('Failed to retry upload:', error)
    }
  }

  const handleClearCompleted = async () => {
    try {
      await uploadManager.clearCompleted()
    } catch (error) {
      console.error('Failed to clear completed uploads:', error)
    }
  }

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Uploads',
      'Are you sure you want to clear all uploads? This will cancel any active uploads.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await uploadManager.clearAll()
            } catch (error) {
              console.error('Failed to clear all uploads:', error)
            }
          }
        }
      ]
    )
  }

  const getStatusIcon = (status: UploadQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color={Colors.light.icon} />
      case 'uploading':
        return <Ionicons name="cloud-upload-outline" size={20} color={Colors.light.tint} />
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      case 'failed':
        return <Ionicons name="close-circle" size={20} color="#F44336" />
      case 'paused':
        return <Ionicons name="pause-circle" size={20} color="#FF9800" />
      case 'cancelled':
        return <Ionicons name="ban" size={20} color="#9E9E9E" />
      default:
        return <Ionicons name="help-circle" size={20} color={Colors.light.icon} />
    }
  }

  const getStatusColor = (status: UploadQueueItem['status']) => {
    switch (status) {
      case 'uploading':
        return Colors.light.tint
      case 'completed':
        return '#4CAF50'
      case 'failed':
        return '#F44336'
      case 'paused':
        return '#FF9800'
      case 'cancelled':
        return '#9E9E9E'
      default:
        return Colors.light.icon
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const renderUploadItem = (item: UploadQueueItem) => (
    <View key={item.id} style={styles.uploadItem}>
      <View style={styles.uploadHeader}>
        <View style={styles.fileInfo}>
          {getStatusIcon(item.status)}
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.fileName}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(item.size)}
            </Text>
          </View>
        </View>
        
        <View style={styles.uploadActions}>
          {item.status === 'uploading' && (
            <TouchableOpacity
              onPress={() => handlePauseUpload(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="pause" size={16} color={Colors.light.tint} />
            </TouchableOpacity>
          )}
          
          {(item.status === 'paused' || item.status === 'pending') && (
            <TouchableOpacity
              onPress={() => handleResumeUpload(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="play" size={16} color={Colors.light.tint} />
            </TouchableOpacity>
          )}
          
          {item.status === 'failed' && (
            <TouchableOpacity
              onPress={() => handleRetryUpload(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="refresh" size={16} color={Colors.light.tint} />
            </TouchableOpacity>
          )}
          
          {item.status !== 'completed' && (
            <TouchableOpacity
              onPress={() => handleCancelUpload(item.id, item.fileName)}
              style={styles.actionButton}
            >
              <Ionicons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress.progress}%`,
                backgroundColor: getStatusColor(item.status)
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(item.progress.progress)}%
        </Text>
      </View>

      {/* Upload Details */}
      <View style={styles.uploadDetails}>
        <Text style={styles.statusText}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
        
        {item.status === 'uploading' && item.progress.speed && (
          <Text style={styles.speedText}>
            {formatSpeed(item.progress.speed)}
          </Text>
        )}
        
        {item.status === 'uploading' && item.progress.estimatedTime && (
          <Text style={styles.timeText}>
            {formatTime(item.progress.estimatedTime)} remaining
          </Text>
        )}
        
        {item.status === 'failed' && item.error && (
          <Text style={styles.errorText} numberOfLines={2}>
            {item.error}
          </Text>
        )}
        
        {item.retryCount > 0 && (
          <Text style={styles.retryText}>
            Retry {item.retryCount}/{item.maxRetries}
          </Text>
        )}
      </View>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Progress</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.light.tint }]}>
              {stats.uploading}
            </Text>
            <Text style={styles.statLabel}>Uploading</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {stats.failed}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        {/* Overall Progress */}
        {stats.total > 0 && (
          <View style={styles.overallProgress}>
            <Text style={styles.overallProgressText}>
              Overall Progress: {stats.totalProgress}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${stats.totalProgress}%`,
                    backgroundColor: Colors.light.tint
                  }
                ]}
              />
            </View>
          </View>
        )}

        {/* Upload List */}
        <ScrollView style={styles.uploadList} showsVerticalScrollIndicator={false}>
          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-upload-outline" size={64} color={Colors.light.icon} />
              <Text style={styles.emptyText}>No uploads in progress</Text>
            </View>
          ) : (
            queue.map(renderUploadItem)
          )}
        </ScrollView>

        {/* Actions */}
        {queue.length > 0 && (
          <View style={styles.actions}>
            {stats.completed > 0 && (
              <TouchableOpacity
                onPress={handleClearCompleted}
                style={[styles.actionButton, styles.clearButton]}
              >
                <Text style={styles.clearButtonText}>Clear Completed</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.actionButton, styles.clearAllButton]}
            >
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  overallProgress: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  overallProgressText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  uploadList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 16,
  },
  uploadItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  fileSize: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    minWidth: 35,
    textAlign: 'right',
  },
  uploadDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    marginRight: 12,
  },
  speedText: {
    fontSize: 12,
    color: Colors.light.tint,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    color: '#FF9800',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearAllButtonText: {
    color: 'white',
    fontWeight: '500',
  },
})

export default UploadProgressModal