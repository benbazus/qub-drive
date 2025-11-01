import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useOfflineStore, useOfflineActions, useOfflineFiles, useOfflineLoading } from '../../stores/offline/offlineStore'
import { OfflineFileWithMetadata } from '../../services/storage/offlineStorage'
import { OfflineFileItem } from './OfflineFileItem'
import { OfflineStorageStats } from './OfflineStorageStats'
import { OfflineFileActions } from './OfflineFileActions'

interface OfflineFilesScreenProps {
  onFilePress?: (file: OfflineFileWithMetadata) => void
  onFileSelect?: (file: OfflineFileWithMetadata) => void
}

export const OfflineFilesScreen: React.FC<OfflineFilesScreenProps> = ({
  onFilePress,
  onFileSelect,
}) => {
  const offlineFiles = useOfflineFiles()
  const isLoading = useOfflineLoading()
  const {
    initialize,
    refreshOfflineFiles,
    removeFileFromOffline,
    clearAllOfflineFiles,
    cleanupStorage,
    markFileAsAccessed,
  } = useOfflineActions()

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'downloadedAt' | 'accessedAt'>('downloadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'modified' | 'synced'>('all')

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleRefresh = async () => {
    try {
      await refreshOfflineFiles()
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh offline files')
    }
  }

  const handleFilePress = async (file: OfflineFileWithMetadata) => {
    if (isSelectionMode) {
      handleFileSelect(file)
    } else {
      // Mark as accessed
      await markFileAsAccessed(file.fileId)
      onFilePress?.(file)
    }
  }

  const handleFileLongPress = (file: OfflineFileWithMetadata) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true)
      setSelectedFiles(new Set([file.fileId]))
    } else {
      handleFileSelect(file)
    }
  }

  const handleFileSelect = (file: OfflineFileWithMetadata) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(file.fileId)) {
      newSelection.delete(file.fileId)
    } else {
      newSelection.add(file.fileId)
    }
    setSelectedFiles(newSelection)
    
    if (newSelection.size === 0) {
      setIsSelectionMode(false)
    }
    
    onFileSelect?.(file)
  }

  const handleRemoveSelected = () => {
    if (selectedFiles.size === 0) return

    Alert.alert(
      'Remove Files',
      `Are you sure you want to remove ${selectedFiles.size} file(s) from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const promises = Array.from(selectedFiles).map(fileId =>
                removeFileFromOffline(fileId)
              )
              await Promise.all(promises)
              setSelectedFiles(new Set())
              setIsSelectionMode(false)
            } catch (error) {
              Alert.alert('Error', 'Failed to remove some files')
            }
          },
        },
      ]
    )
  }

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Offline Files',
      'Are you sure you want to remove all offline files? This will free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllOfflineFiles()
              setSelectedFiles(new Set())
              setIsSelectionMode(false)
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline files')
            }
          },
        },
      ]
    )
  }

  const handleCleanupStorage = () => {
    Alert.alert(
      'Cleanup Storage',
      'Remove old and rarely accessed files to free up space?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          onPress: async () => {
            try {
              await cleanupStorage()
            } catch (error) {
              Alert.alert('Error', 'Failed to cleanup storage')
            }
          },
        },
      ]
    )
  }

  const getSortedAndFilteredFiles = () => {
    let filteredFiles = offlineFiles

    // Apply filter
    if (filterBy === 'modified') {
      filteredFiles = offlineFiles.filter(file => file.syncStatus === 'modified')
    } else if (filterBy === 'synced') {
      filteredFiles = offlineFiles.filter(file => file.syncStatus === 'synced')
    }

    // Apply sort
    return filteredFiles.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'downloadedAt':
          comparison = a.downloadedAt.getTime() - b.downloadedAt.getTime()
          break
        case 'accessedAt':
          comparison = a.accessedAt.getTime() - b.accessedAt.getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const renderFileItem = ({ item }: { item: OfflineFileWithMetadata }) => (
    <OfflineFileItem
      file={item}
      isSelected={selectedFiles.has(item.fileId)}
      isSelectionMode={isSelectionMode}
      onPress={() => handleFilePress(item)}
      onLongPress={() => handleFileLongPress(item)}
    />
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <OfflineStorageStats />
      
      {/* Filter and Sort Controls */}
      <View style={styles.controls}>
        <View style={styles.filterContainer}>
          <Text style={styles.controlLabel}>Filter:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filterBy === 'all' && styles.activeFilter]}
            onPress={() => setFilterBy('all')}
          >
            <Text style={[styles.filterText, filterBy === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterBy === 'modified' && styles.activeFilter]}
            onPress={() => setFilterBy('modified')}
          >
            <Text style={[styles.filterText, filterBy === 'modified' && styles.activeFilterText]}>
              Modified
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterBy === 'synced' && styles.activeFilter]}
            onPress={() => setFilterBy('synced')}
          >
            <Text style={[styles.filterText, filterBy === 'synced' && styles.activeFilterText]}>
              Synced
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            // Cycle through sort options
            const sortOptions: typeof sortBy[] = ['downloadedAt', 'name', 'size', 'accessedAt']
            const currentIndex = sortOptions.indexOf(sortBy)
            const nextIndex = (currentIndex + 1) % sortOptions.length
            setSortBy(sortOptions[nextIndex])
          }}
        >
          <Ionicons name="swap-vertical" size={16} color="#666" />
          <Text style={styles.sortText}>
            {sortBy === 'downloadedAt' ? 'Downloaded' : 
             sortBy === 'accessedAt' ? 'Accessed' :
             sortBy === 'name' ? 'Name' : 'Size'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <OfflineFileActions
        selectedCount={selectedFiles.size}
        isSelectionMode={isSelectionMode}
        onRemoveSelected={handleRemoveSelected}
        onClearAll={handleClearAll}
        onCleanupStorage={handleCleanupStorage}
        onCancelSelection={() => {
          setIsSelectionMode(false)
          setSelectedFiles(new Set())
        }}
      />
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Offline Files</Text>
      <Text style={styles.emptyMessage}>
        Files you download for offline access will appear here
      </Text>
    </View>
  )

  if (isLoading && offlineFiles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading offline files...</Text>
      </View>
    )
  }

  const sortedFiles = getSortedAndFilteredFiles()

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.fileId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={sortedFiles.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    marginBottom: 8,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default OfflineFilesScreen