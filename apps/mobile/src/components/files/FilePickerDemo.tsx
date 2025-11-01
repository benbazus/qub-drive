import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FileItem, UploadProgress } from '@/types/file'
import FileSelectionManager, { 
  DocumentPickerButton, 
  CameraButton, 
  GalleryButton,
  FileSelectionOptions 
} from './FileSelectionManager'
import useFileUpload from '@/hooks/useFileUpload'

export const FilePickerDemo: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)

  const {
    uploadQueue,
    isUploading,
    getUploadStats,
    clearCompleted,
    clearAll,
  } = useFileUpload({
    maxConcurrentUploads: 2,
    autoStart: true,
    onProgress: (item) => {
      console.log(`Upload progress for ${item.fileName}: ${item.progress.progress}%`)
    },
    onComplete: (item) => {
      console.log(`Upload completed: ${item.fileName}`)
      if (item.result) {
        setUploadedFiles(prev => [...prev, item.result!])
      }
    },
    onError: (item, error) => {
      console.error(`Upload failed for ${item.fileName}:`, error)
      Alert.alert('Upload Error', `Failed to upload ${item.fileName}: ${error.message}`)
    },
    onAllComplete: (results) => {
      console.log(`All uploads completed. ${results.length} files uploaded.`)
      Alert.alert('Success', `${results.length} file(s) uploaded successfully!`)
    },
  })

  const handleFileSuccess = (files: FileItem[]) => {
    console.log('Files uploaded successfully:', files)
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleFileError = (error: Error) => {
    console.error('File upload error:', error)
    Alert.alert('Upload Error', error.message)
  }

  const handleProgress = (progress: UploadProgress) => {
    console.log(`Upload progress: ${progress.fileName} - ${progress.progress}%`)
  }

  const fileSelectionOptions: FileSelectionOptions = {
    allowMultiple: true,
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024, // 50MB
    parentId: currentParentId,
    showCamera: true,
    showDocuments: true,
    showGallery: true,
    onProgress: handleProgress,
    onSuccess: handleFileSuccess,
    onError: handleFileError,
  }

  const stats = getUploadStats()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const renderUploadQueue = () => {
    if (uploadQueue.length === 0) return null

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upload Queue ({uploadQueue.length})</Text>
          <View style={styles.queueActions}>
            <TouchableOpacity onPress={clearCompleted} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Clear Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
              <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Progress</Text>
            <Text style={styles.statValue}>{stats.totalProgress}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{stats.completed}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Failed</Text>
            <Text style={styles.statValue}>{stats.failed}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Uploading</Text>
            <Text style={styles.statValue}>{stats.uploading}</Text>
          </View>
        </View>

        {/* Queue Items */}
        {uploadQueue.map(item => (
          <View key={item.id} style={styles.queueItem}>
            <View style={styles.queueItemHeader}>
              <Text style={styles.queueItemName} numberOfLines={1}>
                {item.fileName}
              </Text>
              <Text style={styles.queueItemSize}>
                {formatFileSize(item.size)}
              </Text>
            </View>
            
            <View style={styles.queueItemProgress}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${item.progress.progress}%`,
                      backgroundColor: 
                        item.status === 'completed' ? '#4CAF50' :
                        item.status === 'failed' ? '#ff4444' :
                        item.status === 'cancelled' ? '#999' :
                        '#007AFF'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(item.progress.progress)}%
              </Text>
            </View>

            <View style={styles.queueItemFooter}>
              <Text style={[
                styles.statusText,
                {
                  color: 
                    item.status === 'completed' ? '#4CAF50' :
                    item.status === 'failed' ? '#ff4444' :
                    item.status === 'cancelled' ? '#999' :
                    '#007AFF'
                }
              ]}>
                {item.status.toUpperCase()}
              </Text>
              
              {item.error && (
                <Text style={styles.errorText} numberOfLines={1}>
                  {item.error}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    )
  }

  const renderUploadedFiles = () => {
    if (uploadedFiles.length === 0) return null

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uploaded Files ({uploadedFiles.length})</Text>
        
        {uploadedFiles.map(file => (
          <View key={file.id} style={styles.fileItem}>
            <View style={styles.fileIcon}>
              <Ionicons 
                name={file.type === 'folder' ? 'folder' : 'document'} 
                size={24} 
                color="#666" 
              />
            </View>
            
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileDetails}>
                {file.size ? formatFileSize(file.size) : 'Unknown size'} • {file.mimeType || 'Unknown type'}
              </Text>
              <Text style={styles.fileDate}>
                {new Date(file.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>File Picker Demo</Text>
        <Text style={styles.subtitle}>
          Test file selection, camera integration, and upload functionality
        </Text>
      </View>

      {/* Main File Selection Manager */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complete File Selection</Text>
        <FileSelectionManager options={fileSelectionOptions} />
      </View>

      {/* Individual Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Components</Text>
        
        <View style={styles.buttonRow}>
          <DocumentPickerButton
            onSuccess={handleFileSuccess}
            onError={handleFileError}
            parentId={currentParentId}
            style={styles.individualButton}
          />
          
          <CameraButton
            onSuccess={(file) => handleFileSuccess([file])}
            onError={handleFileError}
            parentId={currentParentId}
            style={styles.individualButton}
          />
          
          <GalleryButton
            onSuccess={handleFileSuccess}
            onError={handleFileError}
            parentId={currentParentId}
            allowMultiple={true}
            style={styles.individualButton}
          />
        </View>
      </View>

      {/* Custom Trigger Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Trigger</Text>
        
        <FileSelectionManager options={fileSelectionOptions}>
          <View style={styles.customTrigger}>
            <Ionicons name="cloud-upload" size={32} color="#007AFF" />
            <Text style={styles.customTriggerText}>Tap to Upload Files</Text>
            <Text style={styles.customTriggerSubtext}>
              Documents, photos, or camera
            </Text>
          </View>
        </FileSelectionManager>
      </View>

      {/* Upload Queue */}
      {renderUploadQueue()}

      {/* Uploaded Files */}
      {renderUploadedFiles()}

      {/* Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Max Files:</Text>
          <Text style={styles.configValue}>{fileSelectionOptions.maxFiles}</Text>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Max Size:</Text>
          <Text style={styles.configValue}>
            {formatFileSize(fileSelectionOptions.maxSize || 0)}
          </Text>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Allow Multiple:</Text>
          <Text style={styles.configValue}>
            {fileSelectionOptions.allowMultiple ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  individualButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  customTrigger: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  customTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  customTriggerSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  queueActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  queueItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  queueItemSize: {
    fontSize: 12,
    color: '#666',
  },
  queueItemProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    minWidth: 30,
  },
  queueItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorText: {
    flex: 1,
    fontSize: 10,
    color: '#ff4444',
    textAlign: 'right',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
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
  fileDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 10,
    color: '#999',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
})

export default FilePickerDemo