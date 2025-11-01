import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationItem } from '@/stores/notification';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationHistoryProps {
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  onNotificationPress?: (notification: NotificationItem) => void;
}

type FilterType = 'all' | 'unread' | 'file_shared' | 'document_updated' | 'collaboration_invite' | 'upload_complete' | 'system_alert';
type SortType = 'newest' | 'oldest' | 'type';

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  maxItems,
  showSearch = true,
  showFilters = true,
  onNotificationPress,
}) => {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    syncNotificationHistory,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.body.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'unread') {
        filtered = filtered.filter((notification) => !notification.isRead);
      } else {
        filtered = filtered.filter((notification) => notification.type === selectedFilter);
      }
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    // Apply max items limit
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [notifications, searchQuery, selectedFilter, sortBy, maxItems]);

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (onNotificationPress) {
      onNotificationPress(notification);
      return;
    }

    // Default navigation behavior
    switch (notification.type) {
      case 'file_shared':
        if (notification.data?.fileId) {
          router.push(`/file/${notification.data.fileId}` as '/file/[id]');
        }
        break;
      case 'document_updated':
        if (notification.data?.documentId) {
          router.push(`/document/${notification.data.documentId}` as '/document/[id]');
        }
        break;
      case 'collaboration_invite':
        if (notification.data?.inviteId) {
          router.push('/collaboration' as '/collaboration');
        }
        break;
      case 'upload_complete':
        router.push('/(tabs)/files');
        break;
      default:
        router.push('/(tabs)');
        break;
    }
  }, [markAsRead, onNotificationPress, router]);

  const handleLongPress = useCallback((notification: NotificationItem) => {
    Alert.alert(
      'Notification Options',
      notification.title,
      [
        {
          text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
          onPress: () => {
            // TODO: Implement mark as unread functionality
            if (!notification.isRead) {
              markAsRead(notification.id);
            }
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeNotification(notification.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [markAsRead, removeNotification]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  }, [clearAllNotifications]);

  const getNotificationIcon = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'file_shared':
        return 'share-outline';
      case 'document_updated':
        return 'document-text-outline';
      case 'collaboration_invite':
        return 'people-outline';
      case 'upload_complete':
        return 'cloud-upload-outline';
      case 'system_alert':
        return 'alert-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'file_shared':
        return '#4A90E2';
      case 'document_updated':
        return '#7ED321';
      case 'collaboration_invite':
        return '#9013FE';
      case 'upload_complete':
        return '#F5A623';
      case 'system_alert':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const getFilterLabel = (filter: FilterType): string => {
    switch (filter) {
      case 'all':
        return 'All';
      case 'unread':
        return 'Unread';
      case 'file_shared':
        return 'File Sharing';
      case 'document_updated':
        return 'Documents';
      case 'collaboration_invite':
        return 'Collaboration';
      case 'upload_complete':
        return 'Uploads';
      case 'system_alert':
        return 'System';
      default:
        return 'All';
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type) as unknown}
            size={24}
            color={getNotificationColor(item.type)}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {item.body}
          </Text>
          <View style={styles.metaContainer}>
            <Text style={styles.time}>
              {formatTime(item.createdAt)}
            </Text>
            <Text style={styles.type}>
              {getFilterLabel(item.type as FilterType)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedFilter !== 'all' ? 'No matching notifications' : 'No notifications'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedFilter !== 'all'
          ? 'Try adjusting your search or filter criteria.'
          : "You'll see notifications about file sharing, collaboration, and system updates here."}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filters and Actions */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFiltersPanel(!showFiltersPanel)}
          >
            <Ionicons name="filter-outline" size={16} color="#4A90E2" />
            <Text style={styles.filterButtonText}>
              {getFilterLabel(selectedFilter)}
            </Text>
            <Ionicons 
              name={showFiltersPanel ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#4A90E2" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const nextSort: SortType = sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'type' : 'newest';
              setSortBy(nextSort);
            }}
          >
            <Ionicons name="swap-vertical-outline" size={16} color="#4A90E2" />
            <Text style={styles.sortButtonText}>
              {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Type'}
            </Text>
          </TouchableOpacity>

          {filteredAndSortedNotifications.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Panel */}
      {showFiltersPanel && (
        <View style={styles.filterPanel}>
          {(['all', 'unread', 'file_shared', 'document_updated', 'collaboration_invite', 'upload_complete', 'system_alert'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterOption,
                selectedFilter === filter && styles.selectedFilterOption,
              ]}
              onPress={() => {
                setSelectedFilter(filter);
                setShowFiltersPanel(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.selectedFilterOptionText,
                ]}
              >
                {getFilterLabel(filter)}
              </Text>
              {selectedFilter === filter && (
                <Ionicons name="checkmark" size={16} color="#4A90E2" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results Count */}
      {filteredAndSortedNotifications.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredAndSortedNotifications.length} notification{filteredAndSortedNotifications.length !== 1 ? 's' : ''}
            {maxItems && notifications.length > maxItems && ` (showing first ${maxItems})`}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={syncNotificationHistory}
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredAndSortedNotifications.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
    paddingVertical: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
    marginHorizontal: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 4,
  },
  clearButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  filterPanel: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  selectedFilterOption: {
    backgroundColor: '#e3f2fd',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedFilterOptionText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  type: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationHistory;