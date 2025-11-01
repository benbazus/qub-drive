import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { SelectedFile } from './FilePicker'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

interface FilePreviewProps {
  file: SelectedFile
  visible: boolean
  onClose: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  visible,
  onClose,
  onDelete,
  onEdit,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible && file) {
      loadFileContent()
    }
  }, [visible, file, loadFileContent])

  const loadFileContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For images, we can display them directly
      if (file.mimeType?.startsWith('image/')) {
        setFileContent(file.uri)
        return
      }

      // For text files, try to read the content
      if (file.mimeType?.startsWith('text/') || isTextFile(file.name)) {
        try {
          const content = await FileSystem.readAsStringAsync(file.uri)
          setFileContent(content)
        } catch (readError) {
          console.warn('Failed to read text file:', readError)
          setFileContent(null)
        }
        return
      }

      // For other files, we'll show file info only
      setFileContent(null)
    } catch (err) {
      console.error('Error loading file content:', err)
      setError('Failed to load file content')
    } finally {
      setIsLoading(false)
    }
  }, [file])

  const isTextFile = (fileName: string): boolean => {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.csv']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return textExtensions.includes(extension)
  }

  const isImageFile = (mimeType?: string): boolean => {
    return mimeType?.startsWith('image/') || false
  }

  const isVideoFile = (mimeType?: string): boolean => {
    return mimeType?.startsWith('video/') || false
  }

  const isAudioFile = (mimeType?: string): boolean => {
    return mimeType?.startsWith('audio/') || false
  }

  const isPdfFile = (mimeType?: string): boolean => {
    return mimeType === 'application/pdf'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getFileIcon = (): string => {
    if (isImageFile(file.mimeType)) return 'image'
    if (isVideoFile(file.mimeType)) return 'videocam'
    if (isAudioFile(file.mimeType)) return 'musical-notes'
    if (isPdfFile(file.mimeType)) return 'document-text'
    if (file.mimeType?.includes('zip') || file.mimeType?.includes('archive')) return 'archive'
    if (file.mimeType?.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) return 'grid'
    if (file.mimeType?.includes('presentation') || file.name.endsWith('.pptx')) return 'easel'
    if (file.mimeType?.includes('document') || file.name.endsWith('.docx')) return 'document'
    return 'document-outline'
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to remove "${file.name}" from the upload queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete?.()
            onClose()
          }
        },
      ]
    )
  }

  const renderFileContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )
    }

    // Image preview
    if (isImageFile(file.mimeType) && fileContent) {
      return (
        <ScrollView 
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <Image source={{ uri: fileContent }} style={styles.previewImage} />
        </ScrollView>
      )
    }

    // Text file preview
    if (fileContent && typeof fileContent === 'string' && !isImageFile(file.mimeType)) {
      return (
        <ScrollView style={styles.textScrollView}>
          <Text style={styles.textContent}>{fileContent}</Text>
        </ScrollView>
      )
    }

    // Generic file info
    return (
      <View style={styles.fileInfoContainer}>
        <View style={styles.fileIconContainer}>
          <Ionicons name={getFileIcon() as keyof typeof Ionicons.glyphMap} size={64} color="#666" />
        </View>
        
        <Text style={styles.fileName}>{file.name}</Text>
        <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
        
        {file.mimeType && (
          <Text style={styles.fileType}>{file.mimeType}</Text>
        )}

        <View style={styles.fileDetails}>
          <Text style={styles.detailLabel}>File Details:</Text>
          <Text style={styles.detailText}>• Name: {file.name}</Text>
          <Text style={styles.detailText}>• Size: {formatFileSize(file.size)}</Text>
          {file.mimeType && (
            <Text style={styles.detailText}>• Type: {file.mimeType}</Text>
          )}
          <Text style={styles.detailText}>• Preview: {
            isImageFile(file.mimeType) ? 'Available' : 
            isTextFile(file.name) ? 'Text content' : 
            'Not available'
          }</Text>
        </View>

        {!isImageFile(file.mimeType) && !isTextFile(file.name) && (
          <View style={styles.noPreviewContainer}>
            <Ionicons name="eye-off" size={24} color="#999" />
            <Text style={styles.noPreviewText}>
              Preview not available for this file type
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.title} numberOfLines={1}>
            {file.name}
          </Text>
          
          <View style={styles.headerActions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.headerButton}>
                <Ionicons name="create" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {renderFileContent()}
        </View>

        <View style={styles.footer}>
          <View style={styles.fileMetadata}>
            <Text style={styles.metadataText}>
              {formatFileSize(file.size)} • {file.mimeType || 'Unknown type'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight - 200,
  },
  previewImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  textScrollView: {
    flex: 1,
    padding: 16,
  },
  textContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fileInfoContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
  },
  fileDetails: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  noPreviewContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noPreviewText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  fileMetadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
})

export default FilePreview