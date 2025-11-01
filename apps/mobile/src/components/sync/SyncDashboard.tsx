import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { syncManager, SyncManagerStatus } from '../../services/syncManager'
import { SyncProgressModal } from './SyncProgressModal'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { useTheme } from '../../hooks/useTheme'

interface SyncDashboardProps {
  onClose?: () => void
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({ onClose }) => {
  const [status, setStatus] = useState<SyncManagerStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [statistics, setStatistics] = useState<{
    totalFilesSynced: number
    totalFilesInQueue: number
    totalConflicts: number
    totalErrors: number
  } | null>(null)
  const { colors } = useTheme()

  useEffect(() => {
    const unsubscribe = syncManager.addStatusListener(setStatus)
    loadStatistics()
    
    return unsubscribe
  }, [])

  const loadStatistics = async () => {
    try {
      const stats = await syncManager.getSyncStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to load sync statistics:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadStatistics()
      await syncManager.triggerSync(false)
    } catch (error) {
      Alert.alert('Refresh Failed', 'Failed to refresh sync status')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleForceSync = async () => {
    try {
      await syncManager.triggerSync(true)
      Alert.alert('Sync Started', 'Force sync has been initiated')
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to start force sync')
    }
  }

  const handleClearCompleted = async () => {
    try {
      await syncManager.clearCompletedQueueItems()
      Alert.alert('Cleared', 'Completed sync items have been cleared')
    } catch (error) {
      Alert.alert('Clear Failed', 'Failed to clear completed items')
    }
  }

  const toggleAutoSync = () => {
    if (status) {
      syncManager.updateOptions({
        enableAutoSync: !status.autoSyncEnabled
      })
    }
  }

  const formatLastSyncTime = (lastSyncTime?: Date) => {
    if (!lastSyncTime) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minutes ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  const renderStatusCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string = colors.primary
  ) => (
    <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statusCardHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.statusCardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statusCardValue, { color: colors.text }]}>{value}</Text>
    </View>
  )

  const renderActionButton = (
    title: string,
    onPress: () => void,
    icon: string,
    color: string = colors.primary,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: disabled ? colors.border : color }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={disabled ? colors.textSecondary : colors.background} 
      />
      <Text style={[
        styles.actionButtonText,
        { color: disabled ? colors.textSecondary : colors.background }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    statusIndicatorContainer: {
      marginBottom: 16,
    },
    statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statusCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusCardTitle: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 8,
      flex: 1,
    },
    statusCardValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      minWidth: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    syncInfo: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    syncInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    syncInfoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    syncInfoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    toggleButton: {
      padding: 8,
    },
  })

  if (!status) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sync Dashboard</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.textSecondary }}>Loading sync status...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sync Dashboard</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.statusIndicatorContainer}>
            <SyncStatusIndicator
              showDetails
              onPress={() => setShowProgressModal(true)}
            />
          </View>
        </View>

        {/* Statistics */}
        {statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statusGrid}>
              {renderStatusCard(
                'Files Synced',
                statistics.totalFilesSynced,
                'checkmark-circle',
                colors.success
              )}
              {renderStatusCard(
                'In Queue',
                statistics.totalFilesInQueue,
                'time',
                colors.warning
              )}
              {renderStatusCard(
                'Conflicts',
                statistics.totalConflicts,
                'warning',
                colors.error
              )}
              {renderStatusCard(
                'Errors',
                statistics.totalErrors,
                'alert-circle',
                colors.error
              )}
            </View>
          </View>
        )}

        {/* Sync Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Information</Text>
          <View style={styles.syncInfo}>
            <View style={styles.syncInfoRow}>
              <Text style={styles.syncInfoLabel}>Connection Status</Text>
              <Text style={[
                styles.syncInfoValue,
                { color: status.isOnline ? colors.success : colors.error }
              ]}>
                {status.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.syncInfoRow}>
              <Text style={styles.syncInfoLabel}>Last Sync</Text>
              <Text style={styles.syncInfoValue}>
                {formatLastSyncTime(status.lastSyncTime)}
              </Text>
            </View>
            <View style={styles.syncInfoRow}>
              <Text style={styles.syncInfoLabel}>Pending Files</Text>
              <Text style={styles.syncInfoValue}>
                {status.syncStats.pendingFiles}
              </Text>
            </View>
            <View style={styles.syncInfoRow}>
              <Text style={styles.syncInfoLabel}>Queue Items</Text>
              <Text style={styles.syncInfoValue}>
                {status.queueStats.totalItems}
              </Text>
            </View>
          </View>
        </View>

        {/* Auto Sync Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Auto Sync</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleAutoSync}
            >
              <Ionicons
                name={status.autoSyncEnabled ? 'toggle' : 'toggle-outline'}
                size={32}
                color={status.autoSyncEnabled ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionGrid}>
            {renderActionButton(
              'Force Sync',
              handleForceSync,
              'refresh',
              colors.primary,
              status.isSyncing
            )}
            {renderActionButton(
              'View Progress',
              () => setShowProgressModal(true),
              'list',
              colors.info
            )}
            {renderActionButton(
              'Clear Completed',
              handleClearCompleted,
              'trash',
              colors.warning
            )}
          </View>
        </View>
      </ScrollView>

      <SyncProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
      />
    </View>
  )
}

export default SyncDashboard