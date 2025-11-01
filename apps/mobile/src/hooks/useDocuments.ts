import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '../services/documentService';
import { 
  Document, 
  DocumentCreateRequest, 
  DocumentUpdateRequest
} from '../types/document';

export const useDocuments = (folderId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', folderId],
    queryFn: () => DocumentService.getDocuments(folderId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data: DocumentCreateRequest) => DocumentService.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateRequest }) =>
      DocumentService.updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => DocumentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
    },
  });

  const createDocument = useCallback(
    async (data: DocumentCreateRequest): Promise<Document> => {
      return createDocumentMutation.mutateAsync(data);
    },
    [createDocumentMutation]
  );

  const updateDocument = useCallback(
    async (id: string, data: DocumentUpdateRequest): Promise<Document> => {
      return updateDocumentMutation.mutateAsync({ id, data });
    },
    [updateDocumentMutation]
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      return deleteDocumentMutation.mutateAsync(id);
    },
    [deleteDocumentMutation]
  );

  return {
    documents,
    isLoading,
    error,
    refetch,
    createDocument,
    updateDocument,
    deleteDocument,
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
};

export const useDocument = (id: string) => {
  const queryClient = useQueryClient();

  const {
    data: document,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document', id],
    queryFn: () => DocumentService.getDocument(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const saveContentMutation = useMutation({
    mutationFn: (content: string) => DocumentService.saveDocumentContent(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
    },
  });

  const saveContent = useCallback(
    async (content: string): Promise<void> => {
      return saveContentMutation.mutateAsync(content);
    },
    [saveContentMutation]
  );

  return {
    document,
    isLoading,
    error,
    refetch,
    saveContent,
    isSaving: saveContentMutation.isPending,
  };
};

export const useDocumentTemplates = () => {
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => DocumentService.getTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, title, folderId }: { 
      templateId: string; 
      title: string; 
      folderId?: string; 
    }) => DocumentService.createFromTemplate(templateId, title, folderId),
  });

  const createFromTemplate = useCallback(
    async (templateId: string, title: string, folderId?: string): Promise<Document> => {
      return createFromTemplateMutation.mutateAsync({ templateId, title, folderId: folderId || undefined });
    },
    [createFromTemplateMutation]
  );

  return {
    templates,
    isLoading,
    error,
    refetch,
    createFromTemplate,
    isCreatingFromTemplate: createFromTemplateMutation.isPending,
  };
};

export const useRecentDocuments = (limit: number = 10) => {
  const {
    data: recentDocuments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recent-documents', limit],
    queryFn: () => DocumentService.getRecentDocuments(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recentDocuments,
    isLoading,
    error,
    refetch,
  };
};

export const useDocumentSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchDocuments = useCallback(
    async (query: string, folderId?: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await DocumentService.searchDocuments(query, folderId);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchDocuments,
    clearSearch,
  };
};

export const useDocumentAutoSave = (documentId: string) => {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    return () => {
      // Cleanup auto-save when component unmounts
      DocumentService.disableAutoSave(documentId);
    };
  }, [documentId]);

  const enableAutoSave = useCallback(
    (getContent: () => string) => {
      if (autoSaveEnabled) {
        DocumentService.enableAutoSave(documentId, getContent, {
          enabled: true,
          interval: autoSaveInterval,
        });
      }
    },
    [documentId, autoSaveEnabled, autoSaveInterval]
  );

  const disableAutoSave = useCallback(() => {
    DocumentService.disableAutoSave(documentId);
  }, [documentId]);

  const markAsChanged = useCallback(() => {
    DocumentService.markAsChanged(documentId);
  }, [documentId]);

  const getSaveState = useCallback(() => {
    return DocumentService.getSaveState(documentId);
  }, [documentId]);

  return {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    enableAutoSave,
    disableAutoSave,
    markAsChanged,
    getSaveState,
  };
};