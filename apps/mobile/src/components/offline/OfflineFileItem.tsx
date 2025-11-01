import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { OfflineFileWithMetadata } from '@/services/storage/offlineStorage'

interface OfflineFileItemProps {
  file: OfflineFileWithMetadata
  isSelected: boolean
  isSelectionMode: boolean
  onPress: () => void
  onLongPress: () => void
}

export const OfflineFileItem: React.FC<OfflineFileItemProps> = ({
  file,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
}) => {
  const getFileIcon = (mimeType?: string): string => {
    if (!mimeType) return 'document-outline'
    
    if (mimeType.startsWith('image/')) return 'image-outline'
    if (mimeType.startsWith('video/')) return 'videocam-outline'
    if (mimeType.startsWith('audio/')) return 'musical-notes-outline'
    if (mimeType.includes('pdf')) return 'document-text-outline'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document-outline'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'grid-outline'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'easel-outline'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive-outline'
    
    return 'document-outline'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSyncStatusIcon = (syncStatus: string) => {
    switch (syncStatus) {
      case 'modified':
        return { name: 'sync-outline' as const, color: '#FF9500' }
      case 'conflict':
        return { name: 'warning-outline' as const, color: '#FF3B30' }
      case 'synced':
      default:
        return { name: 'checkmark-circle-outline' as const, color: '#34C759' }
    }
  }

  const syncStatusIcon = getSyncStatusIcon(file.syncStatus)

  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.container, isSelected && styles.selectedContainer]}>
        <View style={styles.content}>
          {/* Selection indicator */}
          {isSelectionMode && (
            <View style={styles.selectionContainer}>
              <View style={[styles.selectionCircle, isSelected && styles.selectedCircle]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </View>
          )}

          {/* File icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getFileIcon(file.mimeType)}
              size={24}
              color="#007AFF"
            />
          </View>

          {/* File info */}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.originalName}
            </Text>
            
            <View style={styles.metadata}>
              <Text style={styles.fileSize}>
                {formatFileSize(file.size)}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.downloadDate}>
                Downloaded {formatDate(file.downloadedAt)}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.syncStatus}>
                <Ionicons
                  name={syncStatusIcon.name}
                  size={14}
                  color={syncStatusIcon.color}
                />
                <Text style={[styles.syncStatusText, { color: syncStatusIcon.color }]}>
                  {file.syncStatus === 'modified' ? 'Modified' :
                   file.syncStatus === 'conflict' ? 'Conflict' : 'Synced'}
                </Text>
              </View>

              {file.isStarred && (
                <Ionicons name="star" size={14} color="#FFD700" />
              )}
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Last accessed info */}
        <View style={styles.accessInfo}>
          <Text style={styles.accessText}>
            Last accessed {formatDate(file.accessedAt)}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectionContainer: {
    marginRight: 12,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 6,
  },
  downloadDate: {
    fontSize: 12,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  accessInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  accessText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
})

export default OfflineFileItem