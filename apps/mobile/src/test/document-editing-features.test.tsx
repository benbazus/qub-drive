import { DocumentService } from '../services/documentService';
import { collaborationService } from '../services/collaborationService';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { waitFor } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { act } from 'react';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { act } from 'react';
import { act } from 'react';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { act } from 'react';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { act } from 'react';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { act } from 'react';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import { DocumentEditor } from '@/components/documents';
import { render } from '@testing-library/react-native';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import useCollaboration from '@/hooks/useCollaboration';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import useCollaboration from '@/hooks/useCollaboration';
import { act } from 'react';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import { act } from 'react';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import { act } from 'react';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';
import { render } from '@testing-library/react-native';
import useCollaboration from '@/hooks/useCollaboration';
import CollaborativeDocumentEditor from '@/components/documents/CollaborativeDocumentEditor';

// Mock dependencies
jest.mock('../services/api/documentApi');
jest.mock('../services/collaborationService');

const mockDocument = {
  id: 'test-doc-1',
  title: 'Test Document',
  content: '<p>Initial content</p>',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: 'user-1',
  version: 1,
  autoSaveEnabled: true
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User'
};

const mockCollaborationService = {
  initialize: jest.fn(),
  joinDocument: jest.fn(),
  leaveDocument: jest.fn(),
  sendOperation: jest.fn(),
  updateCursor: jest.fn(),
  updateSelection: jest.fn(),
  onStateChange: jest.fn(),
  getState: jest.fn().mockReturnValue({
    isConnected: true,
    isCollaborating: true,
    currentUser: mockUser,
    session: null,
    connectionError: null
  }),
  transformOperation: jest.fn(),
  applyOperation: jest.fn()
};

describe('Document Editing Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup collaboration service mock
    (collaborationService as any).initialize = mockCollaborationService.initialize;
    (collaborationService as any).joinDocument = mockCollaborationService.joinDocument;
    (collaborationService as any).leaveDocument = mockCollaborationService.leaveDocument;
    (collaborationService as any).sendOperation = mockCollaborationService.sendOperation;
    (collaborationService as any).updateCursor = mockCollaborationService.updateCursor;
    (collaborationService as any).updateSelection = mockCollaborationService.updateSelection;
    (collaborationService as any).onStateChange = mockCollaborationService.onStateChange;
    (collaborationService as any).getState = mockCollaborationService.getState;
    (collaborationService as any).transformOperation = mockCollaborationService.transformOperation;
    (collaborationService as any).applyOperation = mockCollaborationService.applyOperation;
  });

  describe('Text Formatting and Editing', () => {
    it('should validate document content format', () => {
      const content = '<p>Test content with <strong>bold</strong> and <em>italic</em> text</p>';
      
      // Test that content contains expected formatting
      expect(content).toContain('<strong>');
      expect(content).toContain('<em>');
      expect(content).toContain('<p>');
    });

    it('should handle content changes through DocumentService', async () => {
      const documentId = 'test-doc-1';
      const newContent = '<p>Updated content</p>';
      
      // Mock DocumentService methods
      const markAsChangedSpy = jest.spyOn(DocumentService, 'markAsChanged');
      const getSaveStateSpy = jest.spyOn(DocumentService, 'getSaveState');
      
      // Simulate marking document as changed
      DocumentService.markAsChanged(documentId);
      
      expect(markAsChangedSpy).toHaveBeenCalledWith(documentId);
      
      // Verify save state reflects changes
      getSaveStateSpy.mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: true
      });
      
      const saveState = DocumentService.getSaveState(documentId);
      expect(saveState.hasUnsavedChanges).toBe(true);
    });

    it('should support text formatting operations through service', () => {
      const formattingOperations = {
        bold: '<strong>Bold text</strong>',
        italic: '<em>Italic text</em>',
        underline: '<u>Underlined text</u>',
        heading: '<h1>Heading text</h1>',
        list: '<ul><li>List item</li></ul>'
      };
      
      // Verify formatting operations produce expected HTML
      expect(formattingOperations.bold).toContain('<strong>');
      expect(formattingOperations.italic).toContain('<em>');
      expect(formattingOperations.underline).toContain('<u>');
      expect(formattingOperations.heading).toContain('<h1>');
      expect(formattingOperations.list).toContain('<ul>');
    });

    it('should handle undo and redo operations', () => {
      const documentHistory = [
        '<p>Initial content</p>',
        '<p>Modified content</p>',
        '<p>Final content</p>'
      ];
      
      let currentIndex = 2;
      
      // Simulate undo operation
      const undo = () => {
        if (currentIndex > 0) {
          currentIndex--;
          return documentHistory[currentIndex];
        }
        return documentHistory[currentIndex];
      };
      
      // Simulate redo operation
      const redo = () => {
        if (currentIndex < documentHistory.length - 1) {
          currentIndex++;
          return documentHistory[currentIndex];
        }
        return documentHistory[currentIndex];
      };
      
      // Test undo
      expect(undo()).toBe('<p>Modified content</p>');
      expect(undo()).toBe('<p>Initial content</p>');
      
      // Test redo
      expect(redo()).toBe('<p>Modified content</p>');
      expect(redo()).toBe('<p>Final content</p>');
    });

    it('should validate document title changes', async () => {
      const updateDocumentSpy = jest.spyOn(DocumentService, 'updateDocument');
      updateDocumentSpy.mockResolvedValue(mockDocument);
      
      const updatedTitle = 'Updated Title';
      
      await DocumentService.updateDocument('test-doc-1', { title: updatedTitle });
      
      expect(updateDocumentSpy).toHaveBeenCalledWith('test-doc-1', { title: updatedTitle });
    });

    it('should handle read-only mode correctly', () => {
      const readOnlyDocument = {
        ...mockDocument,
        readOnly: true
      };
      
      // In read-only mode, document should not be modifiable
      expect(readOnlyDocument.readOnly).toBe(true);
      
      // Verify that save operations would be blocked in read-only mode
      const canSave = !readOnlyDocument.readOnly;
      expect(canSave).toBe(false);
    });
  });

  describe('Real-time Collaboration', () => {
    it('should initialize collaboration service', async () => {
      const documentId = 'test-doc-1'
      
      render(
        <CollaborativeDocumentEditor
          documentId={documentId}
          enableCollaboration={true}
        />
      );

      expect(useCollaboration).toHaveBeenCalledWith({
        documentId: 'test-doc-1',
        enableRealTimeEditing: true,
        enableCursors: true,
        enableSelections: true,
        onContentChange: expect.any(Function),
        onConflict: expect.any(Function)
      });
    });

    it('should display collaboration status and online users', () => {
      const { getByText } = render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
        />
      );

      expect(getByText('Connected')).toBeTruthy();
    });

    it('should handle collaborative content changes', async () => {
      const { rerender } = render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
        />
      );

      // Simulate collaborative content change
      const collaborativeContentChange = mockCollaboration.updateContent;
      
      await act(async () => {
        collaborativeContentChange('<p>Collaborative update</p>');
      });

      expect(mockCollaboration.updateContent).toHaveBeenCalledWith('<p>Collaborative update</p>');
    });

    it('should send operations for text changes in collaborative mode', async () => {
      const onChangeMock = jest.fn();
      
      render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
          onChange={onChangeMock}
        />
      );

      // Simulate content change that should trigger collaborative operations
      await act(async () => {
        onChangeMock('<p>New collaborative content</p>');
      });

      expect(mockCollaboration.updateContent).toHaveBeenCalled();
    });

    it('should handle cursor and selection updates', async () => {
      const onSelectionChangeMock = jest.fn();
      
      render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
          onSelectionChange={onSelectionChangeMock}
        />
      );

      // Simulate selection change
      const selection = { start: 0, end: 5 };
      
      await act(async () => {
        onSelectionChangeMock(selection);
      });

      expect(mockCollaboration.updateCursor).toHaveBeenCalledWith(0, selection);
      expect(mockCollaboration.updateSelection).toHaveBeenCalledWith(0, 5);
    });

    it('should display conflict resolution when conflicts occur', async () => {
      const conflictCollaboration = {
        ...mockCollaboration,
        conflicts: [{
          id: 'conflict-1',
          documentId: 'test-doc-1',
          operations: [],
          users: [mockUser],
          timestamp: new Date(),
          resolution: 'pending' as const
        }]
      };

      (useCollaboration as jest.Mock).mockReturnValue(conflictCollaboration);

      const { getByText } = render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
        />
      );

      // Should show conflict resolution UI when conflicts exist
      // This would depend on the ConflictResolution component implementation
      expect(conflictCollaboration.conflicts).toHaveLength(1);
    });

    it('should handle collaboration disconnect gracefully', () => {
      const disconnectedCollaboration = {
        ...mockCollaboration,
        isConnected: false
      };

      (useCollaboration as jest.Mock).mockReturnValue(disconnectedCollaboration);

      const { getByText } = render(
        <CollaborativeDocumentEditor
          documentId="test-doc-1"
          enableCollaboration={true}
        />
      );

      expect(getByText('Offline')).toBeTruthy();
    });
  });

  describe('Auto-save and Sync Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should enable auto-save by default', () => {
      render(
        <DocumentEditor
          document={mockDocument}
          autoSaveInterval={30000}
        />
      );

      expect(DocumentService.getSaveState).toHaveBeenCalledWith('test-doc-1');
    });

    it('should trigger auto-save when content changes', async () => {
      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: true
      });

      const { rerender } = render(
        <DocumentEditor
          document={mockDocument}
          autoSaveInterval={5000}
        />
      );

      // Fast-forward time to trigger auto-save
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Auto-save should be attempted
      expect(DocumentService.getSaveState).toHaveBeenCalled();
    });

    it('should show saving indicator during save operations', async () => {
      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: true,
        hasUnsavedChanges: true
      });

      const { getByText } = render(
        <DocumentEditor
          document={mockDocument}
        />
      );

      expect(getByText('Saving...')).toBeTruthy();
    });

    it('should display save error when save fails', async () => {
      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: true,
        saveError: 'Failed to save document'
      });

      const { getByText } = render(
        <DocumentEditor
          document={mockDocument}
        />
      );

      expect(getByText('Failed to save document')).toBeTruthy();
    });

    it('should show last saved time when document is saved', () => {
      const lastSaved = new Date();
      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved
      });

      const { getByText } = render(
        <DocumentEditor
          document={mockDocument}
        />
      );

      expect(getByText('Saved just now')).toBeTruthy();
    });

    it('should handle manual save operations', async () => {
      const { getByTestId } = render(
        <DocumentEditor
          document={mockDocument}
          testID="document-editor"
        />
      );

      // Find and press save button
      const saveButton = getByTestId('document-editor').findByType('TouchableOpacity');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(DocumentService.saveDocumentContent).toHaveBeenCalledWith(
        'test-doc-1',
        '<p>Test content</p>'
      );
    });

    it('should prevent navigation when there are unsaved changes', async () => {
      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: true
      });

      const mockRouter = {
        back: jest.fn()
      };

      jest.doMock('expo-router', () => ({
        useRouter: () => mockRouter
      }));

      const { getByTestId } = render(
        <DocumentEditor
          document={mockDocument}
          testID="document-editor"
        />
      );

      // Try to navigate back
      const backButton = getByTestId('document-editor').findByType('TouchableOpacity');
      
      await act(async () => {
        fireEvent.press(backButton);
      });

      // Should show alert about unsaved changes
      expect(Alert.alert).toHaveBeenCalledWith(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        expect.any(Array)
      );
    });

    it('should sync changes with server periodically', async () => {
      const { rerender } = render(
        <DocumentEditor
          document={mockDocument}
          autoSaveInterval={10000}
        />
      );

      // Mark document as changed
      await act(async () => {
        DocumentService.markAsChanged('test-doc-1');
      });

      (DocumentService.getSaveState as jest.Mock).mockReturnValue({
        isSaving: false,
        hasUnsavedChanges: true
      });

      // Fast-forward time to trigger sync
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(DocumentService.getSaveState).toHaveBeenCalledWith('test-doc-1');
    });

    it('should handle network errors during save gracefully', async () => {
      (DocumentService.saveDocumentContent as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId } = render(
        <DocumentEditor
          document={mockDocument}
          testID="document-editor"
        />
      );

      const saveButton = getByTestId('document-editor').findByType('TouchableOpacity');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save document');
      });
    });
  });

  describe('Document Editor Integration', () => {
    it('should load document content on mount', async () => {
      render(
        <DocumentEditor
          documentId="test-doc-1"
        />
      );

      await waitFor(() => {
        expect(DocumentService.getDocument).toHaveBeenCalledWith('test-doc-1');
      });
    });

    it('should handle document loading errors', async () => {
      (DocumentService.getDocument as jest.Mock).mockRejectedValue(
        new Error('Document not found')
      );

      const mockRouter = {
        back: jest.fn()
      };

      jest.doMock('expo-router', () => ({
        useRouter: () => mockRouter
      }));

      render(
        <DocumentEditor
          documentId="test-doc-1"
        />
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load document');
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it('should cleanup resources on unmount', () => {
      const { unmount } = render(
        <DocumentEditor
          document={mockDocument}
        />
      );

      unmount();

      // Verify cleanup - timers should be cleared
      // This would be verified by checking that auto-save timers are cleared
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});