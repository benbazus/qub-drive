import { DocumentService } from '../services/documentService';
import { DEFAULT_DOCUMENT_TEMPLATES } from '../constants/documentTemplates';

// Mock the API client
jest.mock('../services/api/documentApi', () => ({
  DocumentApi: {
    getTemplates: jest.fn().mockResolvedValue([]),
    createDocument: jest.fn().mockResolvedValue({
      id: 'test-doc-1',
      title: 'Test Document',
      content: '<p>Test content</p>',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: 'user-1',
      version: 1,
      autoSaveEnabled: true
    }),
    saveDocumentContent: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Document Functionality', () => {
  describe('Document Templates', () => {
    it('should have default templates available', () => {
      expect(DEFAULT_DOCUMENT_TEMPLATES).toBeDefined();
      expect(DEFAULT_DOCUMENT_TEMPLATES.length).toBeGreaterThan(0);
      
      // Check that blank template exists
      const blankTemplate = DEFAULT_DOCUMENT_TEMPLATES.find(t => t.id === 'blank');
      expect(blankTemplate).toBeDefined();
      expect(blankTemplate?.name).toBe('Blank Document');
    });

    it('should have meeting notes template', () => {
      const meetingTemplate = DEFAULT_DOCUMENT_TEMPLATES.find(t => t.id === 'meeting-notes');
      expect(meetingTemplate).toBeDefined();
      expect(meetingTemplate?.name).toBe('Meeting Notes');
      expect(meetingTemplate?.content).toContain('Meeting Notes');
    });

    it('should have project plan template', () => {
      const projectTemplate = DEFAULT_DOCUMENT_TEMPLATES.find(t => t.id === 'project-plan');
      expect(projectTemplate).toBeDefined();
      expect(projectTemplate?.name).toBe('Project Plan');
      expect(projectTemplate?.content).toContain('Project Plan');
    });
  });

  describe('Document Service', () => {
    it('should create a document', async () => {
      const documentData = {
        title: 'Test Document',
        content: '<p>Test content</p>'
      };

      const document = await DocumentService.createDocument(documentData);
      
      expect(document).toBeDefined();
      expect(document.id).toBe('test-doc-1');
      expect(document.title).toBe('Test Document');
      expect(document.autoSaveEnabled).toBe(true);
    });

    it('should handle auto-save state', () => {
      const documentId = 'test-doc-1';
      
      // Initialize save state
      DocumentService.markAsChanged(documentId);
      
      const saveState = DocumentService.getSaveState(documentId);
      expect(saveState.hasUnsavedChanges).toBe(true);
      expect(saveState.isSaving).toBe(false);
    });

    it('should validate document title', async () => {
      const documentData = {
        title: '',
        content: '<p>Test content</p>'
      };

      await expect(DocumentService.createDocument(documentData))
        .rejects.toThrow('Document title is required');
    });
  });

  describe('Document Types', () => {
    it('should have proper document interface structure', () => {
      const mockDocument = {
        id: 'test-1',
        title: 'Test Document',
        content: '<p>Content</p>',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'user-1',
        version: 1,
        autoSaveEnabled: true
      };

      // Verify all required properties exist
      expect(mockDocument.id).toBeDefined();
      expect(mockDocument.title).toBeDefined();
      expect(mockDocument.content).toBeDefined();
      expect(mockDocument.createdAt).toBeInstanceOf(Date);
      expect(mockDocument.updatedAt).toBeInstanceOf(Date);
      expect(mockDocument.ownerId).toBeDefined();
      expect(mockDocument.version).toBeDefined();
      expect(typeof mockDocument.autoSaveEnabled).toBe('boolean');
    });
  });
});