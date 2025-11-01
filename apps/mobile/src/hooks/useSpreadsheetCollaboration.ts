import { useEffect, useState, useCallback, useRef } from 'react';
import {
  SpreadsheetCollaborationState,
  SpreadsheetCollaborationSession,
  SpreadsheetCollaborationUser,
  SpreadsheetCellEdit,
  SpreadsheetCellLock,
  SpreadsheetEditIndicator,
  SpreadsheetOperation,
  SpreadsheetConflict,
  SpreadsheetChangeHistory,
  CellUpdateData,
} from '../types/spreadsheetCollaboration';
import { CellValue } from '../types/spreadsheet';
import { spreadsheetCollaborationService } from '../services/spreadsheetCollaborationService';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/auth/authStore';

interface UseSpreadsheetCollaborationOptions {
  spreadsheetId: string;
  enableRealTimeEditing?: boolean;
  enableCellLocking?: boolean;
  enableEditIndicators?: boolean;
  enableChangeTracking?: boolean;
  onCellUpdate?: (cellRef: string, sheetId: string, value: CellValue, formula?: string) => void;
  onConflict?: (conflicts: SpreadsheetConflict[]) => void;
  onUserJoin?: (user: SpreadsheetCollaborationUser) => void;
  onUserLeave?: (userId: string) => void;
}

export const useSpreadsheetCollaboration = ({
  spreadsheetId,
  enableRealTimeEditing = true,
  enableCellLocking = true,
  enableEditIndicators = true,
  enableChangeTracking = true,
  onCellUpdate,
  onConflict,
  onUserJoin,
  onUserLeave
}: UseSpreadsheetCollaborationOptions) => {
  const { user } = useAuth();
  const { accessToken } = useAuthStore();
  const [state, setState] = useState<SpreadsheetCollaborationState>(
    spreadsheetCollaborationService.getState()
  );
  const [session, setSession] = useState<SpreadsheetCollaborationSession | null>(null);
  const [conflicts, setConflicts] = useState<SpreadsheetConflict[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const lastUserCountRef = useRef<number>(0);

  // Generate a consistent color for a user based on their ID
  const generateUserColor = useCallback((userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize collaboration
  useEffect(() => {
    if (!user || !accessToken || isInitialized) return;

    const initializeCollaboration = async () => {
      try {
        const collaborationUser: SpreadsheetCollaborationUser = {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          avatar: user.avatar as string | undefined,
          color: generateUserColor(user.id),
          activeCellColor: generateUserColor(user.id),
          isOnline: true,
          isEditing: false,
          lastSeen: new Date(),
          lastActivity: new Date()
        };

        await spreadsheetCollaborationService.initialize(accessToken, collaborationUser);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize spreadsheet collaboration:', error);
      }
    };

    initializeCollaboration();
  }, [user, accessToken, isInitialized, generateUserColor]);

  // Join spreadsheet session
  useEffect(() => {
    if (!isInitialized || !spreadsheetId) return;

    const joinSession = async () => {
      try {
        const newSession = await spreadsheetCollaborationService.joinSpreadsheet(spreadsheetId);
        setSession(newSession);
      } catch (error) {
        console.error('Failed to join spreadsheet session:', error);
      }
    };

    joinSession();

    return () => {
      if (spreadsheetId) {
        spreadsheetCollaborationService.leaveSpreadsheet(spreadsheetId);
      }
    };
  }, [isInitialized, spreadsheetId]);

  // Subscribe to collaboration state changes
  useEffect(() => {
    const unsubscribe = spreadsheetCollaborationService.onStateChange((newState) => {
      setState(newState);
      
      // Update session if it exists
      if (newState.session && newState.session.spreadsheetId === spreadsheetId) {
        const currentSession = newState.session;
        setSession(currentSession);
        
        // Check for conflicts
        const sessionConflicts = currentSession.conflicts.filter(
          conflict => conflict.resolution === 'pending'
        );
        
        if (sessionConflicts.length > 0) {
          setConflicts(sessionConflicts);
          onConflict?.(sessionConflicts);
        }

        // Check for user changes
        const currentUserCount = currentSession.users.length;
        if (currentUserCount !== lastUserCountRef.current) {
          if (currentUserCount > lastUserCountRef.current) {
            // User joined
            const newUsers = currentSession.users.slice(lastUserCountRef.current);
            newUsers.forEach(newUser => onUserJoin?.(newUser));
          }
          lastUserCountRef.current = currentUserCount;
        }
      }
    });

    return unsubscribe;
  }, [spreadsheetId, onConflict, onUserJoin]);

  // Lock a cell for editing
  const lockCell = useCallback(async (cellRef: string, sheetId: string, lockType: 'editing' | 'formatting' | 'formula' = 'editing'): Promise<boolean> => {
    if (!enableCellLocking) return true;
    return await spreadsheetCollaborationService.lockCell(spreadsheetId, cellRef, sheetId, lockType);
  }, [enableCellLocking, spreadsheetId]);

  // Unlock a cell
  const unlockCell = useCallback((cellRef: string, sheetId: string) => {
    if (!enableCellLocking) return;
    spreadsheetCollaborationService.unlockCell(spreadsheetId, cellRef, sheetId);
  }, [enableCellLocking, spreadsheetId]);

  // Start editing a cell
  const startCellEdit = useCallback((cellRef: string, sheetId: string, editType: 'typing' | 'formula' | 'formatting' = 'typing') => {
    if (!enableEditIndicators) return;
    spreadsheetCollaborationService.startCellEdit(spreadsheetId, cellRef, sheetId, editType);
  }, [enableEditIndicators, spreadsheetId]);

  // End editing a cell
  const endCellEdit = useCallback((cellRef: string, sheetId: string) => {
    if (!enableEditIndicators) return;
    spreadsheetCollaborationService.endCellEdit(spreadsheetId, cellRef, sheetId);
  }, [enableEditIndicators, spreadsheetId]);

  // Update a cell value
  const updateCell = useCallback((cellRef: string, sheetId: string, value: CellValue, formula?: string, previousValue?: CellValue, previousFormula?: string) => {
    if (!enableRealTimeEditing) return;

    const operation: SpreadsheetOperation = {
      type: 'cell_update',
      cellRef,
      sheetId,
      data: {
        value,
        formula,
        previousValue,
        previousFormula
      } as CellUpdateData
    };

    spreadsheetCollaborationService.sendCellOperation(spreadsheetId, operation);
    onCellUpdate?.(cellRef, sheetId, value, formula);
  }, [enableRealTimeEditing, spreadsheetId, onCellUpdate]);

  // Update cursor position
  const updateCursor = useCallback((cellRef: string, sheetId: string) => {
    spreadsheetCollaborationService.updateCursor(spreadsheetId, cellRef, sheetId);
  }, [spreadsheetId]);

  // Get cell lock status
  const getCellLock = useCallback((cellRef: string, sheetId: string): SpreadsheetCellLock | null => {
    return spreadsheetCollaborationService.getCellLock(spreadsheetId, cellRef, sheetId);
  }, [spreadsheetId]);

  // Check if cell is locked by current user
  const isCellLockedByCurrentUser = useCallback((cellRef: string, sheetId: string): boolean => {
    return spreadsheetCollaborationService.isCellLockedByCurrentUser(spreadsheetId, cellRef, sheetId);
  }, [spreadsheetId]);

  // Check if cell is locked by another user
  const isCellLockedByOther = useCallback((cellRef: string, sheetId: string): boolean => {
    const lock = getCellLock(cellRef, sheetId);
    return lock !== null && !isCellLockedByCurrentUser(cellRef, sheetId);
  }, [getCellLock, isCellLockedByCurrentUser]);

  // Get edit indicator for a cell
  const getCellEditIndicator = useCallback((cellRef: string, sheetId: string): SpreadsheetEditIndicator | null => {
    return spreadsheetCollaborationService.getCellEditIndicator(spreadsheetId, cellRef, sheetId);
  }, [spreadsheetId]);

  // Get change history
  const getChangeHistory = useCallback((): SpreadsheetChangeHistory[] => {
    if (!enableChangeTracking) return [];
    return spreadsheetCollaborationService.getChangeHistory(spreadsheetId);
  }, [enableChangeTracking, spreadsheetId]);

  // Resolve conflict
  const resolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject', winningEdit?: SpreadsheetCellEdit) => {
    // Find the conflict
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    // Update conflict resolution
    const resolvedConflict: SpreadsheetConflict = {
      ...conflict,
      resolution: resolution === 'accept' ? 'auto' : 'manual',
      resolvedBy: user?.id,
      resolvedAt: new Date(),
      winningEdit: resolution === 'accept' ? winningEdit : undefined
    };

    // Remove from pending conflicts
    setConflicts(prev => prev.filter(c => c.id !== conflictId));

    // If accepting, apply the winning edit
    if (resolution === 'accept' && winningEdit) {
      const cellData = winningEdit.operation.data as CellUpdateData;
      onCellUpdate?.(winningEdit.cellRef, winningEdit.sheetId, cellData.value, cellData.formula);
    }

    console.log('Conflict resolved:', resolvedConflict.id);
  }, [conflicts, user, onCellUpdate]);

  // Get online users
  const getOnlineUsers = useCallback((): SpreadsheetCollaborationUser[] => {
    if (!session) return [];
    return session.users.filter(u => u.isOnline);
  }, [session]);

  // Get users editing cells
  const getEditingUsers = useCallback((): SpreadsheetCollaborationUser[] => {
    if (!session) return [];
    return session.users.filter(u => u.isEditing);
  }, [session]);

  // Get all cell locks
  const getAllCellLocks = useCallback((): SpreadsheetCellLock[] => {
    if (!session) return [];
    return Array.from(session.cellLocks.values());
  }, [session]);

  // Get all edit indicators
  const getAllEditIndicators = useCallback((): SpreadsheetEditIndicator[] => {
    if (!session) return [];
    return Array.from(session.editIndicators.values());
  }, [session]);

  return {
    // State
    isConnected: state.isConnected,
    isCollaborating: state.isCollaborating,
    session,
    conflicts,
    connectionError: state.connectionError,
    
    // Users and presence
    currentUser: state.currentUser,
    onlineUsers: getOnlineUsers(),
    editingUsers: getEditingUsers(),
    
    // Cell operations
    lockCell,
    unlockCell,
    startCellEdit,
    endCellEdit,
    updateCell,
    updateCursor,
    
    // Cell status
    getCellLock,
    isCellLockedByCurrentUser,
    isCellLockedByOther,
    getCellEditIndicator,
    getAllCellLocks,
    getAllEditIndicators,
    
    // Change tracking
    getChangeHistory,
    
    // Conflict resolution
    resolveConflict,
    
    // Utility
    isInitialized: isInitialized && state.isConnected,
  };
};

export default useSpreadsheetCollaboration;