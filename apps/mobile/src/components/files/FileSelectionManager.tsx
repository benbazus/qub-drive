import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { FileItem, UploadProgress } from '@/types/file'
import FilePicker, { FilePickerOptions, SelectedFile } from './FilePicker'
import CameraIntegration, { CameraOptions } from './CameraIntegration'
import FilePreview from './FilePreview'

export interface FileSelectionOptions {
  allowMultiple?: boolean
  maxFiles?: number
  allowedTypes?: string[]
  maxSize?: number
  parentId?: string
  showCamera?: boolean
  showDocuments?: boolean
  showGallery?: boolean
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (files: FileItem[]) => void
  onError?: (error: Error) => void
}

interface FileSelectionManagerProps {
  options?: FileSelectionOptions
  children?: React.ReactNode
  style?: object
}

export const FileSelectionManager: React.FC<FileSelectionManagerProps> = ({
  options = {},
  children,
  style,
}) => {
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null)

  const {
    allowMultiple = true,
    maxFiles = 10,
    allowedTypes,
    maxSize = 100 * 1024 * 1024, // 100MB
    parentId,
    showCamera: enableCamera = true,
    showDocuments: enableDocuments = true,
    showGallery: enableGallery = true,
    onProgress,
    onSuccess,
    onError,
  } = options

  const showSelectionOptions = useCallback(() => {
    const options: string[] = []
    
    if (enableDocuments) {
      options.push('Browse Files')
    }
    
    if (enableCamera) {
      options.push('Take Photo')
    }
    
    if (enableGallery) {
      options.push('Photo Library')
    }
    
    options.push('Cancel')

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Select Files',
        },
        (buttonIndex) => {
          if (buttonIndex === options.length - 1) return // Cancel

          const selectedOption = options[buttonIndex]
          
          switch (selectedOption) {
            case 'Browse Files':
              setShowFilePicker(true)
              break
            case 'Take Photo':
              setShowCamera(true)
              break
            case 'Photo Library':
              handleImagePicker()
              break
          }
        }
      )
    } else {
      // Android - show custom modal or use FilePicker directly
      setShowFilePicker(true)
    }
  }, [enableDocuments, enableCamera, enableGallery, handleImagePicker])

  const uploadSelectedFiles = useCallback(async (files: SelectedFile[]) => {
    try {
      const uploadedFiles: FileItem[] = []

      for (const file of files) {
        // Import fileOperations here to avoid circular dependency
        const { fileOperations } = require('@/services/fileOperations')
        
        const uploadedFile = await fileOperations.uploadFileFromUri(
          file.uri,
          file.name,
          {
            parentId: parentId || null,
            callbacks: {
              onProgress: onProgress || undefined,
              onError: (error: Error) => {
                console.error(`Upload failed for ${file.name}:`, error)
                onError?.(error)
              },
            },
          }
        )

        uploadedFiles.push(uploadedFile)
      }

      onSuccess?.(uploadedFiles)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Upload failed'))
    }
  }, [parentId, onProgress, onSuccess, onError])

  const handleImagePicker = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select photos'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: allowMultiple,
      })

      if (!result.canceled && result.assets) {
        // Convert to SelectedFile format and upload
        const files = result.assets.map(asset => ({
          id: `${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          mimeType: 'image/jpeg',
        }))

        // Upload files directly
        await uploadSelectedFiles(files)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to select image'))
    }
  }, [allowMultiple, onError, uploadSelectedFiles])



  const filePickerOptions: FilePickerOptions = {
    allowMultiple,
    maxFiles,
    ...(allowedTypes && { allowedTypes }),
    maxSize,
    ...(parentId && { parentId }),
    ...(onProgress && { onProgress }),
    ...(onSuccess && { onSuccess }),
    ...(onError && { onError }),
  }

  const cameraOptions: CameraOptions = {
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
    ...(parentId && { parentId }),
    ...(onProgress && { onProgress }),
    onSuccess: (file) => onSuccess?.([file]),
    ...(onError && { onError }),
  }

  // If children are provided, render them as the trigger
  if (children) {
    return (
      <>
        <TouchableOpacity onPress={showSelectionOptions} style={style}>
          {children}
        </TouchableOpacity>

        <FilePicker
          visible={showFilePicker}
          onClose={() => setShowFilePicker(false)}
          options={filePickerOptions}
        />

        <CameraIntegration
          visible={showCamera}
          onClose={() => setShowCamera(false)}
          options={cameraOptions}
        />

        {previewFile && (
          <FilePreview
            file={previewFile}
            visible={!!previewFile}
            onClose={() => setPreviewFile(null)}
            onDelete={() => {
              setPreviewFile(null)
              // Handle file deletion from selection
            }}
          />
        )}
      </>
    )
  }

  // Default button UI
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.uploadButton} onPress={showSelectionOptions}>
        <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
        <Text style={styles.uploadButtonText}>Upload Files</Text>
      </TouchableOpacity>

      <FilePicker
        visible={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        options={filePickerOptions}
      />

      <CameraIntegration
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        options={cameraOptions}
      />

      {previewFile && (
        <FilePreview
          file={previewFile}
          visible={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={() => {
            setPreviewFile(null)
          }}
        />
      )}
    </View>
  )
}

// Quick access components for specific use cases
export const DocumentPickerButton: React.FC<{
  onSuccess?: (files: FileItem[]) => void
  onError?: (error: Error) => void
  parentId?: string
  style?: object
}> = ({ onSuccess, onError, parentId, style }) => {
  const handleDocumentPick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets) {
        const { fileOperations } = require('@/services/fileOperations')
        const uploadedFiles: FileItem[] = []

        for (const asset of result.assets) {
          const uploadedFile = await fileOperations.uploadFileFromUri(
            asset.uri,
            asset.name,
            { parentId: parentId || null }
          )
          uploadedFiles.push(uploadedFile)
        }

        onSuccess?.(uploadedFiles)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Document picker failed'))
    }
  }, [onSuccess, onError, parentId])

  return (
    <TouchableOpacity style={[styles.quickButton, style]} onPress={handleDocumentPick}>
      <Ionicons name="document-outline" size={20} color="#007AFF" />
      <Text style={styles.quickButtonText}>Documents</Text>
    </TouchableOpacity>
  )
}

export const CameraButton: React.FC<{
  onSuccess?: (file: FileItem) => void
  onError?: (error: Error) => void
  parentId?: string
  style?: object
}> = ({ onSuccess, onError, parentId, style }) => {
  const [showCamera, setShowCamera] = useState(false)

  const cameraOptions: CameraOptions = {
    quality: 0.8,
    allowsEditing: true,
    ...(parentId && { parentId }),
    ...(onSuccess && { onSuccess }),
    ...(onError && { onError }),
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.quickButton, style]} 
        onPress={() => setShowCamera(true)}
      >
        <Ionicons name="camera-outline" size={20} color="#007AFF" />
        <Text style={styles.quickButtonText}>Camera</Text>
      </TouchableOpacity>

      <CameraIntegration
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        options={cameraOptions}
      />
    </>
  )
}

export const GalleryButton: React.FC<{
  onSuccess?: (files: FileItem[]) => void
  onError?: (error: Error) => void
  parentId?: string
  allowMultiple?: boolean
  style?: object
}> = ({ onSuccess, onError, parentId, allowMultiple = true, style }) => {
  const handleGalleryPick = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: allowMultiple,
      })

      if (!result.canceled && result.assets) {
        const { fileOperations } = require('@/services/fileOperations')
        const uploadedFiles: FileItem[] = []

        for (const asset of result.assets) {
          const uploadedFile = await fileOperations.uploadFileFromUri(
            asset.uri,
            asset.fileName || `image_${Date.now()}.jpg`,
            { parentId: parentId || null }
          )
          uploadedFiles.push(uploadedFile)
        }

        onSuccess?.(uploadedFiles)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Gallery picker failed'))
    }
  }, [onSuccess, onError, parentId, allowMultiple])

  return (
    <TouchableOpacity style={[styles.quickButton, style]} onPress={handleGalleryPick}>
      <Ionicons name="images-outline" size={20} color="#007AFF" />
      <Text style={styles.quickButtonText}>Gallery</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
})

export default FileSelectionManager