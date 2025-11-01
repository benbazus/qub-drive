import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { secureStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/constants'
import { FileItem } from '@/types/file'

interface UploadHistoryItem {
  id: string
  fileName: string
  size: number
  uploadedAt: Date
  status: 'completed' | 'failed'
  error?: string
  result?: FileItem
}

interface UploadHistoryProps {
  onFilePress?: (file: FileItem) => void
  maxItems?: number
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  onFilePress,
  maxItems = 50
}) => {
  const colorScheme = useColorScheme()
  const [history, setHistory] = useState<UploadHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const storedHistory = await secureStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY)
      if (storedHistory) {
        const parsedHistory: UploadHistoryItem[] = JSON.parse(storedHistory)
        // Sort by upload date, most recent first
        const sortedHistory = parsedHistory
          .map(item => ({
            ...item,
            uploadedAt: new Date(item.uploadedAt)
          }))
          .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
          .slice(0, maxItems)
        
        setHistory(sortedHistory)
      }
    } catch (error) {
      console.error('Failed to load upload history:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadHistory()
    setRefreshing(false)
  }

  const clearHistory = async () => {
    Alert.alert(
      'Clear Upload History',
      'Are you sure you want to clear all upload history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY)
              setHistory([])
            } catch (error) {
              console.error('Failed to clear history:', error)
            }
          }
        }
      ]
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'document-text'
      case 'doc':
      case 'docx':
        return 'document'
      case 'xls':
      case 'xlsx':
        return 'grid'
      case 'ppt':
      case 'pptx':
        return 'easel'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image'
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'videocam'
      case 'mp3':
      case 'wav':
        return 'musical-notes'
      case 'zip':
      case 'rar':
        return 'archive'
      default:
        return 'document-outline'
    }
  }

  const renderHistoryItem = (item: UploadHistoryItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.historyItem,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}
      onPress={() => {
        if (item.status === 'completed' && item.result && onFilePress) {
          onFilePress(item.result)
        }
      }}
      disabled={item.status !== 'completed' || !item.result}
    >
      <View style={styles.itemHeader}>
        <View style={styles.fileInfo}>
          <View style={[
            styles.fileIcon,
            { 
              backgroundColor: item.status === 'completed' 
                ? `${Colors[colorScheme ?? 'light'].tint}20` 
                : '#F4433620'
            }
          ]}>
            <Ionicons
              name={getFileIcon(item.fileName) as any}
              size={20}
              color={item.status === 'completed' 
                ? Colors[colorScheme ?? 'light'].tint 
                : '#F44336'
              }
            />
          </View>
          
          <View style={styles.fileDetails}>
            <Text
              style={[
                styles.fileName,
                { color: Colors[colorScheme ?? 'light'].text }
              ]}
              numberOfLines={1}
            >
              {item.fileName}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(item.size)} • {formatDate(item.uploadedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          {item.status === 'completed' ? (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          ) : (
            <Ionicons name="close-circle" size={20} color="#F44336" />
          )}
        </View>
      </View>

      {item.status === 'failed' && item.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText} numberOfLines={2}>
            {item.error}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading upload history...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Upload History
        </Text>
        
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-upload-outline" size={64} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
            No upload history
          </Text>
          <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Your uploaded files will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.historyList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
        >
          {history.map(renderHistoryItem)}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    marginLeft: 12,
  },
  errorContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE0E0',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
})

export default UploadHistory