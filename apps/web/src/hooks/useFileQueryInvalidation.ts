import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for comprehensive file-related query invalidation and refetching
 * Ensures UI updates immediately after file operations like uploads, deletions, etc.
 */
export const useFileQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateFileQueries = useCallback((currentFolder?: any) => {
    // Core file listing queries
    queryClient.invalidateQueries({ queryKey: ['all-files'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['file-list'] });
    queryClient.invalidateQueries({ queryKey: ['folder-list'] });
    
    // Statistics and dashboard queries
    queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['detailed-storage-stats'] });
    
    // Search and filter queries
    queryClient.invalidateQueries({ queryKey: ['file-search'] });
    queryClient.invalidateQueries({ queryKey: ['recent-files'] });
    queryClient.invalidateQueries({ queryKey: ['starred-files'] });
    queryClient.invalidateQueries({ queryKey: ['shared-files'] });
    
    // Force immediate refetch of critical queries for instant UI updates
    queryClient.refetchQueries({ queryKey: ['all-files'] });
    queryClient.refetchQueries({ queryKey: ['files'] });
    
    // Invalidate current folder specific queries
    if (currentFolder?.id) {
      const folderId = currentFolder.id === 'ROOT' ? null : currentFolder.id;
      queryClient.invalidateQueries({ 
        queryKey: ['files', { parentId: folderId }] 
      });
      queryClient.refetchQueries({ 
        queryKey: ['files', { parentId: folderId }] 
      });
    }
    
    // Always invalidate root folder queries
    queryClient.invalidateQueries({ 
      queryKey: ['files', { parentId: 'ROOT' }] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['files', { parentId: null }] 
    });
    
    // Invalidate any file-related cache patterns
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && (
          queryKey.includes('files') || 
          queryKey.includes('folders') ||
          queryKey.includes('storage') ||
          queryKey.includes('dashboard')
        );
      }
    });
    
    console.log('File queries invalidated and refetched for immediate UI update');
  }, [queryClient]);

  const invalidateSpecificFile = useCallback((fileId: string) => {
    // Invalidate specific file queries
    queryClient.invalidateQueries({ queryKey: ['file', fileId] });
    queryClient.invalidateQueries({ queryKey: ['file-details', fileId] });
    queryClient.invalidateQueries({ queryKey: ['file-preview', fileId] });
    
    // Also invalidate general file lists since file might appear in them
    invalidateFileQueries();
  }, [queryClient, invalidateFileQueries]);

  const invalidateFolder = useCallback((folderId: string) => {
    // Invalidate folder-specific queries
    queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
    queryClient.invalidateQueries({ queryKey: ['files', { parentId: folderId }] });
    
    // Also invalidate general queries
    invalidateFileQueries();
  }, [queryClient, invalidateFileQueries]);

  return {
    invalidateFileQueries,
    invalidateSpecificFile,
    invalidateFolder
  };
};