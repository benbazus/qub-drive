import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import OfflineModeIndicator from '../offline/OfflineModeIndicator';
import { Document, DocumentEditorProps, DocumentSaveState } from '../../types/document';
import { DocumentService } from '../../services/documentService';
import {
  useIsOnline,
  useOfflineEditingActions,
  usePendingEdits,
} from '../../stores/offline/offlineEditingStore';
import { useOffline } from '../../hooks/useOffline';

interface OfflineDocumentEditorProps extends Omit<DocumentEditorProps, 'document'> {
  document?: Document;
  documentId?: string;
  isNew?: boolean;
  initialTitle?: string;
  initialContent?: string;
  folderId?: string;
}

const OfflineDocumentEditor: React.FC<OfflineDocumentEditorProps> = ({
  document: initialDocument,
  documentId,
  initialTitle = '',
  initialContent = '',
  onSave,
  onTitleChange,
  readOnly = false,
  autoSaveInterval = 30000,
  showToolbar = true,
}) => {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorRef>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [document, setDocument] = useState<Document | null>(initialDocument || null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<DocumentSaveState>({
    isSaving: false,
    hasUnsavedChanges: false
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { height } = Dimensions.get('window');

  // Offline editing hooks
  const isOnline = useIsOnline();
  const pendingEdits = usePendingEdits();
  const {
    saveDocumentOffline,
    getOfflineDocumentContent,
    isFileAvailableForOfflineEditing,
    syncPendingEdits,
  } = useOfflineEditingActions();
  
  const { isFileAvailableOffline } = useOffline();

  // Check if document has pending edits
  const documentPendingEdits = pendingEdits.filter(edit => edit.fileId === (documentId || document?.id));

  // Load document content (online or offline)
  useEffect(() => {
    if (documentId && !initialDocument) {
      loadDocument();
    }
  }, [documentId, initialDocument]);

  // Check offline availability
  useEffect(() => {
    const checkOfflineAvailability = async () => {
      if (documentId || document?.id) {
        const fileId = documentId || document!.id;
        const isAvailable = await isFileAvailableForOfflineEditing(fileId);
        const isOfflineAvailable = isFileAvailableOffline(fileId);
        setIsOfflineMode(isAvailable || isOfflineAvailable);
      }
    };

    checkOfflineAvailability();
  }, [documentId, document?.id, isFileAvailableForOfflineEditing, isFileAvailableOffline]);

  // Set up auto-save
  useEffect(() => {
    if (document && !readOnly) {
      setupAutoSave();
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [document, readOnly, autoSaveInterval, isOnline, setupAutoSave]);

  // Update save state when document changes
  useEffect(() => {
    if (document) {
      const currentSaveState = DocumentService.getSaveState(document.id);
      setSaveState(currentSaveState);
    }
  }, [document]);

  const loadDocument = async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    try {
      let doc: Document;
      let docContent: string;

      if (isOnline) {
        // Try to load from server first
        try {
          doc = await DocumentService.getDocument(documentId);
          docContent = doc.content;
        } catch (error) {
          // Fallback to offline content if server fails
          const offlineContent = await getOfflineDocumentContent(documentId);
          if (offlineContent) {
            // Create a minimal document object for offline mode
            doc = {
              id: documentId,
              title: 'Offline Document',
              content: offlineContent,
              createdAt: new Date(),
              updatedAt: new Date(),
              ownerId: 'offline',
              version: 1,
              autoSaveEnabled: true,
            } as Document;
            docContent = offlineContent;
          } else {
            throw error;
          }
        }
      } else {
        // Load from offline storage
        const offlineContent = await getOfflineDocumentContent(documentId);
        if (offlineContent) {
          doc = {
            id: documentId,
            title: 'Offline Document',
            content: offlineContent,
            createdAt: new Date(),
            updatedAt: new Date(),
            ownerId: 'offline',
            version: 1,
            autoSaveEnabled: true,
          } as Document;
          docContent = offlineContent;
        } else {
          throw new Error('Document not available offline');
        }
      }

      setDocument(doc);
      setTitle(doc.title);
      setContent(docContent);
      
      // Set content in editor
      if (editorRef.current) {
        editorRef.current.setContent(docContent);
      }
    } catch (loadError) {
      console.error('Error loading document:', loadError);
      Alert.alert('Error', 'Failed to load document');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const setupAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(async () => {
      if (saveState.hasUnsavedChanges && !saveState.isSaving && document) {
        try {
          const currentContent = await editorRef.current?.getContent() || content;
          await saveDocument(currentContent, false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, autoSaveInterval);
  }, [autoSaveInterval, saveState.hasUnsavedChanges, saveState.isSaving, document, content, saveDocument]);

  const saveDocument = async (contentToSave?: string, showSuccess = true) => {
    if (!document) return;
    
    setIsSaving(true);
    setSaveState(prev => ({ ...prev, isSaving: true, saveError: undefined }));
    
    try {
      const finalContent = contentToSave || await editorRef.current?.getContent() || content;
      
      if (isOnline && !isOfflineMode) {
        // Save online
        if (onSave) {
          await onSave(finalContent);
        } else {
          await DocumentService.saveDocumentContent(document.id, finalContent);
        }
      } else {
        // Save offline
        await saveDocumentOffline(document.id, finalContent, title);
      }
      
      setContent(finalContent);
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }));
      
      if (showSuccess && !isOfflineMode) {
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        saveError: 'Failed to save document'
      }));
      
      if (showSuccess) {
        Alert.alert('Error', 'Failed to save document');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));
    
    if (document) {
      DocumentService.markAsChanged(document.id);
    }
  }, [document]);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (!document || newTitle.trim() === title.trim()) return;
    
    setTitle(newTitle);
    
    try {
      if (isOnline && !isOfflineMode) {
        await DocumentService.updateDocument(document.id, { title: newTitle.trim() });
      } else {
        // Save title change offline
        await saveDocumentOffline(document.id, content, newTitle.trim());
      }
      
      if (onTitleChange) {
        onTitleChange(newTitle.trim());
      }
    } catch (error) {
      console.error('Error updating title:', error);
      Alert.alert('Error', 'Failed to update document title');
      setTitle(title); // Revert title
    }
  }, [document, title, onTitleChange, isOnline, isOfflineMode, content, saveDocumentOffline]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() !== document?.title) {
      handleTitleChange(title.trim());
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await syncPendingEdits();
      Alert.alert('Success', 'Document has been synced.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync document. Please try again later.');
    }
  };

  const handleBack = () => {
    if (saveState.hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back()
          },
          {
            text: 'Save',
            onPress: async () => {
              await saveDocument();
              router.back();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        {isEditingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={handleTitleSubmit}
            onSubmitEditing={handleTitleSubmit}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'Untitled Document'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <OfflineModeIndicator style={styles.offlineIndicator} />
        
        {documentPendingEdits.length > 0 && isOnline && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Ionicons name="sync-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {isSaving && (
          <ActivityIndicator size="small" color="#4A90E2" style={styles.savingIndicator} />
        )}
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={() => saveDocument(undefined, true)}
          disabled={isSaving}
        >
          <Ionicons name="checkmark" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaveStatus = () => {
    // Show offline mode status
    if (!isOnline || isOfflineMode) {
      return (
        <View style={[styles.saveStatus, styles.offlineStatus]}>
          <Ionicons name="cloud-offline-outline" size={16} color="#FF9500" />
          <Text style={styles.offlineStatusText}>
            {documentPendingEdits.length > 0 
              ? `Offline • ${documentPendingEdits.length} pending changes`
              : 'Offline mode'
            }
          </Text>
        </View>
      );
    }

    if (saveState.saveError) {
      return (
        <View style={[styles.saveStatus, styles.saveError]}>
          <Ionicons name="warning" size={16} color="#dc3545" />
          <Text style={styles.saveErrorText}>{saveState.saveError}</Text>
        </View>
      );
    }
    
    if (saveState.isSaving) {
      return (
        <View style={[styles.saveStatus, styles.saving]}>
          <ActivityIndicator size="small" color="#6c757d" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      );
    }
    
    if (saveState.lastSaved) {
      return (
        <View style={styles.saveStatus}>
          <Text style={styles.savedText}>
            Saved {formatSaveTime(saveState.lastSaved)}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const formatSaveTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        {renderSaveStatus()}
        
        <RichTextEditor
          ref={editorRef}
          initialContent={content}
          placeholder="Start writing your document..."
          onChange={handleContentChange}
          readOnly={readOnly}
          showToolbar={showToolbar}
          style={styles.editor}
          minHeight={height - 200}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#4A90E2',
    paddingVertical: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineIndicator: {
    marginRight: 4,
  },
  syncButton: {
    padding: 8,
  },
  savingIndicator: {
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  saving: {
    backgroundColor: '#fff3cd',
  },
  saveError: {
    backgroundColor: '#f8d7da',
  },
  offlineStatus: {
    backgroundColor: '#fff3cd',
  },
  savedText: {
    fontSize: 12,
    color: '#6c757d',
  },
  savingText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  saveErrorText: {
    fontSize: 12,
    color: '#721c24',
    marginLeft: 8,
  },
  offlineStatusText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  editor: {
    flex: 1,
  },
});

export default OfflineDocumentEditor;