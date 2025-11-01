import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FileItem } from '../../types/file'
import { useOfflineActions, useDownloadProgress } from '../../stores/offline/offlineStore'
import { offlineFileManager } from '../../services/offlineFileManager'

interface OfflineDownloadButtonProps {
  file: FileItem
  variant?: 'primary' | 'secondary' | 'icon'
  size?: 'small' | 'medium' | 'large'
  onDownloadStart?: () => void
  onDownloadComplete?: () => void
  onDownloadError?: (error: Error) => void
}

export const OfflineDownloadButton: React.FC<OfflineDownloadButtonProps> = ({
  file,
  variant = 'primary',
  size = 'medium',
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}) => {
  const { downloadFileForOffline, validateStorageSpace } = useOfflineActions()
  const downloadProgress = useDownloadProgress()
  const [isAvailableOffline, setIsAvailableOffline] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const currentProgress = downloadProgress[file.id]
  const isDownloading = currentProgress?.status === 'downloading'

  useEffect(() => {
    checkOfflineAvailability()
  }, [checkOfflineAvailability, file.id])

  const checkOfflineAvailability = async () => {
    try {
      setIsChecking(true)
      const available = await offlineFileManager.isFileAvailableOffline(file.id)
      setIsAvailableOffline(available)
    } catch (error) {
      console.error('Failed to check offline availability:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleDownload = async () => {
    if (isAvailableOffline || isDownloading) return

    try {
      // Validate storage space
      const validation = await validateStorageSpace(file.size || 0)
      if (!validation.canDownload) {
        Alert.alert('Storage Full', validation.message || 'Not enough storage space')
        return
      }

      onDownloadStart?.()
      await downloadFileForOffline(file)
      setIsAvailableOffline(true)
      onDownloadComplete?.()
    } catch (error) {
      const downloadError = error instanceof Error ? error : new Error('Download failed')
      onDownloadError?.(downloadError)
      
      Alert.alert(
        'Download Failed',
        downloadError.message,
        [{ text: 'OK' }]
      )
    }
  }

  const getButtonContent = () => {
    if (isChecking) {
      return {
        icon: 'cloud-outline',
        text: 'Checking...',
        disabled: true,
      }
    }

    if (isAvailableOffline) {
      return {
        icon: 'cloud-done-outline',
        text: 'Available Offline',
        disabled: true,
        color: '#34C759',
      }
    }

    if (isDownloading) {
      return {
        icon: null,
        text: `Downloading... ${Math.round(currentProgress?.progress || 0)}%`,
        disabled: true,
        showProgress: true,
      }
    }

    return {
      icon: 'cloud-download-outline',
      text: 'Download for Offline',
      disabled: false,
    }
  }

  const buttonContent = getButtonContent()

  const getButtonStyle = () => {
    const baseStyle = [styles.button]
    
    if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton)
    } else if (variant === 'icon') {
      baseStyle.push(styles.iconButton)
    } else {
      baseStyle.push(styles.primaryButton)
    }

    if (size === 'small') {
      baseStyle.push(styles.smallButton)
    } else if (size === 'large') {
      baseStyle.push(styles.largeButton)
    }

    if (buttonContent.disabled) {
      baseStyle.push(styles.disabledButton)
    }

    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText]
    
    if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButtonText)
    } else if (variant === 'icon') {
      baseStyle.push(styles.iconButtonText)
    }

    if (size === 'small') {
      baseStyle.push(styles.smallButtonText)
    } else if (size === 'large') {
      baseStyle.push(styles.largeButtonText)
    }

    if (buttonContent.color) {
      baseStyle.push({ color: buttonContent.color })
    }

    return baseStyle
  }

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16
      case 'large': return 24
      default: return 20
    }
  }

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handleDownload}
        disabled={buttonContent.disabled}
      >
        {buttonContent.showProgress ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          buttonContent.icon && (
            <Ionicons
              name={buttonContent.icon as any}
              size={getIconSize()}
              color={buttonContent.color || (buttonContent.disabled ? '#999' : '#007AFF')}
            />
          )
        )}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleDownload}
      disabled={buttonContent.disabled}
    >
      <View style={styles.buttonContent}>
        {buttonContent.showProgress ? (
          <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
        ) : (
          buttonContent.icon && (
            <Ionicons
              name={buttonContent.icon as any}
              size={getIconSize()}
              color={buttonContent.color || (variant === 'secondary' ? '#007AFF' : '#fff')}
              style={styles.buttonIcon}
            />
          )
        )}
        <Text style={getTextStyle()}>
          {buttonContent.text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  iconButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  iconButtonText: {
    display: 'none',
  },
  smallButtonText: {
    fontSize: 12,
  },
  largeButtonText: {
    fontSize: 16,
  },
})

export default OfflineDownloadButton