import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSync } from '../../hooks/useSync'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { SyncProgressModal } from './SyncProgressModal'
import { ConflictResolutionModal } from './ConflictResolutionModal'
import { useTheme } from '../../hooks/useTheme'
import { SyncConflict } from '../../services/syncService'

/**
 * Example component showing how to use the sync system
 * This demonstrates the complete sync workflow including:
 * - Status monitoring
 * - Manual sync triggering
 * - Progress tracking
 * - Conflict resolution
 */
export const SyncExample: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingFiles,
    conflictFiles,
    syncProgress,
    conflicts,
    startSync,
    resolveConflict,
    clearProgress,
    clearConflicts,
  } = useSync({ enableAutoSync: true })

  const [showProgressModal, setShowProgressModal] = useState(false)
  const [currentConflict, setCurrentConflict] = useState<SyncConflict | null>(null)
  const { colors } = useTheme()

  // Show conflict resolution modal when conflicts are detected
  useEffect(() => {
    if (conflicts.length > 0 && !currentConflict) {
      setCurrentConflict(conflicts[0])
    }
  }, [conflicts, currentConflict])

  const handleManualSync = async () => {
    try {
      clearProgress()
      clearConflicts()
      setShowProgressModal(true)
      await startSync(true)
      Alert.alert('Sync Complete', 'All files have been synchronized')
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to synchronize files')
    }
  }

  const handleConflictResolve = async (resolution: 'local' | 'remote' | 'merge') => {
    if (currentConflict) {
      try {
        await resolveConflict(currentConflict, resolution)
        setCurrentConflict(null)
        
        // Show next conflict if any
        const remainingConflicts = conflicts.filter(c => c.fileId !== currentConflict.fileId)
        if (remainingConflicts.length > 0) {
          setCurrentConflict(remainingConflicts[0])
        }
      } catch (error) {
        Alert.alert('Resolution Failed', 'Failed to resolve conflict')
      }
    }
  }

  const formatLastSyncTime = (time?: Date) => {
    if (!time) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - time.getTime()
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
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    statusContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    onlineStatus: {
      color: colors.success,
    },
    offlineStatus: {
      color: colors.error,
    },
    syncingStatus: {
      color: colors.warning,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginBottom: 12,
    },
    actionButtonDisabled: {
      backgroundColor: colors.border,
    },
    actionButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    actionButtonTextDisabled: {
      color: colors.textSecondary,
    },
    progressInfo: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    conflictAlert: {
      backgroundColor: colors.warning,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    conflictText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sync System Demo</Text>

      {/* Conflict Alert */}
      {conflictFiles > 0 && (
        <View style={styles.conflictAlert}>
          <Text style={styles.conflictText}>
            {conflictFiles} file{conflictFiles > 1 ? 's' : ''} need{conflictFiles === 1 ? 's' : ''} conflict resolution
          </Text>
        </View>
      )}

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <SyncStatusIndicator 
          showDetails 
          onPress={() => setShowProgressModal(true)} 
        />
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection</Text>
            <Text style={[
              styles.statusValue,
              isOnline ? styles.onlineStatus : styles.offlineStatus
            ]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[
              styles.statusValue,
              isSyncing ? styles.syncingStatus : undefined
            ]}>
              {isSyncing ? 'Syncing...' : 'Idle'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sync</Text>
            <Text style={styles.statusValue}>
              {formatLastSyncTime(lastSyncTime)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Files</Text>
            <Text style={styles.statusValue}>{pendingFiles}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Conflicts</Text>
            <Text style={[styles.statusValue, conflictFiles > 0 && { color: colors.warning }]}>
              {conflictFiles}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            (isSyncing || !isOnline) && styles.actionButtonDisabled
          ]}
          onPress={handleManualSync}
          disabled={isSyncing || !isOnline}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={(isSyncing || !isOnline) ? colors.textSecondary : colors.background} 
          />
          <Text style={[
            styles.actionButtonText,
            (isSyncing || !isOnline) && styles.actionButtonTextDisabled
          ]}>
            {isSyncing ? 'Syncing...' : 'Manual Sync'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowProgressModal(true)}
        >
          <Ionicons name="list" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>View Progress</Text>
        </TouchableOpacity>

        {/* Progress Info */}
        {syncProgress.length > 0 && (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {syncProgress.length} file{syncProgress.length > 1 ? 's' : ''} in progress
            </Text>
          </View>
        )}
      </View>

      {/* Progress Modal */}
      <SyncProgressModal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onConflictResolve={handleConflictResolve}
      />

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        visible={!!currentConflict}
        conflict={currentConflict}
        onResolve={handleConflictResolve}
        onCancel={() => setCurrentConflict(null)}
      />
    </View>
  )
}

export default SyncExample