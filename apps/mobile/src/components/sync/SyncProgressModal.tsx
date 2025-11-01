import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { syncService, SyncProgress, SyncResult, SyncConflict } from '../../services/syncService'
import { useTheme } from '../../hooks/useTheme'

interface SyncProgressModalProps {
  visible: boolean
  onClose: () => void
  onConflictResolve?: (conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge') => void
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  visible,
  onClose,
  onConflictResolve
}) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { colors } = useTheme()

  useEffect(() => {
    if (!visible) {
      setSyncProgress([])
      setSyncResult(null)
      setIsSyncing(false)
    }
  }, [visible])

  const startSync = async () => {
    setIsSyncing(true)
    setSyncProgress([])
    setSyncResult(null)
    setConflicts([])

    try {
      await syncService.syncAll({
        forceSync: true,
        onProgress: (progress) => {
          setSyncProgress(prev => {
            const existing = prev.find(p => p.fileId === progress.fileId)
            if (existing) {
              return prev.map(p => p.fileId === progress.fileId ? progress : p)
            }
            return [...prev, progress]
          })
        },
        onConflict: async (_conflict) => {
          return 'manual' // Let user resolve manually
        },
        onComplete: (result) => {
          setSyncResult(result)
          setIsSyncing(false)
        },
        onError: (_error) => {
          Alert.alert('Sync Error', 'Sync operation failed')
          setIsSyncing(false)
        }
      })
    } catch (error) {
      console.error('Sync failed:', error)
      setIsSyncing(false)
    }
  }

  const resolveConflict = async (conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge') => {
    try {
      onConflictResolve?.(conflict, resolution)
      
      // Update progress
      setSyncProgress(prev => prev.map(p => 
        p.fileId === conflict.fileId 
          ? { ...p, status: 'completed', progress: 100 }
          : p
      ))
    } catch {
      Alert.alert('Resolution Error', 'Failed to resolve conflict')
    }
  }

  const getProgressIcon = (progress: SyncProgress) => {
    switch (progress.status) {
      case 'pending':
        return <Ionicons name="time" size={16} color={colors.textSecondary} />
      case 'syncing':
        return <ActivityIndicator size="small" color={colors.primary} />
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      case 'failed':
        return <Ionicons name="close-circle" size={16} color={colors.error} />
      case 'conflict':
        return <Ionicons name="warning" size={16} color={colors.warning} />
      default:
        return <Ionicons name="help-circle" size={16} color={colors.textSecondary} />
    }
  }

  const renderProgressItem = (progress: SyncProgress) => (
    <View key={progress.fileId} style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <View style={styles.progressIcon}>
          {getProgressIcon(progress)}
        </View>
        <Text style={styles.fileName} numberOfLines={1}>
          {progress.fileName}
        </Text>
        <Text style={styles.progressPercent}>
          {progress.progress}%
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progress.progress}%`,
              backgroundColor: progress.status === 'failed' ? colors.error :
                              progress.status === 'conflict' ? colors.warning :
                              colors.primary
            }
          ]} 
        />
      </View>
      
      {progress.error && (
        <Text style={styles.errorText}>{progress.error}</Text>
      )}
      
      {progress.conflict && (
        <View style={styles.conflictActions}>
          <Text style={styles.conflictText}>Conflict detected</Text>
          <View style={styles.conflictButtons}>
            <TouchableOpacity
              style={[styles.conflictButton, { backgroundColor: colors.primary }]}
              onPress={() => resolveConflict(progress.conflict!, 'local')}
            >
              <Text style={styles.conflictButtonText}>Keep Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.conflictButton, { backgroundColor: colors.secondary }]}
              onPress={() => resolveConflict(progress.conflict!, 'remote')}
            >
              <Text style={styles.conflictButtonText}>Keep Remote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.conflictButton, { backgroundColor: colors.warning }]}
              onPress={() => resolveConflict(progress.conflict!, 'merge')}
            >
              <Text style={styles.conflictButtonText}>Merge</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )

  const renderSyncResult = () => {
    if (!syncResult) return null

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Sync Complete</Text>
        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatNumber}>{syncResult.syncedFiles}</Text>
            <Text style={styles.resultStatLabel}>Synced</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatNumber, { color: colors.warning }]}>
              {syncResult.conflictFiles}
            </Text>
            <Text style={styles.resultStatLabel}>Conflicts</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatNumber, { color: colors.error }]}>
              {syncResult.failedFiles}
            </Text>
            <Text style={styles.resultStatLabel}>Failed</Text>
          </View>
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    startButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    progressItem: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressIcon: {
      marginRight: 8,
    },
    fileName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    progressPercent: {
      fontSize: 12,
      color: colors.textSecondary,
      minWidth: 40,
      textAlign: 'right',
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    conflictActions: {
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.background,
      borderRadius: 6,
    },
    conflictText: {
      fontSize: 12,
      color: colors.warning,
      marginBottom: 8,
      fontWeight: '500',
    },
    conflictButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    conflictButton: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      alignItems: 'center',
    },
    conflictButtonText: {
      color: colors.background,
      fontSize: 11,
      fontWeight: '500',
    },
    resultContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginTop: 16,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    resultStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    resultStat: {
      alignItems: 'center',
    },
    resultStatNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.success,
    },
    resultStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Sync Progress</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!isSyncing && syncProgress.length === 0 && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={startSync}
                disabled={isSyncing}
              >
                <Text style={styles.startButtonText}>
                  {isSyncing ? 'Syncing...' : 'Start Sync'}
                </Text>
              </TouchableOpacity>
            )}
            
            {syncProgress.map(renderProgressItem)}
            
            {renderSyncResult()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default SyncProgressModal