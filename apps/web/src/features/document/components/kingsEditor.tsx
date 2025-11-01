/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { CursorOverlay } from "./CursorOverlay/CursorOverlay";
import { Header } from "./Header/Header";
import { MenuBar } from "./MenuBar/MenuBar";
import { ShareDialog } from "./ShareDialog/ShareDialog";
import { StatusBar } from "./StatusBar/StatusBar";
import { Toolbar } from "./Toolbar/Toolbar";
import { TypingIndicator } from "./TypingIndicator/TypingIndicator";
import { TextAlignment, FontFamily } from "./types";
import { useGetDocuments, useSaveDocuments } from "../hooks/useDocuments";
import { CommentsPanel } from "./Comments/CommentsPanel";
import { useSocket } from "../hooks/useSocket";
import { Socket } from "socket.io-client";

const VALID_FONT_FAMILIES: FontFamily[] = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
];

// HTML sanitization function (simplified - in production, use a library like DOMPurify)
const sanitizeHtml = (html: string): string => {
  // Simple sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/javascript:/gi, "");
};

const INTERVALS = {
  AUTO_SYNC: 5000, // 15 seconds
  FORMAT_UPDATE: 100,
  TITLE_CHANGE: 2000,
} as const;

const useEditor = ({
  editorRef,
  execCommand,
  formatUpdate,
  setShowShareDialog,
  toggleComments,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  execCommand: (command: string, value?: string | boolean) => void;
  formatUpdate: () => void;
  setShowShareDialog: (show: boolean) => void;
  toggleComments: () => void;
}) => {
  const toggleList = useCallback(
    (listType: "unordered" | "ordered") => {
      if (!editorRef.current) return;

      // Ensure the editor is focused
      editorRef.current.focus();

      const selection = window.getSelection();
      if (!selection) return;

      try {
        // Save the current selection
        let range: Range | null = null;
        if (selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          // If no selection, create one at the current cursor position
          range = document.createRange();
          range.setStart(editorRef.current, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Execute the list command
        const command =
          listType === "unordered"
            ? "insertUnorderedList"
            : "insertOrderedList";
        const success = document.execCommand(command, false);

        if (!success) {
          console.warn(
            `Failed to execute ${command}, trying alternative approach`
          );

          // Alternative approach: Create the list manually
          if (range && !range.collapsed) {
            const selectedContent = range.extractContents();
            const listElement = document.createElement(
              listType === "unordered" ? "ul" : "ol"
            );
            const listItem = document.createElement("li");

            listItem.appendChild(selectedContent);
            listElement.appendChild(listItem);
            range.insertNode(listElement);

            // Move cursor to end of list item
            range.setStartAfter(listElement);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // If no selection, just create an empty list
            const listElement = document.createElement(
              listType === "unordered" ? "ul" : "ol"
            );
            const listItem = document.createElement("li");
            listItem.innerHTML = "&nbsp;"; // Add non-breaking space to make it selectable
            listElement.appendChild(listItem);

            if (range) {
              range.insertNode(listElement);

              // Place cursor inside the list item
              range.setStart(listItem, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }

        // Trigger format update
        formatUpdate();
      } catch (error) {
        console.error(`Error creating ${listType} list:`, error);
      }
    },
    [editorRef, formatUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            execCommand("bold");
            break;
          case "i":
            e.preventDefault();
            execCommand("italic");
            break;
          case "u":
            e.preventDefault();
            execCommand("underline");
            break;
          case "s":
            e.preventDefault();
            if (e.shiftKey) {
              // Ctrl+Shift+S for sharing
              setShowShareDialog(true);
            } else {
              // Ctrl+S for saving - manual save, not interval
              // Will be handled by manual save function
            }
            break;
          // List shortcuts
          case "8": // Ctrl+Shift+8 for bullet list
            if (e.shiftKey) {
              e.preventDefault();
              toggleList("unordered");
            }
            break;
          case "7": // Ctrl+Shift+7 for numbered list
            if (e.shiftKey) {
              e.preventDefault();
              toggleList("ordered");
            }
            break;
          case "m": // Ctrl+Alt+M for comments
            if (e.altKey) {
              e.preventDefault();
              toggleComments();
            }
            break;
        }
      }

      // Handle Enter key in lists
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const listItem =
            range.startContainer.nodeType === Node.TEXT_NODE
              ? range.startContainer.parentElement?.closest("li")
              : (range.startContainer as Element).closest("li");

          if (listItem) {
            // If list item is empty, exit the list
            if (listItem.textContent?.trim() === "") {
              e.preventDefault();
              const list = listItem.closest("ul, ol");
              if (list) {
                // Create a new paragraph after the list
                const newParagraph = document.createElement("p");
                newParagraph.innerHTML = "<br>";
                list.parentNode?.insertBefore(newParagraph, list.nextSibling);

                // Remove the empty list item
                listItem.remove();

                // If list is now empty, remove it
                if (!list.hasChildNodes()) {
                  list.remove();
                }

                // Move cursor to new paragraph
                const newRange = document.createRange();
                newRange.setStart(newParagraph, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          }
        }
      }

      // Auto-sync will be handled by interval
    },
    [execCommand, toggleList, setShowShareDialog, toggleComments]
  );

  const insertLink = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      alert("Please select some text first to create a link.");
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText) {
      alert("Please select some text first to create a link.");
      return;
    }

    const url = prompt("Enter URL:", "https://");
    if (url && url !== "https://") {
      execCommand("createLink", url);
    }
  }, [execCommand]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:", "https://");
    if (url && url !== "https://") {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "10px 0";
      img.setAttribute("alt", "Inserted image");

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);

        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Auto-sync will be handled by interval
      }
    }
  }, []);

  return { handleKeyDown, insertLink, insertImage, toggleList };
};

interface KingsEditorProps {
  documentId?: string;
}

export const KingsEditor: React.FC<KingsEditorProps> = ({
  documentId: propDocumentId,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  const decodedMode = atob(mode as string);

  let modeType: "new" | "edit" | "view" | "unknown";
  if (decodedMode === "mode=new") modeType = "new";
  else if (decodedMode === "mode=edit") modeType = "edit";
  else if (decodedMode === "mode=view") modeType = "view";
  else modeType = "unknown";

  console.log(" +++++++++++++++++++++++++++ ");
  console.log(urlParams.get("mode"));
  console.log(decodedMode);
  console.log(modeType);
  console.log(" +++++++++++++++++++++++++++ ");

  const documentId = propDocumentId;

  const { data: fetchedDocument } = useGetDocuments(documentId!);
  //const currentUserId = localStorage.getItem('userId');
  // const userName = localStorage.getItem('userName');

  // console.log(" +++++++++++++++++++++++++++ ")
  // console.log(currentUserId)
  //console.log(userName)
  // console.log(" +++++++++++++++++++++++++++ ")
  // State management
  const [documentTitle, setDocumentTitle] =
    useState<string>("Untitled Document");
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [showFormatMenu, setShowFormatMenu] = useState<boolean>(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [currentAlignment, setCurrentAlignment] =
    useState<TextAlignment>("left");
  const [fontSize, setFontSize] = useState<string>("11");
  const [fontFamily, setFontFamily] = useState<FontFamily>("Arial");
  const [documentContent, setDocumentContent] = useState<string>("");

  const [currentUserId] = useState<string>(() => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = "user-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("userId", userId);
    }
    return userId;
  });
  const [userName] = useState<string>(() => {
    return localStorage.getItem("userName") || "Anonymous User";
  });

  // Create current user object for comments
  const currentUser = {
    id: currentUserId,
    name: userName,
    email:
      localStorage.getItem("userEmail") ||
      `${userName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    avatar: localStorage.getItem("userAvatar") || undefined,
  };
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const formatUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReceivingUpdateRef = useRef<boolean>(false);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [otherCursors, setOtherCursors] = useState<Map<string, any>>(new Map());
  const hasUnsavedChangesRef = useRef<boolean>(false);

  const { saveDocumentMutation } = useSaveDocuments();
  
  // Socket configuration
  const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001';
  
  // Initialize socket connection
  const socketRef = useRef<Socket | null>(null);
  const {
    socket,
    connectionStatus,
    connectedUsers,
    connect: connectSocket,
    disconnect: disconnectSocket,
    emitDocumentChange,
    emitTitleChange: socketEmitTitleChange,
    emitCursorPosition,
    emitTypingStatus
  } = useSocket({
    serverUrl: SERVER_URL,
    documentId: documentId || '',
    currentUserId,
    userName
  });

  // Update socket ref when socket changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Comments hook
  const [showComments, setShowComments] = useState(false);
  const toggleComments = () => setShowComments(!showComments);

  // Page B
  // const [searchParams] = useSearchParams();
  // const data = searchParams.get("data");
  // const decoded = data ? atob(data) : null; // "mode=new"

  // const { data } = Route.useSearch(); // { data: "bW9kZT1uZXc=" }

  // const decoded = data ? atob(data) : null; // "mode=new"

  // Sync function with socket support
  const syncRealTime = useCallback(() => {
    if (editorRef.current && !isReceivingUpdateRef.current) {
      const content = editorRef.current.innerHTML;
      setDocumentContent(content);
      hasUnsavedChangesRef.current = true; // Mark for database save
      
      // Emit document change to socket if connected
      if (connectionStatus === 'connected') {
        emitDocumentChange(content);
      }
    }
  }, [connectionStatus, emitDocumentChange]);

  // Auto-save function (for database persistence)
  const autoSave = useCallback(() => {
    if (hasUnsavedChangesRef.current && documentId) {
      saveDocumentMutation.mutate(
        {
          documentId: documentId,
          content: documentContent,
          title: documentTitle,
        },
        {
          onSuccess: () => {
            setLastSaveTime(new Date());
            hasUnsavedChangesRef.current = false; // Reset after saving
            console.log(
              "💾 Auto-saved to database at",
              new Date().toLocaleTimeString()
            );
          },
          onError: (error: any) => {
            console.error("Failed to save document:", error);
          },
        }
      );
    }
  }, [saveDocumentMutation, documentId, documentContent, documentTitle]);

  // Title change with socket support
  const emitTitleChange = useCallback((newTitle: string) => {
    console.log("Title changed:", newTitle);
    
    // Emit title change to socket if connected
    if (connectionStatus === 'connected') {
      socketEmitTitleChange(newTitle);
    }
  }, [connectionStatus, socketEmitTitleChange]);

  // Update active formats
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const formats = new Set<string>();
      if (document.queryCommandState("bold")) formats.add("bold");
      if (document.queryCommandState("italic")) formats.add("italic");
      if (document.queryCommandState("underline")) formats.add("underline");
      if (document.queryCommandState("insertUnorderedList"))
        formats.add("unorderedList");
      if (document.queryCommandState("insertOrderedList"))
        formats.add("orderedList");
      setActiveFormats(formats);

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentElement =
          range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? (range.commonAncestorContainer.parentElement as HTMLElement)
            : (range.commonAncestorContainer as HTMLElement);

        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          const textAlign = computedStyle.textAlign;
          setCurrentAlignment(
            textAlign === "center"
              ? "center"
              : textAlign === "right"
                ? "right"
                : textAlign === "justify"
                  ? "justify"
                  : "left"
          );
        }
      }

      const currentFontSize = document.queryCommandValue("fontSize");
      const currentFontFamily = document.queryCommandValue("fontName");

      if (currentFontSize && currentFontSize !== fontSize) {
        const sizeMap: Record<string, string> = {
          "1": "8",
          "2": "10",
          "3": "12",
          "4": "14",
          "5": "18",
          "6": "24",
          "7": "36",
        };
        const mappedSize = sizeMap[currentFontSize] || "12";
        if (mappedSize !== fontSize) setFontSize(mappedSize);
      }

      if (currentFontFamily && currentFontFamily !== fontFamily) {
        const cleanFamily = currentFontFamily.replace(
          /['"]/g,
          ""
        ) as FontFamily;
        if (VALID_FONT_FAMILIES.includes(cleanFamily)) {
          setFontFamily(cleanFamily);
        }
      }
    } catch (error) {
      console.error("Error updating formats:", error);
    }
  }, [fontSize, fontFamily]);

  // Typing status management
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const handleStartTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      // Emit typing status to socket if connected
      if (connectionStatus === 'connected') {
        emitTypingStatus(true);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      // Emit stop typing to socket if connected
      if (connectionStatus === 'connected') {
        emitTypingStatus(false);
      }
    }, 1500);
  }, [connectionStatus, emitTypingStatus]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      // Emit stop typing to socket if connected
      if (connectionStatus === 'connected') {
        emitTypingStatus(false);
      }
    }
  }, [connectionStatus, emitTypingStatus]);

  // Real-time sync with minimal delay (for instant collaboration)
  const delayedRealTimeSync = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => syncRealTime(), 25); // Ultra-fast 25ms for near-instant collaboration
    };
  }, [syncRealTime]);

  // Track cursor position with socket support
  const emitCursorPositionDelayed = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (connectionStatus === 'connected') {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const position = {
              startOffset: range.startOffset,
              endOffset: range.endOffset,
              startContainer: range.startContainer.nodeType === Node.TEXT_NODE 
                ? range.startContainer.parentElement?.tagName 
                : (range.startContainer as Element).tagName,
              endContainer: range.endContainer.nodeType === Node.TEXT_NODE 
                ? range.endContainer.parentElement?.tagName 
                : (range.endContainer as Element).tagName
            };
            emitCursorPosition(position, selection);
          }
        }
      }, 100);
    };
  }, [connectionStatus, emitCursorPosition]);

  // Format update with delay (keep this one for UI responsiveness)
  const delayedFormatUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => updateActiveFormats(),
        INTERVALS.FORMAT_UPDATE
      );
    };
  }, [updateActiveFormats]);

  // Title change with delay
  const delayedTitleChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (newTitle: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => emitTitleChange(newTitle),
        INTERVALS.TITLE_CHANGE
      );
    };
  }, [emitTitleChange]);

  // Handle title change
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setDocumentTitle(newTitle);
      delayedTitleChange(newTitle);
    },
    [delayedTitleChange]
  );

  // Editor functions
  const execCommand = useCallback(
    (command: string, value?: string | boolean) => {
      if (editorRef.current) editorRef.current.focus(); // Ensure editor is focused before executing command

      if (command === "fontSize") {
        const selection = window.getSelection();
        if (
          selection &&
          selection.rangeCount > 0 &&
          !selection.isCollapsed &&
          typeof value === "string"
        ) {
          document.execCommand(command, false, value);
        } else if (editorRef.current && value && typeof value === "string") {
          editorRef.current.style.fontSize = `${value}pt`;
        }
      } else if (command === "fontName") {
        const selection = window.getSelection();
        if (
          selection &&
          selection.rangeCount > 0 &&
          !selection.isCollapsed &&
          typeof value === "string"
        ) {
          document.execCommand(command, false, value);
        } else if (editorRef.current && value && typeof value === "string") {
          editorRef.current.style.fontFamily = value;
        }
      } else if (value !== undefined) {
        document.execCommand(
          command,
          false,
          typeof value === "boolean" ? undefined : value
        );
      } else {
        document.execCommand(command, false);
      }

      delayedFormatUpdate();

      const contentChangeCommands = [
        "bold",
        "italic",
        "underline",
        "insertText",
        "insertParagraph",
        "insertUnorderedList",
        "insertOrderedList",
        "createLink",
        "insertImage",
      ];

      if (contentChangeCommands.includes(command)) {
        delayedRealTimeSync(); // Update local content
      }
    },
    [delayedFormatUpdate, delayedRealTimeSync]
  );

  const { handleKeyDown, insertLink, insertImage, toggleList } = useEditor({
    editorRef,
    execCommand,
    formatUpdate: delayedFormatUpdate,
    setShowShareDialog,
    toggleComments,
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle incoming document changes
    const handleDocumentUpdate = (data: any) => {
      if (data.userId !== currentUserId && editorRef.current) {
        isReceivingUpdateRef.current = true;
        const sanitizedContent = sanitizeHtml(data.content);
        editorRef.current.innerHTML = sanitizedContent;
        setDocumentContent(sanitizedContent);
        
        setTimeout(() => {
          isReceivingUpdateRef.current = false;
        }, 100);
      }
    };

    // Handle incoming title changes
    const handleTitleUpdate = (data: any) => {
      if (data.userId !== currentUserId) {
        setDocumentTitle(data.title);
      }
    };

    // Handle cursor updates from other users
    const handleCursorUpdate = (data: any) => {
      if (data.userId !== currentUserId) {
        console.log('Cursor update from:', data.user?.name);
        setOtherCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(data.userId, {
            user: data.user,
            cursor: data.cursor,
            position: data.position,
            timestamp: data.timestamp
          });
          return newCursors;
        });
      }
    };

    socket.on('document-updated', handleDocumentUpdate);
    socket.on('title-updated', handleTitleUpdate);
    socket.on('cursor-update', handleCursorUpdate);

    return () => {
      socket.off('document-updated', handleDocumentUpdate);
      socket.off('title-updated', handleTitleUpdate);
      socket.off('cursor-update', handleCursorUpdate);
    };
  }, [socket, currentUserId]);

  // Initialize socket functions
  const initializeSocket = useCallback(() => {
    if (documentId) {
      connectSocket();
    }
  }, [connectSocket, documentId]);

  const disconnectSocketHandler = useCallback(() => {
    disconnectSocket();
  }, [disconnectSocket]);

  // Effects
  useEffect(() => {
    // Set up auto-save interval (database persistence only)
    autoSaveIntervalRef.current = setInterval(() => {
      autoSave();
    }, INTERVALS.AUTO_SYNC);

    return () => {
      handleStopTyping();
      const formatTimeout = formatUpdateTimeoutRef.current;
      if (formatTimeout) {
        clearTimeout(formatTimeout);
      }
      const typingTimeout = typingTimeoutRef.current;
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      const autoSaveInterval = autoSaveIntervalRef.current;
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [documentId, handleStopTyping, autoSave]);

  useEffect(() => {
    const handleSelectionChange = () => {
      delayedFormatUpdate();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [delayedFormatUpdate]);

  // Effect to load fetched document content into the editor
  useEffect(() => {
    if (fetchedDocument && editorRef.current) {
      const sanitizedContent = sanitizeHtml(fetchedDocument.content || "");
      editorRef.current.innerHTML = sanitizedContent;
      setDocumentContent(sanitizedContent);

      // Set document title if available
      if (fetchedDocument.title) {
        setDocumentTitle(fetchedDocument.title);
      }

      console.log("📄 Document loaded from database:", fetchedDocument.title);
    }
  }, [fetchedDocument]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header
        documentTitle={documentTitle}
        setDocumentTitle={handleTitleChange}
        isStarred={isStarred}
        setIsStarred={setIsStarred}
        connectionStatus={connectionStatus}
        connectedUsers={connectedUsers}
        isConnected={connectionStatus === 'connected'}
        disconnectSocket={disconnectSocketHandler}
        initializeSocket={initializeSocket}
        showShareDialog={showShareDialog}
        setShowShareDialog={setShowShareDialog}
        currentUserId={currentUserId}
        socketRef={socketRef}
        documentId={documentId!}
      />

      <MenuBar
        showFormatMenu={showFormatMenu}
        setShowFormatMenu={setShowFormatMenu}
        onShareDocument={() => setShowShareDialog(true)}
        onShowCollaborators={() => console.log("Show collaborators")}
        onToggleComments={toggleComments}
        onShowHistory={() => console.log("Show history")}
        onSaveDocument={() => {
          // Force immediate save to database
          syncRealTime(); // Ensure latest content is synced
          if (documentId) {
            saveDocumentMutation.mutate(
              {
                documentId: documentId,
                content: documentContent,
                title: documentTitle,
              },
              {
                onSuccess: () => {
                  setLastSaveTime(new Date());
                  hasUnsavedChangesRef.current = false;
                  console.log(
                    "💾 Manual save completed at",
                    new Date().toLocaleTimeString()
                  );
                },
                onError: (error: any) => {
                  console.error("Failed to save document:", error);
                },
              }
            );
          }
        }}
        onExportDocument={() => console.log("Export document")}
        isConnected={connectionStatus === 'connected'}
        connectedUsers={connectedUsers.length}
      />

      <Toolbar
        execCommand={execCommand}
        activeFormats={activeFormats}
        currentAlignment={currentAlignment}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        toggleList={toggleList}
        insertLink={insertLink}
        insertImage={insertImage}
        editorRef={editorRef}
        toggleComments={toggleComments}
        showComments={showComments}
      />

      <div className="flex-1 bg-gray-100 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
            <div
              ref={editorRef}
              contentEditable
              onKeyDown={handleKeyDown}
              onMouseUp={() => {
                delayedFormatUpdate();
                emitCursorPositionDelayed();
              }}
              onKeyUp={() => {
                delayedFormatUpdate();
                emitCursorPositionDelayed();
              }}
              onInput={() => {
                delayedFormatUpdate();
                emitCursorPositionDelayed();
                if (!isReceivingUpdateRef.current) {
                  handleStartTyping();
                  delayedRealTimeSync(); // Update local content
                }
              }}
              className="prose prose-lg relative min-h-[800px] max-w-none p-12 leading-relaxed text-gray-800 focus:outline-none [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}pt`,
                lineHeight: "1.6",
              }}
              suppressContentEditableWarning={true}
              role="textbox"
              aria-label="Document editor"
              aria-multiline="true"
              aria-describedby="editor-description"
            />

            {/* Cursor Overlay for showing other users' cursors */}
            <CursorOverlay
              currentUserId={currentUserId}
              connectedUsers={connectedUsers}
              cursors={otherCursors}
            />

            <div id="editor-description" className="sr-only">
              Rich text editor for creating and editing collaborative documents
            </div>
          </div>
        </div>
      </div>

      <CommentsPanel
        showComments={showComments}
        setShowComments={setShowComments}
        documentId={documentId!}
        currentUserId={currentUserId}
        currentUser={currentUser}
      />

      {/* Typing Indicator */}
      <TypingIndicator
        connectedUsers={connectedUsers}
        currentUserId={currentUserId}
      />

      <ShareDialog
        showShareDialog={showShareDialog}
        setShowShareDialog={setShowShareDialog}
        documentId={documentId!}
        currentUserId={currentUserId}
        documentTitle={documentTitle}
      />

      <StatusBar
        lastSaveTime={lastSaveTime}
        isConnected={connectionStatus === 'connected'}
        documentContent={documentContent}
      />
    </div>
  );
};
