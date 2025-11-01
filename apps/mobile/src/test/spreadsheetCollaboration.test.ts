import { spreadsheetCollaborationService } from '../services/spreadsheetCollaborationService';
import { SpreadsheetCollaborationUser } from '../types/spreadsheetCollaboration';

describe('SpreadsheetCollaborationService', () => {
  const mockUser: SpreadsheetCollaborationUser = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: undefined,
    color: '#FF0000',
    isOnline: true,
    lastSeen: new Date(),
    activeCell: 'A1',
    activeCellColor: '#FF0000',
    isEditing: false,
    editingCell: undefined,
    lastActivity: new Date()
  };

  beforeEach(() => {
    // Reset service state
    spreadsheetCollaborationService.cleanup();
  });

  afterEach(() => {
    spreadsheetCollaborationService.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = spreadsheetCollaborationService.getState();
      
      expect(state.isConnected).toBe(false);
      expect(state.isCollaborating).toBe(false);
      expect(state.currentUser).toBeUndefined();
      expect(state.session).toBeUndefined();
      expect(state.pendingOperations).toEqual([]);
      expect(state.config).toBeDefined();
      expect(state.config.enableRealTimeEditing).toBe(true);
      expect(state.config.enableCellLocking).toBe(true);
      expect(state.config.enableEditIndicators).toBe(true);
      expect(state.config.enableChangeTracking).toBe(true);
    });

    it('should be a singleton', () => {
      const instance1 = spreadsheetCollaborationService;
      const instance2 = spreadsheetCollaborationService;
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Session Management', () => {
    it('should join a spreadsheet session', async () => {
      // Mock WebSocket connection
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      const session = await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
      
      expect(session).toBeDefined();
      expect(session.spreadsheetId).toBe('test-spreadsheet-1');
      expect(session.users).toContain(mockUser);
      expect(session.isActive).toBe(true);
      expect(session.version).toBe(0);
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.isCollaborating).toBe(true);
      expect(state.session).toBe(session);
    });

    it('should leave a spreadsheet session', async () => {
      // Setup session first
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
      
      // Leave session
      spreadsheetCollaborationService.leaveSpreadsheet('test-spreadsheet-1');
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.isCollaborating).toBe(false);
      expect(state.session).toBeUndefined();
    });
  });

  describe('Cell Locking', () => {
    beforeEach(async () => {
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
    });

    it('should lock a cell successfully', async () => {
      const result = await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      expect(result).toBe(true);
      
      const lock = spreadsheetCollaborationService.getCellLock('test-spreadsheet-1', 'A1', 'sheet1');
      expect(lock).toBeDefined();
      expect(lock?.cellRef).toBe('A1');
      expect(lock?.sheetId).toBe('sheet1');
      expect(lock?.userId).toBe(mockUser.id);
      expect(lock?.lockType).toBe('editing');
    });

    it('should not lock an already locked cell', async () => {
      // Lock cell first
      await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      // Try to lock again with different user
      const mockUser2: SpreadsheetCollaborationUser = {
        ...mockUser,
        id: 'test-user-2',
        name: 'Test User 2'
      };
      
      // Simulate different user trying to lock
      const originalUser = spreadsheetCollaborationService.getState().currentUser;
      (spreadsheetCollaborationService as any).state.currentUser = mockUser2;
      
      const result = await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      expect(result).toBe(false);
      
      // Restore original user
      (spreadsheetCollaborationService as any).state.currentUser = originalUser;
    });

    it('should unlock a cell', async () => {
      // Lock cell first
      await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      // Unlock cell
      spreadsheetCollaborationService.unlockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      const lock = spreadsheetCollaborationService.getCellLock('test-spreadsheet-1', 'A1', 'sheet1');
      expect(lock).toBeNull();
    });

    it('should check if cell is locked by current user', async () => {
      await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      
      const isLocked = spreadsheetCollaborationService.isCellLockedByCurrentUser('test-spreadsheet-1', 'A1', 'sheet1');
      expect(isLocked).toBe(true);
      
      const isNotLocked = spreadsheetCollaborationService.isCellLockedByCurrentUser('test-spreadsheet-1', 'B1', 'sheet1');
      expect(isNotLocked).toBe(false);
    });
  });

  describe('Edit Indicators', () => {
    beforeEach(async () => {
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
    });

    it('should start cell editing', () => {
      spreadsheetCollaborationService.startCellEdit('test-spreadsheet-1', 'A1', 'sheet1', 'typing');
      
      const indicator = spreadsheetCollaborationService.getCellEditIndicator('test-spreadsheet-1', 'A1', 'sheet1');
      expect(indicator).toBeDefined();
      expect(indicator?.cellRef).toBe('A1');
      expect(indicator?.sheetId).toBe('sheet1');
      expect(indicator?.userId).toBe(mockUser.id);
      expect(indicator?.editType).toBe('typing');
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.currentUser?.isEditing).toBe(true);
      expect(state.currentUser?.editingCell).toBe('A1');
    });

    it('should end cell editing', () => {
      // Start editing first
      spreadsheetCollaborationService.startCellEdit('test-spreadsheet-1', 'A1', 'sheet1', 'typing');
      
      // End editing
      spreadsheetCollaborationService.endCellEdit('test-spreadsheet-1', 'A1', 'sheet1');
      
      const indicator = spreadsheetCollaborationService.getCellEditIndicator('test-spreadsheet-1', 'A1', 'sheet1');
      expect(indicator).toBeNull();
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.currentUser?.isEditing).toBe(false);
      expect(state.currentUser?.editingCell).toBeUndefined();
    });
  });

  describe('Cell Operations', () => {
    beforeEach(async () => {
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
    });

    it('should send cell operation', () => {
      const operation = {
        type: 'cell_update' as const,
        cellRef: 'A1',
        sheetId: 'sheet1',
        data: {
          value: { type: 'string' as const, value: 'Hello World' },
          formula: undefined,
          previousValue: { type: 'empty' as const },
          previousFormula: undefined
        }
      };
      
      spreadsheetCollaborationService.sendCellOperation('test-spreadsheet-1', operation);
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.pendingOperations).toHaveLength(1);
      expect(state.pendingOperations[0].operation).toEqual(operation);
    });
  });

  describe('Cursor Updates', () => {
    beforeEach(async () => {
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
    });

    it('should update cursor position', () => {
      spreadsheetCollaborationService.updateCursor('test-spreadsheet-1', 'B2', 'sheet1');
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.currentUser?.activeCell).toBe('B2');
      expect(state.currentUser?.lastActivity).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should notify state change handlers', (done) => {
      let callCount = 0;
      
      const unsubscribe = spreadsheetCollaborationService.onStateChange((state) => {
        callCount++;
        if (callCount === 1) {
          expect(state.isConnected).toBe(true);
          unsubscribe();
          done();
        }
      });
      
      // Trigger state change
      (spreadsheetCollaborationService as any).updateState({ isConnected: true });
    });

    it('should unsubscribe state change handlers', () => {
      let callCount = 0;
      
      const unsubscribe = spreadsheetCollaborationService.onStateChange(() => {
        callCount++;
      });
      
      // Trigger state change
      (spreadsheetCollaborationService as any).updateState({ isConnected: true });
      expect(callCount).toBe(1);
      
      // Unsubscribe and trigger again
      unsubscribe();
      (spreadsheetCollaborationService as any).updateState({ isConnected: false });
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      jest.spyOn(spreadsheetCollaborationService as any, 'initialize').mockResolvedValue(undefined);
      await spreadsheetCollaborationService.initialize('mock-token', mockUser);
      await spreadsheetCollaborationService.joinSpreadsheet('test-spreadsheet-1');
      
      // Add some locks and operations
      await spreadsheetCollaborationService.lockCell('test-spreadsheet-1', 'A1', 'sheet1');
      spreadsheetCollaborationService.startCellEdit('test-spreadsheet-1', 'B1', 'sheet1');
      
      // Cleanup
      spreadsheetCollaborationService.cleanup();
      
      const state = spreadsheetCollaborationService.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isCollaborating).toBe(false);
      expect(state.session).toBeUndefined();
      expect(state.pendingOperations).toEqual([]);
    });
  });
});