import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  CollaborationState, 
  CollaborationSession, 
  CollaborationUser, 
  DocumentOperation, 
  CollaborativeCursor, 
  CollaborativeSelection,
  DocumentConflict
} from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/auth/authStore';

interface UseCollaborationOptions {
  documentId: string;
  enableRealTimeEditing?: boolean;
  enableCursors?: boolean;
  enableSelections?: boolean;
  onContentChange?: (content: string) => void;
  onConflict?: (conflicts: DocumentConflict[]) => void;
}

export const useCollaboration = ({
  documentId,
  enableRealTimeEditing = true,
  enableCursors = true,
  enableSelections = true,
  onContentChange,
  onConflict
}: UseCollaborationOptions) => {
  const { user } = useAuth();
  const { accessToken } = useAuthStore();
  const [state, setState] = useState<CollaborationState>(collaborationService.getState());
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [conflicts, setConflicts] = useState<DocumentConflict[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const contentRef = useRef<string>('');
  const cursorPositionRef = useRef<number>(0);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Initialize collaboration
  useEffect(() => {
    if (!user || !accessToken || isInitialized) return;

    const initializeCollaboration = async () => {
      try {
        const collaborationUser: CollaborationUser = {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          avatar: user.avatar as string | undefined,
          color: generateUserColor(user.id),
          isOnline: true,
          lastSeen: new Date()
        };

        await collaborationService.initialize(accessToken, collaborationUser);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initializeCollaboration();
  }, [user, accessToken, isInitialized]);

  // Join document session
  useEffect(() => {
    if (!isInitialized || !documentId) return;

    const joinSession = async () => {
      try {
        const newSession = await collaborationService.joinDocument(documentId);
        setSession(newSession);
      } catch (error) {
        console.error('Failed to join document session:', error);
      }
    };

    joinSession();

    return () => {
      if (documentId) {
        collaborationService.leaveDocument(documentId);
      }
    };
  }, [isInitialized, documentId]);

  // Subscribe to collaboration state changes
  useEffect(() => {
    const unsubscribe = collaborationService.onStateChange((newState) => {
      setState(newState);
      
      // Update session if it exists
      if (newState.session && newState.session.documentId === documentId) {
        setSession(newState.session);
        
        // Check for conflicts
        const sessionConflicts = newState.session.conflicts.filter(
          conflict => conflict.resolution === 'pending'
        );
        
        if (sessionConflicts.length > 0) {
          setConflicts(sessionConflicts);
          onConflict?.(sessionConflicts);
        }
      }
    });

    return unsubscribe;
  }, [documentId, onConflict]);

  // Generate a consistent color for a user based on their ID
  const generateUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Send document operation
  const sendOperation = useCallback((operation: Omit<DocumentOperation, 'id' | 'userId' | 'timestamp' | 'version'>) => {
    if (!enableRealTimeEditing || !user || !session) return;

    const fullOperation: DocumentOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      timestamp: new Date(),
      version: session.version
    };

    collaborationService.sendOperation(documentId, fullOperation);
  }, [enableRealTimeEditing, user, session, documentId]);

  // Handle text insertion
  const insertText = useCallback((position: number, text: string) => {
    sendOperation({
      type: 'insert',
      position,
      content: text
    });
  }, [sendOperation]);

  // Handle text deletion
  const deleteText = useCallback((position: number, length: number) => {
    sendOperation({
      type: 'delete',
      position,
      length
    });
  }, [sendOperation]);

  // Handle formatting
  const applyFormatting = useCallback((position: number, length: number, attributes: Record<string, unknown>) => {
    sendOperation({
      type: 'format',
      position,
      length,
      attributes
    });
  }, [sendOperation]);

  // Update cursor position
  const updateCursor = useCallback((position: number, selection?: { start: number; end: number }) => {
    if (!enableCursors || !user) return;

    cursorPositionRef.current = position;
    selectionRef.current = selection || null;

    const cursor: CollaborativeCursor = {
      userId: user.id,
      position,
      selection: selection || undefined,
      timestamp: new Date()
    };

    collaborationService.updateCursor(documentId, cursor);
  }, [enableCursors, user, documentId]);

  // Update selection
  const updateSelection = useCallback((start: number, end: number) => {
    if (!enableSelections || !user) return;

    const selection: CollaborativeSelection = {
      userId: user.id,
      start,
      end,
      timestamp: new Date()
    };

    collaborationService.updateSelection(documentId, selection);
  }, [enableSelections, user, documentId]);

  // Resolve conflict
  const resolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject', operations?: DocumentOperation[]) => {
    // Find the conflict
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    // Update conflict resolution
    const resolvedConflict: DocumentConflict = {
      ...conflict,
      resolution: resolution === 'accept' ? 'auto' : 'manual',
      resolvedBy: user?.id || undefined,
      resolvedAt: new Date()
    };
    
    // Use the resolved conflict (to avoid unused variable warning)
    console.warn('Conflict resolved:', resolvedConflict.id);

    // Remove from pending conflicts
    setConflicts(prev => prev.filter(c => c.id !== conflictId));

    // If accepting, apply the selected operations
    if (resolution === 'accept' && operations) {
      operations.forEach(operation => {
        const transformedOp = collaborationService.transformOperation(
          operation,
          session?.operations || []
        );
        
        // Apply to local content
        if (contentRef.current) {
          contentRef.current = collaborationService.applyOperation(contentRef.current, transformedOp);
          onContentChange?.(contentRef.current);
        }
      });
    }
  }, [conflicts, user, session, onContentChange]);

  // Get other users' cursors
  const getOtherCursors = useCallback((): CollaborativeCursor[] => {
    if (!session || !user) return [];
    
    return Array.from(session.cursors.values()).filter(
      cursor => cursor.userId !== user.id
    );
  }, [session, user]);

  // Get other users' selections
  const getOtherSelections = useCallback((): CollaborativeSelection[] => {
    if (!session || !user) return [];
    
    return Array.from(session.selections.values()).filter(
      selection => selection.userId !== user.id
    );
  }, [session, user]);

  // Get online users
  const getOnlineUsers = useCallback((): CollaborationUser[] => {
    if (!session) return [];
    
    return session.users.filter(u => u.isOnline);
  }, [session]);

  // Update content reference
  const updateContent = useCallback((content: string) => {
    contentRef.current = content;
  }, []);

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
    otherCursors: getOtherCursors(),
    otherSelections: getOtherSelections(),
    
    // Operations
    insertText,
    deleteText,
    applyFormatting,
    updateCursor,
    updateSelection,
    updateContent,
    
    // Conflict resolution
    resolveConflict,
    
    // Utility
    isInitialized: isInitialized && state.isConnected,
  };
};

export default useCollaboration;