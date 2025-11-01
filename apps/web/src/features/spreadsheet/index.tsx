import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Save, Download, Copy,
    Undo, Redo, MessageSquare, X, FileText,
    MoreHorizontal,
    Scissors, ClipboardPaste, Brush, Percent, DollarSign,
    MoreVertical, Share,
    Send, Reply,
    Check, Clock, User,
    Eye, EyeOff, Edit3, Trash2, Link2,
    Mail, Lock, Users, Crown,
    Info, CheckCircle2
} from 'lucide-react';
import { spreadsheetAPI } from '../../api/endpoints/spreadsheet.endpoint';

// Define the SpreadsheetAPI interface
// interface SpreadsheetAPI {
//     getSpreadsheet: (token: string) => Promise<SpreadsheetData>;
//     updateSpreadsheet: (token: string, data: Partial<SpreadsheetData>) => Promise<SpreadsheetData>;
//     createOrUpdateSpreadsheet: (token: string, data: SpreadsheetData) => Promise<SpreadsheetData>;
//     getCollaborators: (token: string) => Promise<Collaborator[]>;
//     grantAccess: (token: string, params: { userId: string; permission: 'VIEW' | 'EDIT' | 'ADMIN' }) => Promise<void>;
//     revokeAccess: (token: string, userId: string) => Promise<void>;
// }

// Define the types
interface SpreadsheetData {
    id?: string;
    token: string;
    title: string;
    cells: Record<string, CellData>;
    metadata: { comments: Record<string, Comment> };
    lastSaved: string;
}

interface CellData {
    value: string;
    style: React.CSSProperties;
}

interface Comment {
    id: string;
    text: string;
    author: string;
    timestamp: string;
    resolved: boolean;
    replies: Reply[];
    edited?: boolean;
    editedAt?: string;
}

interface Reply {
    id: string;
    text: string;
    author: string;
    timestamp: string;
}

// interface Collaborator {
//     id: string;
//     email: string;
//     name: string;
//     permission: string;
//     status: string;
//     isOwner: boolean;
//     grantedAt: string;
// }

interface Range {
    start: { row: number; col: number };
    end: { row: number; col: number };
}

interface ClipboardData {
    type: 'cell' | 'range';
    data: Record<string, CellData> | CellData;
    range?: Range;
}

interface HistoryState {
    cells: Record<string, CellData>;
    comments: Record<string, Comment>;
}

interface SharedUser {
    id: string;
    email: string;
    name: string;
    permission: string;
    status: string;
    isOwner: boolean;
    addedAt: string;
    addedBy: string;
}

// Mock API for type checking (replace with actual implementation)
// const spreadsheetAPI: SpreadsheetAPI = {
//     getSpreadsheet: async (token: string) => ({ token, title: '', cells: {}, metadata: { comments: {} }, lastSaved: new Date().toISOString() }),
//     updateSpreadsheet: async (token: string, data: Partial<SpreadsheetData>) => ({ token, title: '', cells: {}, metadata: { comments: {} }, lastSaved: new Date().toISOString(), ...data }),
//     createOrUpdateSpreadsheet: async (token: string, data: SpreadsheetData) => ({ token, title: '', cells: {}, metadata: { comments: {} }, lastSaved: new Date().toISOString(), ...data }),
//     getCollaborators: async (token: string) => [],
//     grantAccess: async () => { },
//     revokeAccess: async () => { },
// };

// Custom CSS to mimic Google Sheets look and feel
const SpreadsheetStyles = () => (
    <style>{`
    :root {
      --g-sheets-bg: #f8f9fa;
      --g-sheets-border: #dadce0;
      --g-sheets-border-dark: #c0c0c0;
      --g-sheets-accent: #1a73e8;
      --g-sheets-text: #202124;
      --g-sheets-text-light: #5f6368;
      --g-sheets-comment-indicator: #fbbc04;
      --g-sheets-hover: #f1f3f4;
      --g-sheets-header-bg: #f8f9fa;
      --g-sheets-menu-bg: #ffffff;
    }

    .gs-cell-selected {
      position: relative;
      outline: 2px solid var(--g-sheets-accent) !important;
      outline-offset: -2px;
      z-index: 10;
      background-color: rgba(26, 115, 232, 0.08) !important;
    }

    .gs-cell-selected::after {
      content: '';
      position: absolute;
      right: -3px;
      bottom: -3px;
      width: 6px;
      height: 6px;
      background-color: var(--g-sheets-accent);
      border: 1px solid white;
      cursor: se-resize;
      z-index: 11;
    }

    .gs-cell-range-selected {
      background-color: rgba(26, 115, 232, 0.12) !important;
      outline: 1px solid rgba(26, 115, 232, 0.4);
      outline-offset: -1px;
    }

    .gs-header-selected {
      background-color: #e8eaed !important;
    }

    .gs-comment-indicator {
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-top: 8px solid var(--g-sheets-comment-indicator);
    }

    .gs-toolbar-button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      border-radius: 4px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 0.1s;
    }

    .gs-toolbar-button:hover:not(:disabled) {
      background-color: var(--g-sheets-hover);
    }

    .gs-toolbar-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .gs-toolbar-separator {
      width: 1px;
      height: 20px;
      background-color: var(--g-sheets-border-dark);
      margin: 0 4px;
    }

    .gs-menu-bar {
      background: var(--g-sheets-menu-bg);
      border-bottom: 1px solid var(--g-sheets-border);
      padding: 8px 16px;
    }

    .gs-menu-item {
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: var(--g-sheets-text);
    }

    .gs-menu-item:hover {
      background-color: var(--g-sheets-hover);
    }

    .gs-cell {
      border-right: 1px solid var(--g-sheets-border);
      border-bottom: 1px solid var(--g-sheets-border);
      cursor: cell;
      user-select: none;
      transition: background-color 0.1s;
    }

    .gs-cell:hover:not(.gs-cell-selected) {
      background-color: #f8f9fa;
    }

    .gs-formula-bar {
      border-bottom: 1px solid var(--g-sheets-border);
      background: white;
    }

    .gs-sheet-tab {
      padding: 8px 16px;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 14px;
      color: var(--g-sheets-text-light);
    }

    .gs-sheet-tab.active {
      color: var(--g-sheets-accent);
      border-bottom-color: var(--g-sheets-accent);
    }

    .gs-sheet-tab:hover:not(.active) {
      background-color: var(--g-sheets-hover);
    }

    .gs-comment-panel {
      width: 300px;
      background: white;
      border-left: 1px solid var(--g-sheets-border);
      height: 100%;
      overflow-y: auto;
    }

    .gs-comment-item {
      border-bottom: 1px solid var(--g-sheets-border);
      padding: 12px;
      cursor: pointer;
      transition: background-color 0.1s;
    }

    .gs-comment-item:hover {
      background-color: var(--g-sheets-hover);
    }

    .gs-comment-item.active {
      background-color: rgba(26, 115, 232, 0.08);
      border-left: 3px solid var(--g-sheets-accent);
    }

    .gs-comment-item.resolved {
      opacity: 0.6;
    }

    .gs-comment-thread {
      max-height: 300px;
      overflow-y: auto;
    }

    .gs-comment-reply {
      margin-left: 20px;
      padding-left: 12px;
      border-left: 2px solid var(--g-sheets-border);
      margin-top: 8px;
    }

    .gs-comment-timestamp {
      font-size: 11px;
      color: var(--g-sheets-text-light);
    }

    .gs-comment-author {
      font-weight: 500;
      color: var(--g-sheets-text);
      font-size: 13px;
    }

    .gs-comment-text {
      font-size: 13px;
      color: var(--g-sheets-text);
      margin: 4px 0;
      line-height: 1.4;
    }

    .gs-comment-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .gs-comment-input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--g-sheets-border);
      border-radius: 4px;
      font-size: 13px;
      resize: none;
      min-height: 60px;
    }

    .gs-comment-input:focus {
      outline: none;
      border-color: var(--g-sheets-accent);
      box-shadow: 0 0 0 1px var(--g-sheets-accent);
    }

    .gs-panel-toggle {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background: var(--g-sheets-accent);
      color: white;
      border: none;
      border-radius: 4px 0 0 4px;
      padding: 8px 4px;
      cursor: pointer;
      z-index: 100;
    }

    .gs-share-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: 480px;
      max-height: 90vh;
      overflow: hidden;
      z-index: 1000;
    }

    .gs-share-tabs {
      display: flex;
      border-bottom: 1px solid var(--g-sheets-border);
    }

    .gs-share-tab {
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .gs-share-tab.active {
      color: var(--g-sheets-accent);
      border-bottom-color: var(--g-sheets-accent);
    }

    .gs-share-tab:hover:not(.active) {
      background-color: var(--g-sheets-hover);
    }

    .gs-user-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .gs-user-item:last-child {
      border-bottom: none;
    }

    .gs-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--g-sheets-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
      margin-right: 12px;
    }

    .gs-permission-select {
      padding: 4px 8px;
      border: 1px solid var(--g-sheets-border);
      border-radius: 4px;
      font-size: 13px;
      min-width: 100px;
    }

    .gs-link-box {
      background: var(--g-sheets-bg);
      border: 1px solid var(--g-sheets-border);
      border-radius: 4px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .gs-link-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--g-sheets-text);
    }

    .gs-link-input:focus {
      outline: none;
    }

    .gs-access-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--g-sheets-hover);
      border-radius: 12px;
      font-size: 12px;
      color: var(--g-sheets-text);
    }

    .gs-restriction-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .gs-toggle-switch {
      position: relative;
      width: 40px;
      height: 20px;
      background: #ccc;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .gs-toggle-switch.active {
      background: var(--g-sheets-accent);
    }

    .gs-toggle-switch::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
    }

    .gs-toggle-switch.active::before {
      transform: translateX(20px);
    }
  `}</style>
);

interface ReactSpreadsheetProps {
    token: string;
}

const ReactSpreadsheet: React.FC<ReactSpreadsheetProps> = ({ token }) => {
    const [cells, setCells] = useState<Record<string, CellData>>({});
    const [selectedCell, setSelectedCell] = useState<string>('A1');
    const [selectedRange, setSelectedRange] = useState<Range | null>(null);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [formulaBar, setFormulaBar] = useState<string>('');
    const [comments, setComments] = useState<Record<string, Comment>>({});
    const [showCommentDialog, setShowCommentDialog] = useState<boolean>(false);
    const [commentText, setCommentText] = useState<string>('');
    const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
    // const [setShowFontSizeDropdown] = useState<boolean>(false);

    // Server-related state
    const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    // Comment panel states
    const [showCommentPanel, setShowCommentPanel] = useState<boolean>(false);
    const [activeCommentCell, setActiveCommentCell] = useState<string | null>(null);
    const [replyText, setReplyText] = useState<string>('');
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [showResolved, setShowResolved] = useState<boolean>(false);
    const [currentUser] = useState<string>('Current User'); // In real app, get from auth

    // Share dialog states
    const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
    const [shareLink, setShareLink] = useState<string>('');
    const [linkAccess, setLinkAccess] = useState<'restricted' | 'view' | 'comment' | 'edit'>('restricted');
    const [emailInput, setEmailInput] = useState<string>('');
    const [emailPermission, setEmailPermission] = useState<'view' | 'comment' | 'edit'>('view');
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
    const [isLoadingShare, setIsLoadingShare] = useState<boolean>(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
    const [linkCopied, setLinkCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'people' | 'link'>('people');
    const [allowDownload, setAllowDownload] = useState<boolean>(true);
    //const [allowPrint, setAllowPrint] = useState<boolean>(true);
    const [allowCopy, setAllowCopy] = useState<boolean>(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const ROWS = 1000;
    const COLS = 26; // A-Z

    // --- UTILITY FUNCTIONS ---
    const getColumnHeader = (index: number): string => String.fromCharCode(65 + index);

    const cellToCoords = (cellRef: string): { row: number; col: number } => {
        if (!cellRef) return { row: -1, col: -1 };
        const match = cellRef.match(/([A-Z]+)(\d+)/);
        if (!match) return { row: -1, col: -1 };
        const col = match[1].charCodeAt(0) - 65;
        const row = parseInt(match[2], 10) - 1;
        return { row, col };
    };

    const coordsToCell = (row: number, col: number): string => `${getColumnHeader(col)}${row + 1}`;

    // --- SERVER COMMUNICATION ---
    const loadSpreadsheet = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await spreadsheetAPI.getSpreadsheet(token);
            //  setSpreadsheetData(data);
            setCells(data.cells || {});
            setComments(data.metadata?.comments || {});
            setLastSaved(new Date(data.lastSaved));
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error loading spreadsheet:', error);
            if ((error as any).response?.status === 404) {
                setSpreadsheetData(null);
                setCells({});
                setComments({});
                setHasUnsavedChanges(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const saveSpreadsheet = useCallback(
        async (forceSave = false) => {
            if (!hasUnsavedChanges && !forceSave) return;

            try {
                setIsSaving(true);
                // let data: SpreadsheetData;

                // if (spreadsheetData) {
                //     data = await spreadsheetAPI.updateSpreadsheet(token, {
                //         cells,
                //         metadata: { comments },
                //     });
                // } else {
                //     data = await spreadsheetAPI.createOrUpdateSpreadsheet(token, {
                //         token,
                //         title: 'Untitled Spreadsheet',
                //         cells,
                //         metadata: { comments },
                //         lastSaved: new Date().toISOString(),
                //     });
                // }

                //  setSpreadsheetData(data);
                //  setLastSaved(new Date(data.lastSaved));
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error('Error saving spreadsheet:', error);
            } finally {
                setIsSaving(false);
            }
        },
        [token, cells, comments, hasUnsavedChanges, spreadsheetData]
    );

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const interval = setInterval(() => {
            saveSpreadsheet();
        }, 30000);

        return () => clearInterval(interval);
    }, [hasUnsavedChanges, saveSpreadsheet]);

    useEffect(() => {
        loadSpreadsheet();
    }, [loadSpreadsheet]);

    useEffect(() => {
        if (!isLoading && Object.keys(cells).length > 0) {
            setHasUnsavedChanges(true);
        }
    }, [cells, isLoading]);

    useEffect(() => {
        if (showShareDialog && spreadsheetData) {
            loadCollaborators();
        }
    }, [showShareDialog, spreadsheetData]);

    const loadCollaborators = useCallback(async () => {
        try {
            const collaborators = await spreadsheetAPI.getCollaborators(token);
            setSharedUsers(
                collaborators.map((collab) => ({
                    id: collab.id,
                    email: collab.email,
                    name: collab.name,
                    permission: collab.permission.toLowerCase(),
                    status: collab.status,
                    isOwner: collab.isOwner,
                    addedAt: collab.grantedAt || new Date().toISOString(),
                    addedBy: collab.isOwner ? 'Owner' : 'Admin',
                }))
            );
        } catch (error) {
            console.error('Error loading collaborators:', error);
        }
    }, [token]);

    // --- HISTORY (UNDO/REDO) ---
    const saveToHistory = (newState: HistoryState) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    useEffect(() => {
        if (Object.keys(cells).length > 0 || Object.keys(comments).length > 0) {
            saveToHistory({ cells, comments });
        }
    }, []);

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevState = history[newIndex];
            setCells(prevState.cells);
            setComments(prevState.comments);
            setHistoryIndex(newIndex);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];
            setCells(nextState.cells);
            setComments(nextState.comments);
            setHistoryIndex(newIndex);
        }
    };

    // --- FORMULA EVALUATION ---
    const evaluateFormula = (formula: string, currentCellRef: string): string | number => {
        if (!formula.startsWith('=')) return formula;
        try {
            let expression = formula.slice(1).toUpperCase();
            expression = expression.replace(/[A-Z]+\d+/g, (match) => {
                if (match === currentCellRef) return '0';
                const cellData = cells[match];
                const value = cellData ? evaluateFormula(cellData.value, match) : '0';
                return isNaN(parseFloat(value as string)) ? '0' : parseFloat(value as string).toString();
            });
            expression = expression.replace(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/g, (_, start, end) => {
                const startCoords = cellToCoords(start);
                const endCoords = cellToCoords(end);
                let sum = 0;
                for (let r = Math.min(startCoords.row, endCoords.row); r <= Math.max(startCoords.row, endCoords.row); r++) {
                    for (let c = Math.min(startCoords.col, endCoords.col); c <= Math.max(startCoords.col, endCoords.col); c++) {
                        const cellRef = coordsToCell(r, c);
                        const cellValue = cells[cellRef]?.value || '0';
                        sum += parseFloat(cellValue as string) || 0;
                    }
                }
                return sum.toString();
            });
            // eslint-disable-next-line no-new-func
            return new Function(`return ${expression}`)();
        } catch {
            return '#ERROR';
        }
    };

    // --- CELL MANIPULATION ---
    const updateCell = (
        cellRef: string,
        value: string,
        style: React.CSSProperties = {},
        skipHistory = false
    ) => {
        if (!skipHistory) {
            saveToHistory({ cells, comments });
        }
        setCells((prev) => ({
            ...prev,
            [cellRef]: { ...prev[cellRef], value, style: { ...prev[cellRef]?.style, ...style } },
        }));
    };

    const handleCellClick = useCallback(
        (row: number, col: number, event: React.MouseEvent | null = null) => {
            const cellRef = coordsToCell(row, col);

            if (event?.shiftKey && selectedCell) {
                const startCoords = cellToCoords(selectedCell);
                const endCoords = { row, col };
                setSelectedRange({
                    start: {
                        row: Math.min(startCoords.row, endCoords.row),
                        col: Math.min(startCoords.col, endCoords.col),
                    },
                    end: {
                        row: Math.max(startCoords.row, endCoords.row),
                        col: Math.max(startCoords.col, endCoords.col),
                    },
                });
            } else {
                setSelectedCell(cellRef);
                setSelectedRange(null);
            }

            setEditingCell(null);
            setFormulaBar(cells[cellRef]?.value || '');
        },
        [selectedCell, cells]
    );

    const handleCellDoubleClick = useCallback((row: number, col: number) => {
        const cellRef = coordsToCell(row, col);
        setEditingCell(cellRef);
        setSelectedCell(cellRef);
        setSelectedRange(null);
    }, []);

    const handleMouseDown = useCallback(
        (row: number, col: number, e: React.MouseEvent) => {
            if (e.button !== 0) return;
            setIsDragging(true);
            setDragStart({ row, col });
            handleCellClick(row, col, e);
        },
        [handleCellClick]
    );

    const handleMouseEnter = useCallback(
        (row: number, col: number) => {
            if (!isDragging || !dragStart) return;

            const startRow = Math.min(dragStart.row, row);
            const endRow = Math.max(dragStart.row, row);
            const startCol = Math.min(dragStart.col, col);
            const endCol = Math.max(dragStart.col, col);

            setSelectedRange({
                start: { row: startRow, col: startCol },
                end: { row: endRow, col: endCol },
            });
        },
        [isDragging, dragStart]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDragStart(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mouseup', handleMouseUp);
            return () => document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging, handleMouseUp]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormulaBar(value);
        if (editingCell) {
            updateCell(editingCell, value, {}, true);
        }
    };

    const handleInputBlur = () => {
        saveToHistory({ cells, comments });
        setEditingCell(null);
    };

    const handleFormulaBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormulaBar(value);
        updateCell(selectedCell, value);
    };

    // --- TOOLBAR ACTIONS ---
    const applyFormat = (formatType: string, value: string | null = null) => {
        const currentStyle = cells[selectedCell]?.style || {};
        let newStyle: React.CSSProperties = {};

        const toggleStyle = (prop: keyof React.CSSProperties, onVal: string, offVal: string) =>
            currentStyle[prop] === onVal ? offVal : onVal;

        switch (formatType) {
            case 'bold':
                newStyle.fontWeight = toggleStyle('fontWeight', 'bold', 'normal');
                break;
            case 'italic':
                newStyle.fontStyle = toggleStyle('fontStyle', 'italic', 'normal');
                break;
            case 'underline':
                newStyle.textDecoration = toggleStyle('textDecoration', 'underline', 'none');
                break;
            case 'alignLeft':
                newStyle.textAlign = 'left';
                break;
            case 'alignCenter':
                newStyle.textAlign = 'center';
                break;
            case 'alignRight':
                newStyle.textAlign = 'right';
                break;
            case 'backgroundColor':
                newStyle.backgroundColor = value || undefined;
                break;
            case 'color':
                newStyle.color = value || undefined;
                break;
            case 'percentage':
                // Apply percentage format (example: multiply by 100 and add %)
                newStyle.textAlign = 'right';
                if (cells[selectedCell]?.value) {
                    const num = parseFloat(cells[selectedCell].value);
                    if (!isNaN(num)) {
                        updateCell(selectedCell, `${num * 100}%`, newStyle);
                        return;
                    }
                }
                break;
            case 'currency':
                // Apply currency format
                newStyle.textAlign = 'right';
                if (cells[selectedCell]?.value) {
                    const num = parseFloat(cells[selectedCell].value);
                    if (!isNaN(num)) {
                        updateCell(selectedCell, `$${num.toFixed(2)}`, newStyle);
                        return;
                    }
                }
                break;
            default:
                break;
        }
        updateCell(selectedCell, cells[selectedCell]?.value || '', newStyle);
    };

    const copyCell = useCallback(() => {
        if (selectedRange) {
            const rangeData: Record<string, CellData> = {};
            for (let r = selectedRange.start.row; r <= selectedRange.end.row; r++) {
                for (let c = selectedRange.start.col; c <= selectedRange.end.col; c++) {
                    const cellRef = coordsToCell(r, c);
                    rangeData[cellRef] = cells[cellRef] || { value: '', style: {} };
                }
            }
            setClipboard({ type: 'range', data: rangeData, range: selectedRange });
        } else {
            setClipboard({ type: 'cell', data: cells[selectedCell] || { value: '', style: {} } });
        }
    }, [selectedCell, selectedRange, cells]);

    const cutCell = useCallback(() => {
        copyCell();
        if (selectedRange) {
            for (let r = selectedRange.start.row; r <= selectedRange.end.row; r++) {
                for (let c = selectedRange.start.col; c <= selectedRange.end.col; c++) {
                    updateCell(coordsToCell(r, c), '', {}, true);
                }
            }
            saveToHistory({ cells, comments });
        } else {
            updateCell(selectedCell, '', {});
        }
    }, [copyCell, selectedCell, selectedRange]);

    const pasteCell = useCallback(() => {
        if (!clipboard) return;

        if (clipboard.type === 'range' && clipboard.range && 'range' in clipboard) {
            const { row: selectedRow, col: selectedCol } = cellToCoords(selectedCell);
            const { start } = clipboard.range;

            Object.entries(clipboard.data as Record<string, CellData>).forEach(([cellRef, cellData]) => {
                const { row: origRow, col: origCol } = cellToCoords(cellRef);
                const newRow = selectedRow + (origRow - start.row);
                const newCol = selectedCol + (origCol - start.col);

                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                    updateCell(coordsToCell(newRow, newCol), cellData.value, cellData.style, true);
                }
            });
            saveToHistory({ cells, comments });
        } else if (clipboard.type === 'cell') {
            updateCell(selectedCell, (clipboard.data as CellData).value, (clipboard.data as CellData).style);
        }
    }, [clipboard, selectedCell, ROWS, COLS]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, row: number, col: number) => {
            if (editingCell) {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    setEditingCell(null);

                    let newRow = row;
                    let newCol = col;
                    if (e.key === 'Enter') {
                        newRow = e.shiftKey ? Math.max(0, row - 1) : Math.min(ROWS - 1, row + 1);
                    } else if (e.key === 'Tab') {
                        newCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(COLS - 1, col + 1);
                    }
                    handleCellClick(newRow, newCol);
                }
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'c':
                        e.preventDefault();
                        copyCell();
                        return;
                    case 'x':
                        e.preventDefault();
                        cutCell();
                        return;
                    case 'v':
                        e.preventDefault();
                        pasteCell();
                        return;
                    case 'z':
                        e.preventDefault();
                        undo();
                        return;
                    case 'y':
                        e.preventDefault();
                        redo();
                        return;
                    case 'b':
                        e.preventDefault();
                        applyFormat('bold');
                        return;
                    case 'i':
                        e.preventDefault();
                        applyFormat('italic');
                        return;
                    case 'u':
                        e.preventDefault();
                        applyFormat('underline');
                        return;
                    default:
                        break;
                }
            }

            let newRow = row;
            let newCol = col;
            switch (e.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, row - 1);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    newRow = Math.min(ROWS - 1, row + 1);
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, col - 1);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    newCol = Math.min(COLS - 1, col + 1);
                    e.preventDefault();
                    break;
                case 'Tab':
                    newCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(COLS - 1, col + 1);
                    e.preventDefault();
                    break;
                case 'Enter':
                    newRow = e.shiftKey ? Math.max(0, row - 1) : Math.min(ROWS - 1, row + 1);
                    e.preventDefault();
                    break;
                case 'F2':
                    e.preventDefault();
                    setEditingCell(coordsToCell(row, col));
                    return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    updateCell(coordsToCell(row, col), '');
                    return;
                case 'Escape':
                    e.preventDefault();
                    setSelectedRange(null);
                    return;
                default:
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        setEditingCell(coordsToCell(row, col));
                        setFormulaBar(e.key);
                        updateCell(coordsToCell(row, col), e.key, {}, true);
                        e.preventDefault();
                    }
                    return;
            }
            handleCellClick(newRow, newCol, e as any);
        },
        [editingCell, copyCell, cutCell, pasteCell, undo, redo, applyFormat, handleCellClick, ROWS, COLS]
    );

    const exportToCSV = () => {
        let csv = '';
        for (let r = 0; r < ROWS; r++) {
            const rowData: string[] = [];
            for (let c = 0; c < COLS; c++) {
                const value = cells[coordsToCell(r, c)]?.value || '';
                rowData.push(`"${String(value).replace(/"/g, '""')}"`);
            }
            csv += rowData.join(',') + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'spreadsheet.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // --- COMMENTS ---
    const handleCommentSubmit = () => {
        if (!commentText.trim()) return;

        saveToHistory({ cells, comments });
        const newComment: Comment = {
            id: Date.now().toString(),
            text: commentText.trim(),
            author: currentUser,
            timestamp: new Date().toISOString(),
            resolved: false,
            replies: [],
        };

        setComments((prev) => ({
            ...prev,
            [selectedCell]: newComment,
        }));
        setShowCommentDialog(false);
        setCommentText('');
        setShowCommentPanel(true);
        setActiveCommentCell(selectedCell);
    };

    const addReply = (cellRef: string, replyText: string) => {
        if (!replyText.trim()) return;

        const reply: Reply = {
            id: Date.now().toString(),
            text: replyText.trim(),
            author: currentUser,
            timestamp: new Date().toISOString(),
        };

        setComments((prev) => ({
            ...prev,
            [cellRef]: {
                ...prev[cellRef],
                replies: [...(prev[cellRef]?.replies || []), reply],
            },
        }));
        setReplyText('');
    };

    const toggleCommentResolution = (cellRef: string) => {
        setComments((prev) => ({
            ...prev,
            [cellRef]: {
                ...prev[cellRef],
                resolved: !prev[cellRef]?.resolved,
            },
        }));
    };

    const deleteComment = (cellRef: string) => {
        setComments((prev) => {
            const newComments = { ...prev };
            delete newComments[cellRef];
            return newComments;
        });
        if (activeCommentCell === cellRef) {
            setActiveCommentCell(null);
        }
    };

    const editComment = (cellRef: string, newText: string) => {
        if (!newText.trim()) return;

        setComments((prev) => ({
            ...prev,
            [cellRef]: {
                ...prev[cellRef],
                text: newText.trim(),
                edited: true,
                editedAt: new Date().toISOString(),
            },
        }));
        setEditingComment(null);
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getVisibleComments = (): [string, Comment][] => {
        return Object.entries(comments).filter(([_, comment]) => showResolved || !comment.resolved);
    };

    const navigateToComment = (cellRef: string) => {
        cellToCoords(cellRef);
        setSelectedCell(cellRef);
        setActiveCommentCell(cellRef);
        setFormulaBar(cells[cellRef]?.value || '');

        const cellElement = document.querySelector(`[data-cell="${cellRef}"]`);
        if (cellElement) {
            cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // --- SHARE FUNCTIONALITY ---
    const generateShareLink = async () => {
        setIsGeneratingLink(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const baseUrl = window.location.origin;
        const linkId = Math.random().toString(36).substring(7);
        setShareLink(`${baseUrl}/sheet/${linkId}`);
        setIsGeneratingLink(false);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = shareLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const handleEmailInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailInput(e.target.value);
    }, []);

    const addUserByEmail = useCallback(async () => {
        if (!emailInput.trim() || !emailInput.includes('@')) return;

        setIsLoadingShare(true);
        try {
            await spreadsheetAPI.grantAccess(token, {
                userId: emailInput.trim(),
                permission: emailPermission.toUpperCase() as 'VIEW' | 'EDIT' | 'ADMIN',
            });

            await loadCollaborators();
            setEmailInput('');
        } catch (error) {
            console.error('Error sharing spreadsheet:', error);
        } finally {
            setIsLoadingShare(false);
        }
    }, [emailInput, emailPermission, token, loadCollaborators]);

    const updateUserPermission = useCallback(
        async (userId: string, newPermission: string) => {
            try {
                await spreadsheetAPI.grantAccess(token, {
                    userId,
                    permission: newPermission.toUpperCase() as 'VIEW' | 'EDIT' | 'ADMIN',
                });

                setSharedUsers((prev) =>
                    prev.map((user) => (user.id === userId ? { ...user, permission: newPermission } : user))
                );
            } catch (error) {
                console.error('Error updating user permission:', error);
            }
        },
        [token]
    );

    const removeUser = useCallback(
        async (userId: string) => {
            try {
                await spreadsheetAPI.revokeAccess(token, userId);
                setSharedUsers((prev) => prev.filter((user) => user.id !== userId));
            } catch (error) {
                console.error('Error removing user:', error);
            }
        },
        [token]
    );

    const getPermissionIcon = (permission: string) => {
        switch (permission) {
            case 'owner':
                return <Crown size={14} className="text-yellow-600" />;
            case 'edit':
                return <Edit3 size={14} className="text-green-600" />;
            case 'comment':
                return <MessageSquare size={14} className="text-blue-600" />;
            case 'view':
                return <Eye size={14} className="text-gray-600" />;
            default:
                return <Eye size={14} className="text-gray-600" />;
        }
    };

    // const getPermissionLabel = (permission: string): string => {
    //     switch (permission) {
    //         case 'owner':
    //             return 'Owner';
    //         case 'edit':
    //             return 'Editor';
    //         case 'comment':
    //             return 'Commenter';
    //         case 'view':
    //             return 'Viewer';
    //         default:
    //             return 'Viewer';
    //     }
    // };

    const getLinkAccessIcon = (access: string) => {
        switch (access) {
            case 'restricted':
                return <Lock size={14} />;
            case 'view':
                return <Eye size={14} />;
            case 'comment':
                return <MessageSquare size={14} />;
            case 'edit':
                return <Edit3 size={14} />;
            default:
                return <Lock size={14} />;
        }
    };

    const getLinkAccessLabel = (access: string): string => {
        switch (access) {
            case 'restricted':
                return 'Restricted';
            case 'view':
                return 'Anyone with the link can view';
            case 'comment':
                return 'Anyone with the link can comment';
            case 'edit':
                return 'Anyone with the link can edit';
            default:
                return 'Restricted';
        }
    };

    const getUserInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            const coords = cellToCoords(selectedCell);
            if (coords.row !== -1 && coords.col !== -1) {
                handleKeyDown(e as any, coords.row, coords.col);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [selectedCell, handleKeyDown]);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    useEffect(() => {
        if (showCommentDialog && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [showCommentDialog]);

    const selectedCoords = cellToCoords(selectedCell);

    const isInSelectedRange = useCallback(
        (row: number, col: number): boolean => {
            if (!selectedRange) return false;
            return (
                row >= selectedRange.start.row &&
                row <= selectedRange.end.row &&
                col >= selectedRange.start.col &&
                col <= selectedRange.end.col
            );
        },
        [selectedRange]
    );

    const renderCell = (row: number, col: number) => {
        const cellRef = coordsToCell(row, col);
        const cell = cells[cellRef];
        const isSelected = selectedCell === cellRef;
        const isEditing = editingCell === cellRef;
        const inRange = isInSelectedRange(row, col);

        const displayValue = isEditing ? '' : cell ? evaluateFormula(cell.value, cellRef) : '';

        let className =
            'gs-cell w-full h-full px-1.5 py-1 text-sm whitespace-nowrap overflow-hidden relative';

        if (isSelected) {
            className += ' gs-cell-selected';
        } else if (inRange) {
            className += ' gs-cell-range-selected';
        }

        return (
            <div
                className={className}
                style={cell?.style}
                onMouseDown={(e) => handleMouseDown(row, col, e)}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onClick={(e) => {
                    e.preventDefault();
                    if (!isDragging) {
                        handleCellClick(row, col, e);
                    }
                }}
                onDoubleClick={() => handleCellDoubleClick(row, col)}
                onKeyDown={(e) => handleKeyDown(e, row, col)}
                tabIndex={0}
                data-cell={cellRef}
            >
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={formulaBar}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className="w-full h-full p-0 m-0 border-none outline-none bg-transparent"
                        autoFocus
                    />
                ) : (
                    <>
                        <span className="block truncate">{displayValue}</span>
                        {comments[cellRef] && (
                            <div
                                className={`gs-comment-indicator ${comments[cellRef].resolved ? 'opacity-50' : ''}`}
                                title={`Comment by ${comments[cellRef].author}: ${comments[cellRef].text.substring(0, 50)}${comments[cellRef].text.length > 50 ? '...' : ''}`}
                            ></div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const ShareDialog: React.FC = () => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="gs-share-dialog">
                    <div className="p-4 border-b border-[var(--g-sheets-border)]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-[var(--g-sheets-text)]">Share "Untitled spreadsheet"</h2>
                            <button
                                onClick={() => setShowShareDialog(false)}
                                className="gs-toolbar-button"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="gs-share-tabs">
                        <button
                            className={`gs-share-tab ${activeTab === 'people' ? 'active' : ''}`}
                            onClick={() => setActiveTab('people')}
                        >
                            <Users size={16} className="inline mr-2" />
                            Share with people
                        </button>
                        <button
                            className={`gs-share-tab ${activeTab === 'link' ? 'active' : ''}`}
                            onClick={() => setActiveTab('link')}
                        >
                            <Link2 size={16} className="inline mr-2" />
                            Get link
                        </button>
                    </div>

                    <div className="p-4 max-h-96 overflow-y-auto">
                        {activeTab === 'people' && (
                            <div>
                                <div className="mb-6">
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="email"
                                                value={emailInput}
                                                onChange={handleEmailInputChange}
                                                placeholder="Add people by email"
                                                className="w-full px-3 py-2 border border-[var(--g-sheets-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--g-sheets-accent)] focus:border-transparent"
                                                onKeyDown={(e) => e.key === 'Enter' && !isLoadingShare && addUserByEmail()}
                                                disabled={isLoadingShare}
                                            />
                                            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        <select
                                            value={emailPermission}
                                            onChange={(e) => setEmailPermission(e.target.value as 'view' | 'comment' | 'edit')}
                                            className="gs-permission-select"
                                        >
                                            <option value="view">Viewer</option>
                                            <option value="comment">Commenter</option>
                                            <option value="edit">Editor</option>
                                        </select>
                                        <button
                                            onClick={addUserByEmail}
                                            disabled={!emailInput.trim() || !emailInput.includes('@') || isLoadingShare}
                                            className="px-4 py-2 bg-[var(--g-sheets-accent)] text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                        >
                                            {isLoadingShare && (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            {isLoadingShare ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-[var(--g-sheets-text-light)]">
                                        People you add will be notified via email
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2 text-[var(--g-sheets-text)]">People with access</h3>
                                    <div className="gs-user-item">
                                        <div className="gs-user-avatar">{getUserInitials(currentUser)}</div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{currentUser} (you)</div>
                                            <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                {currentUser.toLowerCase().replace(' ', '.')}@example.com
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getPermissionIcon('owner')}
                                            <span className="text-sm text-[var(--g-sheets-text-light)]">Owner</span>
                                        </div>
                                    </div>
                                </div>

                                {sharedUsers.length > 0 && (
                                    <div>
                                        {sharedUsers.map((user) => (
                                            <div key={user.id} className="gs-user-item">
                                                <div className="gs-user-avatar">{getUserInitials(user.name)}</div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {user.name}
                                                        {user.isOwner && ' (you)'}
                                                    </div>
                                                    <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                        {user.email}
                                                        {user.status === 'pending' && (
                                                            <span className="ml-2 inline-flex items-center gap-1 text-orange-600">
                                                                <Clock size={10} />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {user.isOwner ? (
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <Crown size={14} className="text-yellow-600" />
                                                            Owner
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <select
                                                                value={user.permission}
                                                                onChange={(e) => updateUserPermission(user.id, e.target.value)}
                                                                className="gs-permission-select"
                                                            >
                                                                <option value="view">Viewer</option>
                                                                <option value="comment">Commenter</option>
                                                                <option value="edit">Editor</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <button
                                                                onClick={() => removeUser(user.id)}
                                                                className="gs-toolbar-button text-red-600"
                                                                title="Remove access"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2 text-[var(--g-sheets-text)]">Link access</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="linkAccess"
                                                value="restricted"
                                                checked={linkAccess === 'restricted'}
                                                onChange={(e) => setLinkAccess(e.target.value as 'restricted')}
                                            />
                                            <Lock size={16} className="text-gray-600" />
                                            <div>
                                                <div className="text-sm font-medium">Restricted</div>
                                                <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                    Only people with access can open with this link
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="linkAccess"
                                                value="view"
                                                checked={linkAccess === 'view'}
                                                onChange={(e) => setLinkAccess(e.target.value as 'view')}
                                            />
                                            <Eye size={16} className="text-blue-600" />
                                            <div>
                                                <div className="text-sm font-medium">Anyone with the link</div>
                                                <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                    Anyone on the internet with this link can view
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="linkAccess"
                                                value="comment"
                                                checked={linkAccess === 'comment'}
                                                onChange={(e) => setLinkAccess(e.target.value as 'comment')}
                                            />
                                            <MessageSquare size={16} className="text-green-600" />
                                            <div>
                                                <div className="text-sm font-medium">Anyone with the link</div>
                                                <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                    Anyone on the internet with this link can comment
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="linkAccess"
                                                value="edit"
                                                checked={linkAccess === 'edit'}
                                                onChange={(e) => setLinkAccess(e.target.value as 'edit')}
                                            />
                                            <Edit3 size={16} className="text-red-600" />
                                            <div>
                                                <div className="text-sm font-medium">Anyone with the link</div>
                                                <div className="text-xs text-[var(--g-sheets-text-light)]">
                                                    Anyone on the internet with this link can edit
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {linkAccess !== 'restricted' && (
                                    <div className="mb-4">
                                        {!shareLink ? (
                                            <button
                                                onClick={generateShareLink}
                                                disabled={isGeneratingLink}
                                                className="w-full px-4 py-2 bg-[var(--g-sheets-accent)] text-white rounded-md hover:bg-blue-600 disabled:opacity-50 font-medium"
                                            >
                                                {isGeneratingLink ? 'Generating link...' : 'Create link'}
                                            </button>
                                        ) : (
                                            <div>
                                                <div className="gs-link-box mb-2">
                                                    <Link2 size={16} className="text-gray-500" />
                                                    <input type="text" value={shareLink} readOnly className="gs-link-input" />
                                                    <button
                                                        onClick={copyShareLink}
                                                        className="px-3 py-1 text-sm bg-white border border-[var(--g-sheets-border)] rounded hover:bg-gray-50"
                                                    >
                                                        {linkCopied ? (
                                                            <>
                                                                <CheckCircle2 size={14} className="inline mr-1 text-green-600" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} className="inline mr-1" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="gs-access-chip">
                                                    {getLinkAccessIcon(linkAccess)}
                                                    {getLinkAccessLabel(linkAccess)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="border-t border-[var(--g-sheets-border)] pt-4">
                                    <h3 className="text-sm font-medium mb-3 text-[var(--g-sheets-text)]">General access</h3>
                                    <div className="space-y-3">
                                        <div className="gs-restriction-item">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    Viewers and commenters can see the option to download, print, and copy
                                                </div>
                                            </div>
                                            <div
                                                className={`gs-toggle-switch ${allowDownload ? 'active' : ''}`}
                                                onClick={() => setAllowDownload(!allowDownload)}
                                            ></div>
                                        </div>
                                        <div className="gs-restriction-item">
                                            <div>
                                                <div className="text-sm font-medium">Viewers can copy</div>
                                            </div>
                                            <div
                                                className={`gs-toggle-switch ${allowCopy ? 'active' : ''}`}
                                                onClick={() => setAllowCopy(!allowCopy)}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-[var(--g-sheets-border)] bg-[var(--g-sheets-bg)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-[var(--g-sheets-text-light)]">
                                <Info size={14} />
                                <span>Learn about sharing</span>
                            </div>
                            <button
                                onClick={() => setShowShareDialog(false)}
                                className="px-4 py-2 bg-[var(--g-sheets-accent)] text-white rounded-md hover:bg-blue-600 font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CommentPanel: React.FC = () => {
        const visibleComments = getVisibleComments();

        return (
            <div className="gs-comment-panel flex flex-col">
                <div className="p-4 border-b border-[var(--g-sheets-border)] bg-[var(--g-sheets-bg)]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-[var(--g-sheets-text)]">Comments</h3>
                        <button
                            onClick={() => setShowCommentPanel(false)}
                            className="gs-toolbar-button"
                            title="Close panel"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowResolved(!showResolved)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${showResolved ? 'bg-gray-200' : 'bg-transparent'}`}
                            title="Toggle resolved comments"
                        >
                            {showResolved ? <EyeOff size={12} /> : <Eye size={12} />}
                            {showResolved ? 'Hide resolved' : 'Show resolved'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {visibleComments.length === 0 ? (
                        <div className="p-4 text-center text-[var(--g-sheets-text-light)]">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No comments yet</p>
                            <p className="text-xs mt-1">Select a cell and click the comment button to add one</p>
                        </div>
                    ) : (
                        visibleComments.map(([cellRef, comment]) => (
                            <div
                                key={cellRef}
                                className={`gs-comment-item ${activeCommentCell === cellRef ? 'active' : ''} ${comment.resolved ? 'resolved' : ''}`}
                                onClick={() => navigateToComment(cellRef)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User size={12} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="gs-comment-author">{comment.author}</div>
                                            <div className="gs-comment-timestamp">
                                                {formatTimestamp(comment.timestamp)} • Cell {cellRef}
                                                {comment.edited && ' (edited)'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {comment.resolved && <Check size={14} className="text-green-600" />}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCommentResolution(cellRef);
                                            }}
                                            className="gs-toolbar-button p-1"
                                            title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                                        >
                                            {comment.resolved ? <Clock size={12} /> : <Check size={12} />}
                                        </button>
                                    </div>
                                </div>

                                {editingComment === cellRef ? (
                                    <div className="mb-2">
                                        <textarea
                                            defaultValue={comment.text}
                                            className="gs-comment-input"
                                            onBlur={(e) => editComment(cellRef, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    editComment(cellRef, (e.target as HTMLTextAreaElement).value);
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditingComment(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div className="gs-comment-text mb-2">{comment.text}</div>
                                )}

                                <div className="gs-comment-actions">
                                    <button
                                        className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveCommentCell(cellRef);
                                        }}
                                    >
                                        <Reply size={10} className="inline mr-1" />
                                        Reply
                                    </button>
                                    {comment.author === currentUser && (
                                        <>
                                            <button
                                                className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingComment(cellRef);
                                                }}
                                            >
                                                <Edit3 size={10} className="inline mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                className="text-xs px-2 py-1 hover:bg-gray-100 rounded text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Delete this comment?')) {
                                                        deleteComment(cellRef);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={10} className="inline mr-1" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>

                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="gs-comment-thread mt-3">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="gs-comment-reply">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User size={8} className="text-gray-600" />
                                                    </div>
                                                    <span className="gs-comment-author text-xs">{reply.author}</span>
                                                    <span className="gs-comment-timestamp">{formatTimestamp(reply.timestamp)}</span>
                                                </div>
                                                <div className="gs-comment-text text-xs">{reply.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeCommentCell === cellRef && (
                                    <div className="mt-3 pt-3 border-t border-[var(--g-sheets-border)]">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Add a reply..."
                                            className="gs-comment-input mb-2"
                                            rows={2}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setActiveCommentCell(null)}
                                                className="text-xs px-3 py-1 hover:bg-gray-100 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => addReply(cellRef, replyText)}
                                                disabled={!replyText.trim()}
                                                className="text-xs px-3 py-1 bg-[var(--g-sheets-accent)] text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                            >
                                                <Send size={10} className="inline mr-1" />
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="text-lg text-gray-600">Loading spreadsheet...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white flex flex-col font-sans text-[var(--g-sheets-text)] relative">
            <SpreadsheetStyles />

            {!showCommentPanel && Object.keys(comments).length > 0 && (
                <button
                    onClick={() => setShowCommentPanel(true)}
                    className="gs-panel-toggle"
                    title="Show comments"
                >
                    <MessageSquare size={16} />
                    <span className="ml-1 text-xs">{Object.keys(comments).length}</span>
                </button>
            )}

            <div className="gs-menu-bar flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <button className="gs-menu-item">File</button>
                        <button className="gs-menu-item">Edit</button>
                        <button className="gs-menu-item">View</button>
                        <button className="gs-menu-item">Insert</button>
                        <button className="gs-menu-item">Format</button>
                        <button className="gs-menu-item">Data</button>
                        <button className="gs-menu-item">Tools</button>
                        <button className="gs-menu-item">Extensions</button>
                        <button className="gs-menu-item">Help</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowShareDialog(true)}
                        className="px-4 py-2 bg-[var(--g-sheets-accent)] text-white rounded-md hover:bg-blue-600 font-medium flex items-center gap-2"
                        title="Share spreadsheet"
                    >
                        <Share size={16} />
                        Share
                    </button>
                    <button className="gs-toolbar-button" title="More options">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--g-sheets-border)]">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-normal">{isLoading ? 'Loading...' : spreadsheetData?.title || 'Untitled spreadsheet'}</h1>
                    <button className="gs-toolbar-button" title="Rename">
                        <FileText size={16} />
                    </button>
                    {isSaving && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            Saving...
                        </div>
                    )}
                    {!isSaving && hasUnsavedChanges && <div className="text-sm text-orange-600">Unsaved changes</div>}
                    {!isSaving && !hasUnsavedChanges && lastSaved && (
                        <div className="text-sm text-green-600">Saved {lastSaved.toLocaleTimeString()}</div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button className="gs-toolbar-button" title="More">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 p-1.5 border-b border-[var(--g-sheets-border)] bg-[var(--g-sheets-bg)] flex-shrink-0">
                <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="gs-toolbar-button"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="gs-toolbar-button"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo size={18} />
                </button>
                <button className="gs-toolbar-button" title="Format painter">
                    <Brush size={18} />
                </button>
                <div className="gs-toolbar-separator"></div>

                <select className="px-2 py-1 text-sm border border-[var(--g-sheets-border)] rounded mr-1" title="Font family">
                    <option>Arial</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                </select>

                <div className="relative">
                    <select
                        className="px-2 py-1 text-sm border border-[var(--g-sheets-border)] rounded"
                        title="Font size"
                    // onChange={() => setShowFontSizeDropdown(false)}
                    >
                        <option>10</option>
                        <option selected>11</option>
                        <option>12</option>
                        <option>14</option>
                        <option>16</option>
                        <option>18</option>
                        <option>20</option>
                        <option>24</option>
                    </select>
                </div>

                <div className="gs-toolbar-separator"></div>

                <button onClick={() => applyFormat('bold')} className="gs-toolbar-button" title="Bold (Ctrl+B)">
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => applyFormat('italic')}
                    className="gs-toolbar-button"
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={18} />
                </button>
                <button onClick={() => applyFormat('underline')} className="gs-toolbar-button" title="Underline (Ctrl+U)">
                    <Underline size={18} />
                </button>
                <div className="gs-toolbar-separator"></div>    <button
                    onClick={() => applyFormat('alignLeft')}
                    className="gs-toolbar-button"
                    title="Align left"
                >
                    <AlignLeft size={18} />
                </button>
                <button
                    onClick={() => applyFormat('alignCenter')}
                    className="gs-toolbar-button"
                    title="Align center"
                >
                    <AlignCenter size={18} />
                </button>
                <button
                    onClick={() => applyFormat('alignRight')}
                    className="gs-toolbar-button"
                    title="Align right"
                >
                    <AlignRight size={18} />
                </button>
                <div className="gs-toolbar-separator"></div>

                <button
                    onClick={() => applyFormat('percentage')}
                    className="gs-toolbar-button"
                    title="Percentage format"
                >
                    <Percent size={18} />
                </button>
                <button
                    onClick={() => applyFormat('currency')}
                    className="gs-toolbar-button"
                    title="Currency format"
                >
                    <DollarSign size={18} />
                </button>
                <div className="gs-toolbar-separator"></div>

                <input
                    type="color"
                    onChange={(e) => applyFormat('backgroundColor', e.target.value)}
                    className="gs-toolbar-button w-7 h-7 p-0 border-none cursor-pointer"
                    title="Background color"
                    defaultValue="#ffffff"
                />
                <input
                    type="color"
                    onChange={(e) => applyFormat('color', e.target.value)}
                    className="gs-toolbar-button w-7 h-7 p-0 border-none cursor-pointer"
                    title="Text color"
                    defaultValue="#000000"
                />
                <div className="gs-toolbar-separator"></div>

                <button
                    onClick={() => setShowCommentDialog(true)}
                    className="gs-toolbar-button"
                    title="Insert comment"
                >
                    <MessageSquare size={18} />
                </button>
                <button onClick={copyCell} className="gs-toolbar-button" title="Copy (Ctrl+C)">
                    <Copy size={18} />
                </button>
                <button onClick={cutCell} className="gs-toolbar-button" title="Cut (Ctrl+X)">
                    <Scissors size={18} />
                </button>
                <button onClick={pasteCell} className="gs-toolbar-button" title="Paste (Ctrl+V)">
                    <ClipboardPaste size={18} />
                </button>
                <div className="gs-toolbar-separator"></div>

                <button onClick={exportToCSV} className="gs-toolbar-button" title="Download as CSV">
                    <Download size={18} />
                </button>
                <button onClick={() => saveSpreadsheet(true)} className="gs-toolbar-button" title="Save now">
                    <Save size={18} />
                </button>
            </div>

            <div className="gs-formula-bar flex items-center p-2 bg-white">
                <div className="w-16 text-sm font-medium">{selectedCell}</div>
                <input
                    value={formulaBar}
                    onChange={handleFormulaBarChange}
                    className="flex-1 px-2 py-1 text-sm border-l border-[var(--g-sheets-border)] outline-none"
                    placeholder="Enter formula or value"
                />
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <div className="inline-block min-w-full">
                        <div className="flex">
                            <div className="w-12 h-8 bg-[var(--g-sheets-header-bg)] border-r border-b border-[var(--g-sheets-border)]"></div>
                            {Array.from({ length: COLS }).map((_, col) => (
                                <div
                                    key={col}
                                    className={`w-24 h-8 bg-[var(--g-sheets-header-bg)] border-r border-b border-[var(--g-sheets-border)] flex items-center justify-center text-sm font-medium ${selectedCoords.col === col ? 'gs-header-selected' : ''}`}
                                >
                                    {getColumnHeader(col)}
                                </div>
                            ))}
                        </div>
                        {Array.from({ length: ROWS }).map((_, row) => (
                            <div key={row} className="flex">
                                <div
                                    className={`w-12 h-8 bg-[var(--g-sheets-header-bg)] border-r border-b border-[var(--g-sheets-border)] flex items-center justify-center text-sm font-medium ${selectedCoords.row === row ? 'gs-header-selected' : ''}`}
                                >
                                    {row + 1}
                                </div>
                                {Array.from({ length: COLS }).map((_, col) => (
                                    <div
                                        key={`${row}-${col}`}
                                        className="w-24 h-8 border-r border-b border-[var(--g-sheets-border)] bg-white"
                                        style={{ minWidth: '96px' }}
                                    >
                                        {renderCell(row, col)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                {showCommentPanel && <CommentPanel />}
            </div>

            <div className="flex items-center border-t border-[var(--g-sheets-border)] p-2 bg-[var(--g-sheets-bg)]">
                <button className="gs-sheet-tab active">Sheet1</button>
                <button className="gs-sheet-tab">+ Add Sheet</button>
            </div>

            {showCommentDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">Add Comment to {selectedCell}</h3>
                            <button
                                onClick={() => setShowCommentDialog(false)}
                                className="gs-toolbar-button"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            ref={commentInputRef}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="gs-comment-input"
                            placeholder="Enter your comment..."
                            rows={4}
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => setShowCommentDialog(false)}
                                className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim()}
                                className="px-3 py-1 text-sm bg-[var(--g-sheets-accent)] text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShareDialog && <ShareDialog />}
        </div>);
}; export default ReactSpreadsheet;

