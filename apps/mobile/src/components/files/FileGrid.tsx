import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatFileSize, formatDate, getFileIcon } from '@/utils/fileUtils';

interface FileGridProps {
  files: FileItem[];
  isLoading?: boolean;
  onRefresh?: (() => void) | undefined;
  onFilePress?: ((file: FileItem) => void) | undefined;
  onFileLongPress?: ((file: FileItem) => void) | undefined;
  numColumns?: number;
  showMetadata?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  isLoading = false,
  onRefresh,
  onFilePress,
  onFileLongPress,
  numColumns = 2,
  showMetadata = true,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const itemWidth = (screenWidth - 32 - (numColumns - 1) * 12) / numColumns;

  const renderFileItem = useCallback(({ item }: { item: FileItem }) => {
    const isFolder = item.type === 'folder';
    
    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { 
            width: itemWidth,
            backgroundColor: backgroundColor,
            borderColor: Colors.light.icon + '20',
          }
        ]}
        onPress={() => onFilePress?.(item)}
        onLongPress={() => onFileLongPress?.(item)}
        activeOpacity={0.7}
      >
        {/* Thumbnail/Icon Container */}
        <View style={[styles.thumbnailContainer, { backgroundColor: tintColor + '10' }]}>
          {item.thumbnailUrl && !isFolder ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              placeholder={require('../../../assets/images/icon.png')}
              transition={200}
            />
          ) : (
            <View style={styles.iconContainer}>
              {getFileIcon(item.mimeType || item.type, 48, iconColor)}
            </View>
          )}
          
          {/* Status Indicators */}
          <View style={styles.statusIndicators}>
            {item.isStarred && (
              <View style={[styles.statusBadge, { backgroundColor: '#FFD700' }]}>
                <Ionicons name="star" size={12} color="#FFF" />
              </View>
            )}
            {item.isShared && (
              <View style={[styles.statusBadge, { backgroundColor: tintColor }]}>
                <Ionicons name="people" size={12} color="#FFF" />
              </View>
            )}
            {item.isOfflineAvailable && (
              <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="download" size={12} color="#FFF" />
              </View>
            )}
          </View>
        </View>

        {/* File Info */}
        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, { color: textColor }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          
          {showMetadata && (
            <View style={styles.metadata}>
              {!isFolder && item.size && (
                <Text style={[styles.metadataText, { color: iconColor }]}>
                  {formatFileSize(item.size)}
                </Text>
              )}
              <Text style={[styles.metadataText, { color: iconColor }]}>
                {formatDate(item.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [itemWidth, backgroundColor, textColor, tintColor, iconColor, onFilePress, onFileLongPress, showMetadata]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color={iconColor} />
      <Text style={[styles.emptyText, { color: iconColor }]}>
        No files found
      </Text>
    </View>
  );

  return (
    <FlatList
      data={files}
      renderItem={renderFileItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
          />
        ) : undefined
      }
      ListEmptyComponent={!isLoading ? renderEmptyState : null}
      removeClippedSubviews={Platform.OS === 'android'}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={8}
      getItemLayout={(_data, index) => ({
        length: itemWidth + 16,
        offset: (itemWidth + 16) * Math.floor(index / numColumns),
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fileItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    aspectRatio: 1,
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicators: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    padding: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  metadata: {
    gap: 2,
  },
  metadataText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});