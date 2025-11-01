import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
// FileSystem import removed as it's not used
import { Ionicons } from '@expo/vector-icons'
import { FileItem, UploadProgress } from '@/types/file'
import { fileOperations } from '@/services/fileOperations'

// Screen width removed as it's not used

export interface FilePickerOptions {
  allowMultiple?: boolean
  maxFiles?: number
  allowedTypes?: string[]
  maxSize?: number
  parentId?: string
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (files: FileItem[]) => void
  onError?: (error: Error) => void
}

export interface SelectedFile {
  id: string
  uri: string
  name: string
  size: number
  type: string
  mimeType: string
  preview?: string | undefined
}

interface FilePickerProps {
  visible: boolean
  onClose: () => void
  options?: FilePickerOptions
}

export const FilePicker: React.FC<FilePickerProps> = ({
  visible,
  onClose,
  options = {},
}) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const {
    allowMultiple = true,
    maxFiles = 10,
    allowedTypes,
    maxSize = 100 * 1024 * 1024, // 100MB
    parentId,
    onProgress,
    onSuccess,
    onError,
  } = options

  const resetState = useCallback(() => {
    setSelectedFiles([])
    setIsUploading(false)
    setUploadProgress({})
  }, [])

  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetState()
      onClose()
    }
  }, [isUploading, resetState, onClose])

  const validateFile = useCallback((file: { size: number; name: string; type?: string }) => {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`)
    }

    // Check allowed types if specified
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = getFileExtension(file.name).toLowerCase()
      const mimeType = file.type?.toLowerCase() || ''
      
      const isAllowed = allowedTypes.some(type => 
        mimeType.includes(type.toLowerCase()) || 
        fileExtension === type.toLowerCase()
      )

      if (!isAllowed) {
        throw new Error(`File type not allowed for "${file.name}". Allowed types: ${allowedTypes.join(', ')}`)
      }
    }

    return true
  }, [maxSize, allowedTypes])

  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot) : ''
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const generatePreview = async (uri: string, mimeType?: string): Promise<string | undefined> => {
    try {
      // For images, return the URI directly for preview
      if (mimeType?.startsWith('image/')) {
        return uri
      }
      
      // For other files, we could generate thumbnails in the future
      return undefined
    } catch (error) {
      console.warn('Failed to generate preview:', error)
      return undefined
    }
  }

  const addSelectedFile = useCallback(async (asset: {
    uri: string
    name: string
    size: number
    mimeType?: string
  }) => {
    try {
      validateFile(asset)

      // Check if we've reached the maximum number of files
      if (!allowMultiple && selectedFiles.length >= 1) {
        setSelectedFiles([]) // Clear existing files for single selection
      } else if (selectedFiles.length >= maxFiles) {
        Alert.alert('Maximum Files', `You can only select up to ${maxFiles} files`)
        return
      }

      const preview = await generatePreview(asset.uri, asset.mimeType)

      const newFile: SelectedFile = {
        id: `${Date.now()}_${Math.random()}`,
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        type: asset.mimeType || 'application/octet-stream',
        mimeType: asset.mimeType || 'application/octet-stream',
        preview,
      }

      setSelectedFiles(prev => allowMultiple ? [...prev, newFile] : [newFile])
    } catch (error) {
      Alert.alert('File Error', error instanceof Error ? error.message : 'Invalid file')
    }
  }, [selectedFiles, allowMultiple, maxFiles, validateFile])

  const removeSelectedFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const handleDocumentPicker = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: allowMultiple,
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await addSelectedFile({
            uri: asset.uri,
            name: asset.name,
            size: asset.size || 0,
            mimeType: asset.mimeType || 'application/octet-stream',
          })
        }
      }
    } catch (error) {
      console.error('Document picker error:', error)
      Alert.alert('Error', 'Failed to pick document')
    }
  }, [allowMultiple, addSelectedFile])

  const handleImagePicker = useCallback(async (source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos')
          return
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is required to select photos')
          return
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: allowMultiple,
        })
      }

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await addSelectedFile({
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            size: asset.fileSize || 0,
            mimeType: 'image/jpeg',
          })
        }
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }, [allowMultiple, addSelectedFile])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No Files', 'Please select files to upload')
      return
    }

    setIsUploading(true)
    const uploadedFiles: FileItem[] = []

    try {
      for (const file of selectedFiles) {
        const fileProgress = (progress: UploadProgress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.id]: progress.progress,
          }))
          onProgress?.(progress)
        }

        const uploadedFile = await fileOperations.uploadFileFromUri(
          file.uri,
          file.name,
          {
            parentId: parentId || null,
            callbacks: {
              onProgress: fileProgress,
              onError: (error) => {
                console.error(`Upload failed for ${file.name}:`, error)
              },
            },
          }
        )

        uploadedFiles.push(uploadedFile)
      }

      onSuccess?.(uploadedFiles)
      Alert.alert('Success', `${uploadedFiles.length} file(s) uploaded successfully`)
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      Alert.alert('Upload Error', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, parentId, onProgress, onSuccess, onError, handleClose])

  const renderFilePreview = (file: SelectedFile) => (
    <View key={file.id} style={styles.filePreview}>
      <View style={styles.filePreviewContent}>
        {file.preview ? (
          <View style={styles.imagePreview}>
            <Text style={styles.imagePreviewText}>📷</Text>
          </View>
        ) : (
          <View style={styles.fileIcon}>
            <Ionicons name="document" size={24} color="#666" />
          </View>
        )}
        
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(file.size)}
          </Text>
          {isUploading && uploadProgress[file.id] !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress[file.id] || 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(uploadProgress[file.id] || 0)}%
              </Text>
            </View>
          )}
        </View>

        {!isUploading && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeSelectedFile(file.id)}
          >
            <Ionicons name="close-circle" size={20} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isUploading}>
            <Text style={[styles.headerButton, isUploading && styles.disabledText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Select Files</Text>
          
          <TouchableOpacity 
            onPress={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            <Text style={[
              styles.headerButton,
              styles.uploadButton,
              (selectedFiles.length === 0 || isUploading) && styles.disabledText
            ]}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* File Selection Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDocumentPicker}
              disabled={isUploading}
            >
              <Ionicons name="document-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Browse Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleImagePicker('camera')}
              disabled={isUploading}
            >
              <Ionicons name="camera-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleImagePicker('library')}
              disabled={isUploading}
            >
              <Ionicons name="images-outline" size={24} color="#007AFF" />
              <Text style={styles.optionText}>Photo Library</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <View style={styles.selectedFilesContainer}>
              <Text style={styles.sectionTitle}>
                Selected Files ({selectedFiles.length}/{allowMultiple ? maxFiles : 1})
              </Text>
              
              {selectedFiles.map(renderFilePreview)}
            </View>
          )}

          {/* Upload Guidelines */}
          <View style={styles.guidelinesContainer}>
            <Text style={styles.guidelinesTitle}>Upload Guidelines</Text>
            <Text style={styles.guidelineText}>
              • Maximum file size: {formatFileSize(maxSize)}
            </Text>
            <Text style={styles.guidelineText}>
              • Maximum files: {allowMultiple ? maxFiles : 1}
            </Text>
            {allowedTypes && allowedTypes.length > 0 && (
              <Text style={styles.guidelineText}>
                • Allowed types: {allowedTypes.join(', ')}
              </Text>
            )}
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  uploadButton: {
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 4,
  },
  optionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedFilesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  filePreview: {
    marginBottom: 12,
  },
  filePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imagePreviewText: {
    fontSize: 20,
  },
  fileIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    minWidth: 30,
  },
  removeButton: {
    padding: 4,
  },
  guidelinesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
})

export default FilePicker