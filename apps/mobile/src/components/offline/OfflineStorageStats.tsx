import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStorageStats, useOfflineActions } from '../../stores/offline/offlineStore'

export const OfflineStorageStats: React.FC = () => {
  const storageStats = useStorageStats()
  const { refreshStorageStats, getStorageUsageByType } = useOfflineActions()
  const [showDetails, setShowDetails] = useState(false)
  const [usageByType, setUsageByType] = useState<Record<string, { size: number; count: number }>>({})

  useEffect(() => {
    if (showDetails) {
      loadUsageByType()
    }
  }, [loadUsageByType, showDetails])

  const loadUsageByType = async () => {
    try {
      const usage = await getStorageUsageByType()
      setUsageByType(usage)
    } catch (error) {
      console.error('Failed to load usage by type:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getUsagePercentage = (): number => {
    if (!storageStats || storageStats.totalSize === 0) return 0
    return (storageStats.usedSize / storageStats.totalSize) * 100
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage < 50) return '#34C759'
    if (percentage < 80) return '#FF9500'
    return '#FF3B30'
  }

  const renderUsageBar = () => {
    const percentage = getUsagePercentage()
    const color = getUsageColor(percentage)

    return (
      <View style={styles.usageBarContainer}>
        <View style={styles.usageBarBackground}>
          <View
            style={[
              styles.usageBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.usagePercentage}>
          {percentage.toFixed(1)}%
        </Text>
      </View>
    )
  }

  const renderDetailModal = () => (
    <Modal
      visible={showDetails}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Storage Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetails(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Overall Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overall Usage</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Used Space:</Text>
              <Text style={styles.statValue}>
                {formatFileSize(storageStats?.usedSize || 0)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Available Space:</Text>
              <Text style={styles.statValue}>
                {formatFileSize(storageStats?.availableSize || 0)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Files:</Text>
              <Text style={styles.statValue}>
                {storageStats?.fileCount || 0}
              </Text>
            </View>
            {storageStats?.oldestFile && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Oldest File:</Text>
                <Text style={styles.statValue}>
                  {storageStats.oldestFile.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Usage by Type */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Usage by Type</Text>
            {Object.entries(usageByType).map(([type, usage]) => (
              <View key={type} style={styles.typeRow}>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeName}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  <Text style={styles.typeCount}>
                    {usage.count} file{usage.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.typeSize}>
                  {formatFileSize(usage.size)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )

  if (!storageStats) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={24} color="#ccc" />
          <Text style={styles.loadingText}>Loading storage stats...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statsContainer}
        onPress={() => setShowDetails(true)}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="server-outline" size={20} color="#007AFF" />
            <Text style={styles.title}>Offline Storage</Text>
          </View>
          <TouchableOpacity
            onPress={refreshStorageStats}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatFileSize(storageStats.usedSize)}
            </Text>
            <Text style={styles.statLabel}>Used</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatFileSize(storageStats.availableSize)}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {storageStats.fileCount}
            </Text>
            <Text style={styles.statLabel}>Files</Text>
          </View>
        </View>

        {renderUsageBar()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap for details
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#999" />
        </View>
      </TouchableOpacity>

      {renderDetailModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  usageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginRight: 8,
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usagePercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  typeCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  typeSize: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
})

export default OfflineStorageStats