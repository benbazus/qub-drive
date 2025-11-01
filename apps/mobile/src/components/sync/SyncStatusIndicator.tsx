import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { syncService, SyncStatus } from '../../services/syncService'
import { useTheme } from '../../hooks/useTheme'

interface SyncStatusIndicatorProps {
  onPress?: () => void
  showDetails?: boolean
  compact?: boolean
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onPress,
  showDetails = false,
  compact = false
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingFiles: 0,
    conflictFiles: 0,
    failedFiles: 0,
  })
  const { colors } = useTheme()

  useEffect(() => {
    const unsubscribe = syncService.addStatusListener(setSyncStatus)
    
    // Get initial status
    syncService.getSyncStatus().then(setSyncStatus).catch(console.error)
    
    return unsubscribe
  }, [])

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <Ionicons name="cloud-offline" size={16} color={colors.error} />
    }
    
    if (syncStatus.isSyncing) {
      return <ActivityIndicator size="small" color={colors.primary} />
    }
    
    if (syncStatus.conflictFiles > 0) {
      return <Ionicons name="warning" size={16} color={colors.warning} />
    }
    
    if (syncStatus.failedFiles > 0) {
      return <Ionicons name="alert-circle" size={16} color={colors.error} />
    }
    
    return <Ionicons name="cloud-done" size={16} color={colors.success} />
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline'
    }
    
    if (syncStatus.isSyncing) {
      return 'Syncing...'
    }
    
    if (syncStatus.conflictFiles > 0) {
      return `${syncStatus.conflictFiles} conflicts`
    }
    
    if (syncStatus.failedFiles > 0) {
      return `${syncStatus.failedFiles} failed`
    }
    
    if (syncStatus.pendingFiles > 0) {
      return `${syncStatus.pendingFiles} pending`
    }
    
    return 'Synced'
  }

  const getLastSyncText = () => {
    if (!syncStatus.lastSyncTime) return 'Never synced'
    
    const now = new Date()
    const diff = now.getTime() - syncStatus.lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: compact ? 8 : 12,
      paddingVertical: compact ? 4 : 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      marginRight: 8,
    },
    textContainer: {
      flex: 1,
    },
    statusText: {
      fontSize: compact ? 12 : 14,
      fontWeight: '500',
      color: colors.text,
    },
    detailText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pressable: {
      opacity: 0.7,
    },
  })

  const content = (
    <View style={styles.content}>
      <View style={styles.icon}>
        {getStatusIcon()}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {showDetails && !compact && (
          <Text style={styles.detailText}>
            Last sync: {getLastSyncText()}
          </Text>
        )}
      </View>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.pressable]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return <View style={styles.container}>{content}</View>
}

export default SyncStatusIndicator