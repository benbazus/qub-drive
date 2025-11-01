import { useState, useCallback } from 'react';
import { Alert, Share, Platform } from 'react-native';
import { FileItem } from '@/types/file';
import { useFileOperations } from './useFileOperations';
import { useSharing } from './useSharing';
import { FileAction } from '@/components/files/FileContextMenu';

export interface FileActionOptions {
  onSuccess?: ((message: string) => void) | undefined;
  onError?: ((error: string) => void) | undefined;
  onRefresh?: (() => void) | undefined;
}

export interface UseFileActionsReturn {
  // Action handlers
  handleShare: (file: FileItem) => Promise<void>;
  handleRename: (file: FileItem) => Promise<void>;
  handleMove: (file: FileItem) => Promise<void>;
  handleCopy: (file: FileItem) => Promise<void>;
  handleDelete: (file: FileItem) => Promise<void>;
  handleStar: (file: FileItem) => Promise<void>;
  handleDownload: (file: FileItem) => Promise<void>;
  handleCreateSharingLink: (file: FileItem) => Promise<void>;
  handleManageSharing: (file: FileItem) => Promise<void>;
  handleMoveToTrash: (file: FileItem) => Promise<void>;
  handleRestoreFromTrash: (file: FileItem) => Promise<void>;
  
  // Bulk operations
  handleBulkShare: (files: FileItem[]) => Promise<void>;
  handleBulkMove: (files: FileItem[]) => Promise<void>;
  handleBulkCopy: (files: FileItem[]) => Promise<void>;
  handleBulkDelete: (files: FileItem[]) => Promise<void>;
  handleBulkStar: (files: FileItem[]) => Promise<void>;
  handleBulkDownload: (files: FileItem[]) => Promise<void>;
  
  // Action configurations
  getFileActions: (file: FileItem) => FileAction[];
  getBulkActions: (files: FileItem[]) => FileAction[];
  
  // State
  isProcessing: boolean;
  processingAction: string | null;
}

export const useFileActions = (options: FileActionOptions = {}): UseFileActionsReturn => {
  const { onSuccess, onError, onRefresh } = options;
  const fileOperations = useFileOperations({
    onSuccess: () => onRefresh?.(),
    onError: (error) => onError?.(error.message),
  });

  const sharing = useSharing({
    onSuccess: (message) => onSuccess?.(message),
    onError: (error) => onError?.(error),
    onUpdate: () => onRefresh?.(),
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Helper to wrap actions with loading state
  const withProcessing = useCallback(async <T>(
    actionName: string,
    action: () => Promise<T>
  ): Promise<T> => {
    setIsProcessing(true);
    setProcessingAction(actionName);
    try {
      const result = await action();
      return result;
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, []);

  // Share file
  const handleShare = useCallback(async (file: FileItem) => {
    await withProcessing('share', async () => {
      try {
        await sharing.shareViaLink(file);
      } catch (error) {
        throw new Error('Failed to share file');
      }
    });
  }, [sharing, withProcessing]);

  // Rename file
  const handleRename = useCallback(async (file: FileItem) => {
    await withProcessing('rename', async () => {
      return new Promise<void>((resolve, reject) => {
        Alert.prompt(
          'Rename',
          `Enter new name for "${file.name}":`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => reject(new Error('User cancelled')),
            },
            {
              text: 'Rename',
              onPress: async (newName?: string) => {
                if (!newName || newName.trim() === '') {
                  reject(new Error('Name cannot be empty'));
                  return;
                }
                
                try {
                  // Note: This would need to be implemented in the API
                  // For now, we'll simulate the operation
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  onSuccess?.(`Renamed to "${newName}"`);
                  resolve();
                } catch (_error) {
                  reject(new Error('Failed to rename file'));
                }
              },
            },
          ],
          'plain-text',
          file.name
        );
      });
    });
  }, [onSuccess, withProcessing]);

  // Move file
  const handleMove = useCallback(async (_file: FileItem) => {
    await withProcessing('move', async () => {
      // This would typically open a folder picker
      // For now, we'll show an alert
      Alert.alert(
        'Move File',
        'Move functionality would open a folder picker here.',
        [{ text: 'OK' }]
      );
    });
  }, [withProcessing]);

  // Copy file
  const handleCopy = useCallback(async (file: FileItem) => {
    await withProcessing('copy', async () => {
      try {
        const copiedFile = await fileOperations.copyItem(file.id);
        onSuccess?.(`Copied "${file.name}" as "${copiedFile.name}"`);
      } catch (_error) {
        throw new Error('Failed to copy file');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Delete file
  const handleDelete = useCallback(async (file: FileItem) => {
    await withProcessing('delete', async () => {
      try {
        await fileOperations.deleteFile(file.id, file.name);
        onSuccess?.(`Deleted "${file.name}"`);
      } catch (error) {
        if (error instanceof Error && error.message !== 'User cancelled deletion') {
          throw error;
        }
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Star/unstar file
  const handleStar = useCallback(async (file: FileItem) => {
    await withProcessing('star', async () => {
      try {
        await fileOperations.toggleStar(file.id, file.isStarred || false);
        const action = file.isStarred ? 'Unstarred' : 'Starred';
        onSuccess?.(`${action} "${file.name}"`);
      } catch (_error) {
        throw new Error('Failed to update star status');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Download file
  const handleDownload = useCallback(async (file: FileItem) => {
    await withProcessing('download', async () => {
      try {
        const localUri = await fileOperations.downloadFile(file.id, file.name);
        onSuccess?.(`Downloaded "${file.name}" to device`);
        return localUri;
      } catch (_error) {
        throw new Error('Failed to download file');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Create sharing link
  const handleCreateSharingLink = useCallback(async (file: FileItem) => {
    await withProcessing('createLink', async () => {
      try {
        const link = await sharing.createSharingLink(file);
        
        // Copy to clipboard and share
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Share.share({
            message: `Sharing link for "${file.name}": ${link}`,
            url: link,
            title: `Share ${file.name}`,
          });
        }
        
        onSuccess?.('Sharing link created and copied');
      } catch (error) {
        throw new Error('Failed to create sharing link');
      }
    });
  }, [sharing, onSuccess, withProcessing]);

  // Manage sharing
  const handleManageSharing = useCallback(async (file: FileItem) => {
    await withProcessing('manageSharing', async () => {
      // This would typically open the ShareManagement modal
      // For now, we'll show an alert with sharing info
      try {
        const shareInfo = await sharing.getFileSharing(file.id);
        if (shareInfo) {
          const userCount = shareInfo.permissions.length;
          const hasLink = shareInfo.shareLink?.isActive;
          let message = `Shared with ${userCount} user(s)`;
          if (hasLink) {
            message += '\nPublic link is active';
          }
          Alert.alert('Sharing Info', message, [{ text: 'OK' }]);
        } else {
          Alert.alert('Not Shared', 'This file is not currently shared.', [{ text: 'OK' }]);
        }
      } catch (error) {
        throw new Error('Failed to load sharing information');
      }
    });
  }, [sharing, withProcessing]);

  // Move to trash
  const handleMoveToTrash = useCallback(async (file: FileItem) => {
    await withProcessing('moveToTrash', async () => {
      try {
        await fileOperations.moveToTrash(file.id);
        onSuccess?.(`Moved "${file.name}" to trash`);
      } catch (_error) {
        throw new Error('Failed to move to trash');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Restore from trash
  const handleRestoreFromTrash = useCallback(async (file: FileItem) => {
    await withProcessing('restore', async () => {
      try {
        await fileOperations.restoreFromTrash(file.id);
        onSuccess?.(`Restored "${file.name}" from trash`);
      } catch (_error) {
        throw new Error('Failed to restore from trash');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Bulk operations
  const handleBulkShare = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkShare', async () => {
      const fileNames = files.map(f => f.name).join(', ');
      Alert.alert(
        'Share Files',
        `Share ${files.length} files: ${fileNames}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              try {
                // Create sharing links for all files
                const links = await Promise.all(
                  files.map(file => sharing.createSharingLink(file))
                );
                
                const shareText = `Sharing ${files.length} files:\n${links.join('\n')}`;
                await Share.share({ message: shareText });
                onSuccess?.(`Shared ${files.length} files`);
              } catch (error) {
                throw new Error('Failed to share files');
              }
            },
          },
        ]
      );
    });
  }, [sharing, onSuccess, withProcessing]);

  const handleBulkMove = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkMove', async () => {
      Alert.alert(
        'Move Files',
        `Move functionality for ${files.length} files would open a folder picker here.`,
        [{ text: 'OK' }]
      );
    });
  }, [withProcessing]);

  const handleBulkCopy = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkCopy', async () => {
      try {
        await Promise.all(files.map(file => fileOperations.copyItem(file.id)));
        onSuccess?.(`Copied ${files.length} files`);
      } catch (_error) {
        throw new Error('Failed to copy files');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  const handleBulkDelete = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkDelete', async () => {
      const fileNames = files.map(f => f.name).join(', ');
      Alert.alert(
        'Delete Files',
        `Are you sure you want to delete ${files.length} files?\n\n${fileNames}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await Promise.all(
                  files.map(file => fileOperations.deleteFile(file.id, file.name, true))
                );
                onSuccess?.(`Deleted ${files.length} files`);
              } catch (_error) {
                throw new Error('Failed to delete files');
              }
            },
          },
        ]
      );
    });
  }, [fileOperations, onSuccess, withProcessing]);

  const handleBulkStar = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkStar', async () => {
      try {
        const hasUnstarred = files.some(f => !f.isStarred);
        await Promise.all(
          files.map(file => fileOperations.toggleStar(file.id, file.isStarred || false))
        );
        const action = hasUnstarred ? 'Starred' : 'Unstarred';
        onSuccess?.(`${action} ${files.length} files`);
      } catch (_error) {
        throw new Error('Failed to update star status');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  const handleBulkDownload = useCallback(async (files: FileItem[]) => {
    await withProcessing('bulkDownload', async () => {
      try {
        await Promise.all(
          files.map(file => fileOperations.downloadFile(file.id, file.name))
        );
        onSuccess?.(`Downloaded ${files.length} files to device`);
      } catch (_error) {
        throw new Error('Failed to download files');
      }
    });
  }, [fileOperations, onSuccess, withProcessing]);

  // Get available actions for a single file
  const getFileActions = useCallback((file: FileItem): FileAction[] => {
    const actions: FileAction[] = [
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
      },
      {
        id: 'createLink',
        label: 'Get link',
        icon: 'link',
      },
      {
        id: 'rename',
        label: 'Rename',
        icon: 'pencil',
      },
      {
        id: 'move',
        label: 'Move',
        icon: 'folder-open',
      },
      {
        id: 'copy',
        label: 'Make a copy',
        icon: 'copy',
      },
      {
        id: 'star',
        label: file.isStarred ? 'Remove star' : 'Add star',
        icon: file.isStarred ? 'star' : 'star-outline',
        color: '#FFD700',
      },
    ];

    // Add download for files (not folders)
    if (file.type === 'file') {
      actions.push({
        id: 'download',
        label: 'Download',
        icon: 'download',
      });
    }

    // Add sharing management if file is shared
    if (file.isShared) {
      actions.push({
        id: 'manageSharing',
        label: 'Manage sharing',
        icon: 'people',
      });
    }

    actions.push({
      id: 'moveToTrash',
      label: 'Move to trash',
      icon: 'trash',
      destructive: true,
    });

    return actions;
  }, []);

  // Get available bulk actions
  const getBulkActions = useCallback((files: FileItem[]): FileAction[] => {
    if (files.length === 0) return [];

    const hasUnstarred = files.some(f => !f.isStarred);
    const hasFiles = files.some(f => f.type === 'file');

    const actions: FileAction[] = [
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
      },
      {
        id: 'move',
        label: 'Move',
        icon: 'folder-open',
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: 'copy',
      },
      {
        id: 'star',
        label: hasUnstarred ? 'Star' : 'Unstar',
        icon: hasUnstarred ? 'star-outline' : 'star',
        color: '#FFD700',
      },
    ];

    // Add download if there are files
    if (hasFiles) {
      actions.push({
        id: 'download',
        label: 'Download',
        icon: 'download',
      });
    }

    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      destructive: true,
    });

    return actions;
  }, []);

  return {
    // Single file actions
    handleShare,
    handleRename,
    handleMove,
    handleCopy,
    handleDelete,
    handleStar,
    handleDownload,
    handleCreateSharingLink,
    handleManageSharing,
    handleMoveToTrash,
    handleRestoreFromTrash,
    
    // Bulk actions
    handleBulkShare,
    handleBulkMove,
    handleBulkCopy,
    handleBulkDelete,
    handleBulkStar,
    handleBulkDownload,
    
    // Action configurations
    getFileActions,
    getBulkActions,
    
    // State
    isProcessing,
    processingAction,
  };
};