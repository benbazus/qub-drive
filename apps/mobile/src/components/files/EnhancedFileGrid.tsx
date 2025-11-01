import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FileItem } from '@/types/file';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileContextMenu } from './FileContextMenu';
import { FileActionSheet } from './FileActionSheet';
import { FileSelectionManager, useFileSelection } from './FileSelectionManager';
import { useFileActions } from '@/hooks/useFileActions';

interface EnhancedFileGridProps {
  files: FileItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onFilePress?: (file: FileItem) => void;
  layout?: 'grid' | 'list';
  numColumns?: number;
  showMetadata?: boolean;
  showThumbnails?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const EnhancedFileGrid: React.FC<EnhancedFileGridProps> = ({
  files,
  isLoading = false,
  onRefresh,
  onFilePress,
  layout = 'grid',
  numColumns = 2,
  showMetadata = true,
  showThumbnails = true,
  onSuccess,
  onError,
}) => {
  // Context menu state
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>();

  // File selection
  const {
    selectedFiles,
    selectionMode,
    toggleSelection,
    enterSelectionMode,
    setSelectedFiles,
    setSelectionMode,
  } = useFileSelection();

  // File actions
  const fileActions = useFileActions({
    onSuccess,
    onError,
    onRefresh,
  });

  // Handle file press
  const handleFilePress = useCallback((file: FileItem) => {
    if (selectionMode) {
      toggleSelection(file.id);
    } else {
      onFilePress?.(file);
    }
  }, [selectionMode, toggleSelection, onFilePress]);

  // Handle long press
  const handleFileLongPress = useCallback((file: FileItem, position?: { x: number; y: number }) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (selectionMode) {
      // In selection mode, show action sheet
      setSelectedFile(file);
      setActionSheetVisible(true);
    } else {
      // Show context menu or enter selection mode based on platform
      if (Platform.OS === 'ios') {
        // iOS: Show action sheet
        setSelectedFile(file);
        setActionSheetVisible(true);
      } else {
        // Android: Show context menu
        setSelectedFile(file);
        setMenuPosition(position);
        setContextMenuVisible(true);
      }
    }
  }, [selectionMode]);

  // Handle single file actions
  const handleFileAction = useCallback(async (actionId: string, file: FileItem) => {
    try {
      switch (actionId) {
        case 'share':
          await fileActions.handleShare(file);
          break;
        case 'rename':
          await fileActions.handleRename(file);
          break;
        case 'move':
          await fileActions.handleMove(file);
          break;
        case 'copy':
          await fileActions.handleCopy(file);
          break;
        case 'delete':
          await fileActions.handleDelete(file);
          break;
        case 'star':
          await fileActions.handleStar(file);
          break;
        case 'download':
          await fileActions.handleDownload(file);
          break;
        case 'createLink':
          await fileActions.handleCreateSharingLink(file);
          break;
        case 'moveToTrash':
          await fileActions.handleMoveToTrash(file);
          break;
        case 'restore':
          await fileActions.handleRestoreFromTrash(file);
          break;
        case 'select':
          enterSelectionMode(file.id);
          break;
        default:
          console.warn(`Unknown action: ${actionId}`);
      }
    } catch (error) {
      console.error(`Error performing action ${actionId}:`, error);
    }
  }, [fileActions, enterSelectionMode]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (actionId: string, files: FileItem[]) => {
    try {
      switch (actionId) {
        case 'share':
          await fileActions.handleBulkShare(files);
          break;
        case 'move':
          await fileActions.handleBulkMove(files);
          break;
        case 'copy':
          await fileActions.handleBulkCopy(files);
          break;
        case 'delete':
          await fileActions.handleBulkDelete(files);
          break;
        case 'star':
          await fileActions.handleBulkStar(files);
          break;
        case 'download':
          await fileActions.handleBulkDownload(files);
          break;
        default:
          console.warn(`Unknown bulk action: ${actionId}`);
      }
    } catch (error) {
      console.error(`Error performing bulk action ${actionId}:`, error);
    }
  }, [fileActions]);

  // Get actions for current file
  const currentFileActions = useMemo(() => {
    if (!selectedFile) return [];
    
    const actions = fileActions.getFileActions(selectedFile);
    
    // Add selection action if not in selection mode
    if (!selectionMode) {
      actions.unshift({
        id: 'select',
        label: 'Select',
        icon: 'checkmark-circle-outline',
      });
    }
    
    return actions;
  }, [selectedFile, fileActions, selectionMode]);

  // Get bulk actions
  const bulkActions = useMemo(() => {
    const selectedFileItems = files.filter(file => selectedFiles.has(file.id));
    return fileActions.getBulkActions(selectedFileItems);
  }, [files, selectedFiles, fileActions]);

  // Close menus
  const closeMenus = useCallback(() => {
    setContextMenuVisible(false);
    setActionSheetVisible(false);
    setSelectedFile(null);
    setMenuPosition(undefined);
  }, []);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFiles(newSelection);
  }, [setSelectedFiles]);

  // Handle toggle selection mode
  const handleToggleSelectionMode = useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) {
      setSelectedFiles(new Set());
    }
  }, [setSelectionMode, setSelectedFiles]);

  const commonProps = {
    files,
    isLoading,
    onRefresh,
    onFilePress: handleFilePress,
    onFileLongPress: handleFileLongPress,
    selectedFiles,
    selectionMode,
    showThumbnails,
  };

  return (
    <View style={styles.container}>
      {/* File display */}
      {layout === 'grid' ? (
        <FileGrid
          {...commonProps}
          numColumns={numColumns}
          showMetadata={showMetadata}
        />
      ) : (
        <FileList
          {...commonProps}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedFiles(new Set(files.map(f => f.id)));
            } else {
              setSelectedFiles(new Set());
            }
          }}
        />
      )}

      {/* Context Menu (Android) */}
      <FileContextMenu
        visible={contextMenuVisible}
        file={selectedFile}
        position={menuPosition}
        actions={currentFileActions}
        onAction={handleFileAction}
        onClose={closeMenus}
      />

      {/* Action Sheet (iOS) */}
      <FileActionSheet
        visible={actionSheetVisible}
        file={selectedFile}
        selectedFiles={selectionMode ? files.filter(f => selectedFiles.has(f.id)) : undefined}
        actions={selectionMode ? bulkActions : currentFileActions}
        onAction={(actionId: string, fileOrFiles: FileItem | FileItem[]) => {
          if (selectionMode) {
            handleBulkAction(actionId, Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]);
          } else {
            const singleFile = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
            if (singleFile) {
              handleFileAction(actionId, singleFile);
            }
          }
        }}
        onClose={closeMenus}
      />

      {/* Selection Manager */}
      <FileSelectionManager
        files={files}
        selectedFiles={selectedFiles}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});