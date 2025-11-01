import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { FileItem, UploadProgress } from '@/types/file'
import { fileOperations } from '@/services/fileOperations'

const { width: screenWidth } = Dimensions.get('window')

export interface CameraOptions {
  quality?: number
  allowsEditing?: boolean
  aspect?: [number, number]
  parentId?: string
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (file: FileItem) => void
  onError?: (error: Error) => void
}

interface CameraIntegrationProps {
  visible: boolean
  onClose: () => void
  options?: CameraOptions
}

export const CameraIntegration: React.FC<CameraIntegrationProps> = ({
  visible,
  onClose,
  options = {},
}) => {
  const [capturedImage, setCapturedImage] = useState<{
    uri: string
    fileName: string
    size: number
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    quality = 0.8,
    allowsEditing = true,
    aspect = [4, 3],
    parentId,
    onProgress,
    onSuccess,
    onError,
  } = options

  const resetState = useCallback(() => {
    setCapturedImage(null)
    setIsUploading(false)
    setUploadProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetState()
      onClose()
    }
  }, [isUploading, resetState, onClose])

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera permission to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => {
                // On iOS, this will open the app settings
                if (Platform.OS === 'ios') {
                  ImagePicker.requestCameraPermissionsAsync()
                }
              }
            },
          ]
        )
        return false
      }
      
      return true
    } catch (error) {
      console.error('Camera permission error:', error)
      Alert.alert('Error', 'Failed to request camera permission')
      return false
    }
  }

  const capturePhoto = useCallback(async () => {
    try {
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) return

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
        exif: false, // Don't include EXIF data for privacy
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri)
        
        setCapturedImage({
          uri: asset.uri,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          size: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0,
        })
      }
    } catch (error) {
      console.error('Camera capture error:', error)
      Alert.alert('Camera Error', 'Failed to capture photo')
    }
  }, [allowsEditing, aspect, quality])

  const selectFromGallery = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Media Library Permission Required',
          'This app needs media library permission to select photos. Please enable it in your device settings.'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
        exif: false,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri)
        
        setCapturedImage({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          size: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0,
        })
      }
    } catch (error) {
      console.error('Gallery selection error:', error)
      Alert.alert('Gallery Error', 'Failed to select photo from gallery')
    }
  }, [allowsEditing, aspect, quality])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const uploadPhoto = useCallback(async () => {
    if (!capturedImage) {
      Alert.alert('No Photo', 'Please capture or select a photo first')
      return
    }

    setIsUploading(true)

    try {
      const uploadedFile = await fileOperations.uploadFileFromUri(
        capturedImage.uri,
        capturedImage.fileName,
        {
          parentId: parentId || null,
          callbacks: {
            onProgress: (progress) => {
              setUploadProgress(progress.progress)
              onProgress?.(progress)
            },
            onError: (error) => {
              console.error('Upload error:', error)
              onError?.(error)
            },
          },
        }
      )

      onSuccess?.(uploadedFile)
      Alert.alert('Success', 'Photo uploaded successfully')
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      Alert.alert('Upload Error', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [capturedImage, parentId, onProgress, onSuccess, onError, handleClose])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isUploading}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Camera</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {!capturedImage ? (
            // Camera options screen
            <View style={styles.cameraOptions}>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={capturePhoto}
                >
                  <View style={styles.cameraButtonInner}>
                    <Ionicons name="camera" size={32} color="#fff" />
                  </View>
                  <Text style={styles.cameraButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={selectFromGallery}
                >
                  <Ionicons name="images" size={24} color="#007AFF" />
                  <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Camera Tips</Text>
                <Text style={styles.instructionText}>
                  • Ensure good lighting for better photo quality
                </Text>
                <Text style={styles.instructionText}>
                  • Hold the device steady while taking photos
                </Text>
                <Text style={styles.instructionText}>
                  • You can edit the photo before uploading
                </Text>
              </View>
            </View>
          ) : (
            // Photo preview and upload screen
            <View style={styles.previewContainer}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
                
                {isUploading && (
                  <View style={styles.uploadOverlay}>
                    <View style={styles.progressContainer}>
                      <Text style={styles.uploadingText}>Uploading...</Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.photoInfo}>
                <Text style={styles.photoName}>{capturedImage.fileName}</Text>
                <Text style={styles.photoSize}>
                  Size: {formatFileSize(capturedImage.size)}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.retakeButton]}
                  onPress={retakePhoto}
                  disabled={isUploading}
                >
                  <Ionicons name="camera-reverse" size={20} color="#666" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.uploadButton, isUploading && styles.disabledButton]}
                  onPress={uploadPhoto}
                  disabled={isUploading}
                >
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  cameraOptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  optionsContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  cameraButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cameraButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  galleryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  uploadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  progressBar: {
    width: screenWidth - 64,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
  },
  photoInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  photoName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  photoSize: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  retakeButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  retakeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  uploadButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
})

export default CameraIntegration