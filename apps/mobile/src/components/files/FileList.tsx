import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatFileSize, formatDate, getFileIcon } from '@/utils/fileUtils';

interface FileListProps {
  files: FileItem[];
  isLoading?: boolean;
  onRefresh?: (() => void) | undefined;
  onFilePress?: ((file: FileItem) => void) | undefined;
  onFileLongPress?: ((file: FileItem) => void) | undefined;
  onSelectAll?: ((selected: boolean) => void) | undefined;
  selectedFiles?: Set<string>;
  selectionMode?: boolean;
  showThumbnails?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading = false,
  onRefresh,
  onFilePress,
  onFileLongPress,
  onSelectAll,
  selectedFiles = new Set(),
  selectionMode = false,
  showThumbnails = true,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const allSelected = files.length > 0 && files.every(file => selectedFiles.has(file.id));

  const renderFileItem = useCallback(({ item }: { item: FileItem }) => {
    const isFolder = item.type === 'folder';
    const isSelected = selectedFiles.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { 
            backgroundColor: isSelected ? tintColor + '10' : backgroundColor,
            borderBottomColor: Colors.light.icon + '20',
          }
        ]}
        onPress={() => onFilePress?.(item)}
        onLongPress={() => onFileLongPress?.(item)}
        activeOpacity={0.7}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onFilePress?.(item)}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? tintColor : iconColor}
            />
          </TouchableOpacity>
        )}

        {/* File Icon/Thumbnail */}
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '10' }]}>
          {showThumbnails && item.thumbnailUrl && !isFolder ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              placeholder={require('../../../assets/images/icon.png')}
              transition={200}
            />
          ) : (
            getFileIcon(item.mimeType || item.type, 32, iconColor)
          )}
        </View>

        {/* File Info */}
        <View style={styles.fileInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.fileName, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            
            {/* Status Indicators */}
            <View style={styles.statusIndicators}>
              {item.isStarred && (
                <Ionicons name="star" size={16} color="#FFD700" />
              )}
              {item.isShared && (
                <Ionicons name="people" size={16} color={tintColor} />
              )}
              {item.isOfflineAvailable && (
                <Ionicons name="download" size={16} color="#4CAF50" />
              )}
            </View>
          </View>
          
          {/* Metadata */}
          <View style={styles.metadata}>
            {!isFolder && item.size && (
              <Text style={[styles.metadataText, { color: iconColor }]}>
                {formatFileSize(item.size)}
              </Text>
            )}
            <Text style={[styles.metadataText, { color: iconColor }]}>
              • {formatDate(item.updatedAt)}
            </Text>
          </View>
        </View>

        {/* Action Menu */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onFileLongPress?.(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [
    backgroundColor,
    textColor,
    tintColor,
    iconColor,
    selectedFiles,
    selectionMode,
    showThumbnails,
    onFilePress,
    onFileLongPress,
  ]);

  const renderHeader = () => {
    if (!selectionMode) return null;
    
    return (
      <View style={[styles.header, { backgroundColor: backgroundColor }]}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={() => onSelectAll?.(!allSelected)}
        >
          <Ionicons
            name={allSelected ? "checkbox" : "square-outline"}
            size={24}
            color={allSelected ? tintColor : iconColor}
          />
          <Text style={[styles.selectAllText, { color: textColor }]}>
            Select All
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.selectedCount, { color: iconColor }]}>
          {selectedFiles.size} selected
        </Text>
      </View>
    );
  };

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
      contentContainerStyle={styles.container}
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
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={!isLoading ? renderEmptyState : null}
      removeClippedSubviews={Platform.OS === 'android'}
      maxToRenderPerBatch={15}
      windowSize={10}
      initialNumToRender={12}
      getItemLayout={(_data, index) => ({
        length: 72,
        offset: 72 * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon + '20',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  checkbox: {
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
  },
  actionButton: {
    padding: 8,
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