import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileShare } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sharingService } from '@/services/sharingService';

interface SharedFilesListProps {
  type: 'shared-with-me' | 'shared-by-me';
  onFilePress?: (share: FileShare) => void;
  onError?: (error: string) => void;
}

interface SharedFileItemProps {
  share: FileShare;
  onPress?: (share: FileShare) => void;
}

const SharedFileItem: React.FC<SharedFileItemProps> = ({ share, onPress }) => {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = () => {
    return share.fileType === 'folder' ? 'folder' : 'document';
  };

  const getShareStatus = () => {
    if (!share.isActive) return 'Inactive';
    if (share.shareLink?.isActive) return 'Link shared';
    if (share.permissions.length > 1) return `${share.permissions.length} people`;
    return 'Private';
  };

  const getStatusColor = () => {
    if (!share.isActive) return '#F44336';
    if (share.shareLink?.isActive) return '#FF9500';
    return '#4CAF50';
  };

  return (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => onPress?.(share)}
      activeOpacity={0.7}
    >
      <View style={styles.fileIcon}>
        <Ionicons
          name={getFileIcon()}
          size={24}
          color={tintColor}
        />
      </View>
      
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
          {share.fileName}
        </Text>
        
        <View style={styles.fileDetails}>
          <Text style={[styles.ownerInfo, { color: iconColor }]}>
            {share.ownerName || share.ownerEmail}
          </Text>
          <Text style={[styles.shareDate, { color: iconColor }]}>
            • {formatDate(share.createdAt)}
          </Text>
        </View>
        
        <View style={styles.shareStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: iconColor }]}>
            {getShareStatus()}
          </Text>
        </View>
      </View>
      
      <View style={styles.fileActions}>
        <Ionicons name="chevron-forward" size={16} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
};

export const SharedFilesList: React.FC<SharedFilesListProps> = ({
  type,
  onFilePress,
  onError,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [shares, setShares] = useState<FileShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadShares = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setOffset(0);
    } else {
      setIsLoading(true);
    }

    try {
      const currentOffset = refresh ? 0 : offset;
      const limit = 20;
      
      let newShares: FileShare[];
      if (type === 'shared-with-me') {
        newShares = await sharingService.getSharedWithMe(limit, currentOffset);
      } else {
        newShares = await sharingService.getSharedByMe(limit, currentOffset);
      }

      if (refresh) {
        setShares(newShares);
      } else {
        setShares(prev => [...prev, ...newShares]);
      }

      setHasMore(newShares.length === limit);
      setOffset(currentOffset + newShares.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load shared files';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [type, offset, onError]);

  useEffect(() => {
    loadShares();
  }, [type]);

  const handleRefresh = () => {
    loadShares(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadShares();
    }
  };

  const renderItem = ({ item }: { item: FileShare }) => (
    <SharedFileItem share={item} onPress={onFilePress} />
  );

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={tintColor} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    const emptyMessage = type === 'shared-with-me' 
      ? 'No files shared with you yet'
      : 'You haven\'t shared any files yet';
    
    const emptySubtext = type === 'shared-with-me'
      ? 'Files shared by others will appear here'
      : 'Share files with others to see them here';

    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={type === 'shared-with-me' ? 'people-outline' : 'share-outline'} 
          size={48} 
          color={`${iconColor}66`} 
        />
        <Text style={[styles.emptyText, { color: textColor }]}>
          {emptyMessage}
        </Text>
        <Text style={[styles.emptySubtext, { color: iconColor }]}>
          {emptySubtext}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={shares}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={shares.length === 0 ? styles.emptyContentContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000033',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#007AFF26',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerInfo: {
    fontSize: 14,
  },
  shareDate: {
    fontSize: 14,
    marginLeft: 4,
  },
  shareStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  fileActions: {
    padding: 8,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContentContainer: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});