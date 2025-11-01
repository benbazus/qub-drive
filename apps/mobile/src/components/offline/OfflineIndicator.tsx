import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FileItem } from '../../types/file'
import { offlineFileManager } from '../../services/offlineFileManager'

interface OfflineIndicatorProps {
  file: FileItem
  showText?: boolean
  size?: 'small' | 'medium' | 'large'
  onPress?: () => void
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  file,
  showText = false,
  size = 'medium',
  onPress,
}) => {
  const [isAvailableOffline, setIsAvailableOffline] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'modified' | 'conflict'>('synced')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkOfflineStatus()
  }, [checkOfflineStatus, file.id])

  const checkOfflineStatus = async () => {
    try {
      setIsLoading(true)
      const available = await offlineFileManager.isFileAvailableOffline(file.id)
      setIsAvailableOffline(available)

      if (available) {
        const offlineFile = await offlineFileManager.getOfflineFile(file.id)
        if (offlineFile) {
          setSyncStatus(offlineFile.syncStatus)
        }
      }
    } catch (error) {
      console.error('Failed to check offline status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !isAvailableOffline) {
    return null
  }

  const getIndicatorConfig = () => {
    switch (syncStatus) {
      case 'modified':
        return {
          icon: 'sync-outline' as const,
          color: '#FF9500',
          text: 'Modified',
          backgroundColor: '#FFF3E0',
        }
      case 'conflict':
        return {
          icon: 'warning-outline' as const,
          color: '#FF3B30',
          text: 'Conflict',
          backgroundColor: '#FFEBEE',
        }
      case 'synced':
      default:
        return {
          icon: 'cloud-done-outline' as const,
          color: '#34C759',
          text: 'Offline',
          backgroundColor: '#E8F5E8',
        }
    }
  }

  const config = getIndicatorConfig()

  const getIconSize = () => {
    switch (size) {
      case 'small': return 12
      case 'large': return 20
      default: return 16
    }
  }

  const getContainerStyle = () => {
    const baseStyle = [styles.container]
    
    if (size === 'small') {
      baseStyle.push(styles.smallContainer)
    } else if (size === 'large') {
      baseStyle.push(styles.largeContainer)
    }

    baseStyle.push({ backgroundColor: config.backgroundColor })
    
    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.text, { color: config.color }]
    
    if (size === 'small') {
      baseStyle.push(styles.smallText)
    } else if (size === 'large') {
      baseStyle.push(styles.largeText)
    }
    
    return baseStyle
  }

  const content = (
    <View style={getContainerStyle()}>
      <Ionicons
        name={config.icon}
        size={getIconSize()}
        color={config.color}
      />
      {showText && (
        <Text style={getTextStyle()}>
          {config.text}
        </Text>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  largeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  smallText: {
    fontSize: 10,
    marginLeft: 3,
  },
  largeText: {
    fontSize: 12,
    marginLeft: 5,
  },
})

export default OfflineIndicator