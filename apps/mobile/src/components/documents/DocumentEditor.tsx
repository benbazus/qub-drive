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
import { Document, DocumentEditorProps, DocumentSaveState } from '../../types/document';
import { DocumentService } from '../../services/documentService';

interface DocumentEditorComponentProps extends Omit<DocumentEditorProps, 'document'> {
  document?: Document;
  documentId?: string;
  isNew?: boolean;
  initialTitle?: string;
  initialContent?: string;
  folderId?: string;
}

const DocumentEditor: React.FC<DocumentEditorComponentProps> = ({
  document: initialDocument,
  documentId,
  initialTitle = '',
  initialContent = '',
  onSave,
  onTitleChange,
  readOnly = false,
  autoSaveInterval = 30000,
  showToolbar = true,
  showCollaborators = false // Currently unused but kept for future implementation
}) => {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorRef>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const { height } = Dimensions.get('window');

  // Load document if documentId is provided
  useEffect(() => {
    if (documentId && !initialDocument) {
      loadDocument();
    }
  }, [documentId]);

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
  }, [document, readOnly, autoSaveInterval, setupAutoSave]);

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
      const doc = await DocumentService.getDocument(documentId);
      setDocument(doc);
      setTitle(doc.title);
      setContent(doc.content);
      
      // Set content in editor
      if (editorRef.current) {
        editorRef.current.setContent(doc.content);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('Error', 'Failed to load document');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const setupAutoSave = () => {
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
  };

  const saveDocument = async (contentToSave?: string, showSuccess = true) => {
    if (!document) return;
    
    setIsSaving(true);
    setSaveState(prev => ({ ...prev, isSaving: true, saveError: undefined as string | undefined }));
    
    try {
      const finalContent = contentToSave || await editorRef.current?.getContent() || content;
      
      if (onSave) {
        await onSave(finalContent);
      } else {
        await DocumentService.saveDocumentContent(document.id, finalContent);
      }
      
      setContent(finalContent);
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }));
      
      if (showSuccess) {
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
      await DocumentService.updateDocument(document.id, { title: newTitle.trim() });
      
      if (onTitleChange) {
        onTitleChange(newTitle.trim());
      }
    } catch (error) {
      console.error('Error updating title:', error);
      Alert.alert('Error', 'Failed to update document title');
      setTitle(title); // Revert title
    }
  }, [document, title, onTitleChange]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() !== document?.title) {
      handleTitleChange(title.trim());
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
  editor: {
    flex: 1,
  },
});

export default DocumentEditor;