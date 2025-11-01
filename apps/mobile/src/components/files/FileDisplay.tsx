import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'modified' | 'type';
export type SortDirection = 'asc' | 'desc';

interface FileDisplayProps {
  files: FileItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onFilePress?: (file: FileItem) => void;
  onFileLongPress?: (file: FileItem) => void;
  onSelectAll?: (selected: boolean) => void;
  selectedFiles?: Set<string>;
  selectionMode?: boolean;
  showViewToggle?: boolean;
  showSortOptions?: boolean;
  initialViewMode?: ViewMode;
  initialSortField?: SortField;
  initialSortDirection?: SortDirection;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
}

export const FileDisplay: React.FC<FileDisplayProps> = ({
  files,
  isLoading = false,
  onRefresh,
  onFilePress,
  onFileLongPress,
  onSelectAll,
  selectedFiles = new Set(),
  selectionMode = false,
  showViewToggle = true,
  showSortOptions = true,
  initialViewMode = 'grid',
  initialSortField = 'name',
  initialSortDirection = 'asc',
  emptyStateMessage = 'No files found',
  emptyStateIcon = 'folder-open-outline',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [sortField, setSortField] = useState<SortField>(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const handleSortChange = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  }, [sortField, sortDirection]);

  const sortedFiles = React.useMemo(() => {
    return [...files].sort((a, b) => {
      // Always put folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'type':
          comparison = (a.mimeType || '').localeCompare(b.mimeType || '');
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [files, sortField, sortDirection]);

  const renderHeader = () => {
    if (!showViewToggle && !showSortOptions) return null;

    return (
      <View style={[styles.header, { backgroundColor }]}>
        {/* View Toggle */}
        {showViewToggle && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'grid' && { backgroundColor: `${tintColor}20` }
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={viewMode === 'grid' ? tintColor : iconColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === 'list' && { backgroundColor: `${tintColor}20` }
              ]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={viewMode === 'list' ? tintColor : iconColor}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Sort Options */}
        {showSortOptions && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="funnel-outline" size={20} color={iconColor} />
            <Text style={[styles.sortText, { color: textColor }]}>
              Sort
            </Text>
            <Ionicons
              name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSortMenu = () => {
    if (!showSortMenu) return null;

    const sortOptions: { field: SortField; label: string; icon: string }[] = [
      { field: 'name', label: 'Name', icon: 'text-outline' },
      { field: 'size', label: 'Size', icon: 'resize-outline' },
      { field: 'modified', label: 'Modified', icon: 'time-outline' },
      { field: 'type', label: 'Type', icon: 'document-outline' },
    ];

    return (
      <View style={[styles.sortMenu, { backgroundColor }]}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.field}
            style={[
              styles.sortOption,
              sortField === option.field && { backgroundColor: `${tintColor}10` }
            ]}
            onPress={() => handleSortChange(option.field)}
          >
            <Ionicons
              name={option.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={sortField === option.field ? tintColor : iconColor}
            />
            <Text
              style={[
                styles.sortOptionText,
                { color: sortField === option.field ? tintColor : textColor }
              ]}
            >
              {option.label}
            </Text>
            {sortField === option.field && (
              <Ionicons
                name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                size={16}
                color={tintColor}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name={emptyStateIcon as keyof typeof Ionicons.glyphMap} size={64} color={iconColor} />
      <Text style={[styles.emptyText, { color: iconColor }]}>
        {emptyStateMessage}
      </Text>
    </View>
  );

  if (sortedFiles.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderSortMenu()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSortMenu()}
      
      {viewMode === 'grid' ? (
        <FileGrid
          files={sortedFiles}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onFilePress={onFilePress}
          onFileLongPress={onFileLongPress}
          numColumns={2}
          showMetadata={true}
        />
      ) : (
        <FileList
          files={sortedFiles}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onFilePress={onFilePress}
          onFileLongPress={onFileLongPress}
          onSelectAll={onSelectAll}
          selectedFiles={selectedFiles}
          selectionMode={selectionMode}
          showThumbnails={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${Colors.light.icon}20`,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: `${Colors.light.icon}10`,
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: `${Colors.light.icon}10`,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 150,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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