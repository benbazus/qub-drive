// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//     Eye,
//     Download,
//     Star,
//     StarOff,
//     X,
//     Share,
//     ChevronLeft,
//     ChevronRight,
   
//     File,
    
//     Monitor,
//     Smartphone,
//     Tablet,
//     AlertCircle
// } from 'lucide-react';
// import { pdfjs } from 'react-pdf';
// import { toast } from 'sonner';

// import { Button } from '@/components/ui/button';
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';
// import { cn } from '@/lib/utils';

// import fileEndpoint from '@/api/endpoints/file.endpoint';
// import { FileItem } from '@/types/file';
// import { getFileIcon } from '@/features/dashboard/components/fileUtils';
// // import { PDFViewer } from '@/components/preview/PDFViewer';
// // import { ImageViewer } from '@/components/preview/ImageViewer';

// // Configure PDF.js worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// // File type detection utilities
// export function getFileExtension(fileName: string): string {
//     return fileName?.split('.').pop()?.toLowerCase() || '';
// }

// // Enhanced file type detection with comprehensive support and MIME type validation
// export function getFileType(fileName: string, mimeType?: string): 'pdf' | 'image' | 'text' | 'video' | 'audio' | 'unsupported' {
//     const extension = getFileExtension(fileName);
    
//     // Use MIME type as primary detection method if available
//     if (mimeType) {
//         if (mimeType === 'application/pdf') return 'pdf';
//         if (mimeType.startsWith('image/')) return 'image';
//         if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml') return 'text';
//         if (mimeType.startsWith('video/')) return 'video';
//         if (mimeType.startsWith('audio/')) return 'audio';
//     }
    
//     // Fallback to extension-based detection
//     // PDF documents
//     if (extension === 'pdf') return 'pdf';
    
//     // Image files - comprehensive list with modern formats
//     if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'avif', 'heic', 'heif'].includes(extension)) {
//         return 'image';
//     }
    
//     // Text files - expanded list for better coverage
//     if (['txt', 'md', 'markdown', 'json', 'xml', 'csv', 'log', 'yaml', 'yml', 'ini', 'cfg', 'conf', 'properties', 'env'].includes(extension)) {
//         return 'text';
//     }
    
//     // Video files
//     if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp'].includes(extension)) {
//         return 'video';
//     }
    
//     // Audio files
//     if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus'].includes(extension)) {
//         return 'audio';
//     }
    
//     return 'unsupported';
// }

// // Enhanced preview capability detection with MIME type support
// export function getPreviewCapabilities(fileName: string, mimeType?: string) {
//     const fileType = getFileType(fileName, mimeType);
//     const extension = getFileExtension(fileName);
    
//     return {
//         type: fileType,
//         canPreview: ['pdf', 'image', 'text'].includes(fileType),
//         canZoom: ['pdf', 'image'].includes(fileType),
//         canNavigatePages: fileType === 'pdf',
//         canRotate: fileType === 'image' && !['svg', 'gif'].includes(extension),
//         canFullscreen: ['pdf', 'image', 'video'].includes(fileType),
//         canPan: fileType === 'image',
//         requiresSpecialHandling: ['svg', 'gif', 'heic', 'heif'].includes(extension),
//         supportsThumbnail: ['pdf', 'image', 'video'].includes(fileType),
//         supportsKeyboardNavigation: true,
//         supportsTouch: ['pdf', 'image'].includes(fileType)
//     };
// }

// export function isPreviewable(fileName: string, mimeType?: string): boolean {
//     // Use the new API method for consistency
//     return fileEndpoint.isPreviewSupported(mimeType || null, fileName);
// }

// // Enhanced modal state management interface with comprehensive state tracking
// interface PreviewModalState {
//     // Core file state
//     currentFile: FileItem | null;
//     currentIndex: number;
//     isLoading: boolean;
//     error: string | null;
//     hasPermission: boolean;
    
//     // Viewer state
//     scale: number;
//     position: { x: number; y: number };
//     rotation: number; // For image rotation
//     currentPage: number;
//     numPages: number | null;
//     isFullscreen: boolean;
//     isDragging: boolean;
    
//     // Enhanced responsive state
//     viewportSize: 'mobile' | 'tablet' | 'desktop';
//     orientation: 'portrait' | 'landscape';
    
//     // Enhanced UI state
//     showToolbar: boolean;
//     showMetadata: boolean;
//     isCompactMode: boolean;
    
//     // Touch and interaction state
//     touchStartDistance: number | null;
//     lastTouchTime: number;
    
//     // Performance state
//     isPreloading: boolean;
//     cacheHit: boolean;
// }

// // Props interface
// interface PreviewModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     fileId: string;
//     files?: FileItem[];
//     initialIndex?: number;
// }

// // Enhanced keyboard shortcuts configuration with comprehensive navigation
// const KEYBOARD_SHORTCUTS = {
//     // Modal control
//     CLOSE: ['Escape'],
//     TOGGLE_TOOLBAR: ['t', 'T'],
//     TOGGLE_METADATA: ['i', 'I'],
//     FULLSCREEN: ['f', 'F', 'F11'],
    
//     // File navigation
//     NEXT_FILE: ['ArrowRight', 'j', 'l'],
//     PREV_FILE: ['ArrowLeft', 'k', 'h'],
//     FIRST_FILE: ['Home', 'g'],
//     LAST_FILE: ['End', 'G'],
    
//     // Page navigation (PDF)
//     NEXT_PAGE: ['ArrowDown', 'PageDown', 'Space', 'n'],
//     PREV_PAGE: ['ArrowUp', 'PageUp', 'Shift+Space', 'p'],
//     FIRST_PAGE: ['Ctrl+Home'],
//     LAST_PAGE: ['Ctrl+End'],
    
//     // Zoom controls
//     ZOOM_IN: ['+', '=', 'z'],
//     ZOOM_OUT: ['-', 'x'],
//     ZOOM_RESET: ['0', 'r'],
//     ZOOM_FIT: ['1'],
//     ZOOM_WIDTH: ['2'],
//     ZOOM_ACTUAL: ['3'],
    
//     // Image controls
//     ROTATE_CW: ['Shift+r', 'Shift+R'],
//     ROTATE_CCW: ['Shift+l', 'Shift+L'],
    
//     // Actions
//     DOWNLOAD: ['d', 'D'],
//     STAR: ['s', 'S'],
//     SHARE: ['Shift+s', 'Shift+S'],
    
//     // Pan controls (when zoomed)
//     PAN_UP: ['w', 'W'],
//     PAN_DOWN: ['s', 'S'],
//     PAN_LEFT: ['a', 'A'],
//     PAN_RIGHT: ['d', 'D']
// } as const;

// export const PreviewModal: React.FC<PreviewModalProps> = ({
//     isOpen,
//     onClose,
//     fileId,
//     files = [],
//     initialIndex = 0
// }) => {
//     const queryClient = useQueryClient();
//     const containerRef = useRef<HTMLDivElement>(null);
//     const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

//     // Enhanced modal state management with comprehensive state tracking
//     const [state, setState] = useState<PreviewModalState>({
//         // Core file state
//         currentFile: null,
//         currentIndex: initialIndex,
//         isLoading: false,
//         error: null,
//         hasPermission: true,
        
//         // Viewer state
//         scale: 1,
//         position: { x: 0, y: 0 },
//         rotation: 0,
//         currentPage: 1,
//         numPages: null,
//         isFullscreen: false,
//         isDragging: false,
        
//         // Enhanced responsive state
//         viewportSize: 'desktop',
//         orientation: 'landscape',
        
//         // Enhanced UI state
//         showToolbar: true,
//         showMetadata: false,
//         isCompactMode: false,
        
//         // Touch and interaction state
//         touchStartDistance: null,
//         lastTouchTime: 0,
        
//         // Performance state
//         isPreloading: false,
//         cacheHit: false
//     });

//     // Enhanced responsive viewport detection with breakpoint constants
//     const BREAKPOINTS = {
//         mobile: 768,
//         tablet: 1024,
//         desktop: 1440
//     } as const;

//     const detectViewportSize = useCallback(() => {
//         const width = window.innerWidth;
//         const height = window.innerHeight;
        
//         let viewportSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
//         if (width < BREAKPOINTS.mobile) {
//             viewportSize = 'mobile';
//         } else if (width < BREAKPOINTS.tablet) {
//             viewportSize = 'tablet';
//         }
        
//         const orientation: 'landscape' | 'portrait' = width > height ? 'landscape' : 'portrait';
//         const isCompactMode = viewportSize === 'mobile' || (viewportSize === 'tablet' && orientation === 'portrait');
        
//         return { viewportSize, orientation, isCompactMode };
//     }, []);

//     // Update state helper
//     const updateState = useCallback((updates: Partial<PreviewModalState>) => {
//         setState(prev => ({ ...prev, ...updates }));
//     }, []);

//     // Update viewport state on resize
//     useEffect(() => {
//         const handleResize = () => {
//             const viewport = detectViewportSize();
//             updateState(viewport);
//         };

//         // Initial detection
//         handleResize();

//         window.addEventListener('resize', handleResize);
//         return () => window.removeEventListener('resize', handleResize);
//     }, [detectViewportSize, updateState]);

//     // Reset state when modal opens/closes or file changes
//     useEffect(() => {
//         if (isOpen) {
//             updateState({
//                 currentIndex: initialIndex,
//                 scale: 1,
//                 position: { x: 0, y: 0 },
//                 rotation: 0,
//                 currentPage: 1,
//                 numPages: null,
//                 isFullscreen: false,
//                 isDragging: false,
//                 error: null,
//                 touchStartDistance: null,
//                 lastTouchTime: 0,
//                 isPreloading: false,
//                 cacheHit: false
//             });
//         }
//     }, [isOpen, fileId, initialIndex, updateState]);

//     // Get current file from files array or use fileId
//     const getCurrentFile = useCallback(() => {
//         if (files.length > 0) {
//             return files[state.currentIndex] || null;
//         }
//         return state.currentFile;
//     }, [files, state.currentIndex, state.currentFile]);

//     const currentFile = getCurrentFile();
//     const currentFileId = currentFile?.id || fileId;

//     // File details query
//     const { data: fileDetails, isLoading: isDetailsLoading } = useQuery<FileItem>({
//         queryKey: ['fileDetails', currentFileId],
//         queryFn: () => fileEndpoint.getFileDetails(currentFileId),
//         enabled: isOpen && !!currentFileId,
//         staleTime: 5 * 60 * 1000,
//         gcTime: 10 * 60 * 1000,
//     });

//     // Preview information query using new API methods
//     const previewQuery = useQuery({
//         queryKey: ['filePreview', currentFileId],
//         queryFn: async () => {
//             updateState({ isLoading: true, cacheHit: false });
//             try {
//                 // Check if file is previewable using the new API method
//                 const fileName = fileDetails?.fileName || currentFile?.fileName || '';
//                 const mimeType = fileDetails?.mimeType || currentFile?.mimeType;
                
//                 if (!fileEndpoint.isPreviewSupported(mimeType, fileName)) {
//                     throw new Error('File format not supported for preview');
//                 }

//                 const preview = await fileEndpoint.getPreview(currentFileId);
//                 updateState({ isLoading: false, cacheHit: true });
//                 return preview;
//             } catch (error) {
//                 updateState({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load preview' });
//                 throw error;
//             }
//         },
//         enabled: isOpen && !!currentFileId && !!fileDetails,
//         staleTime: 5 * 60 * 1000,
//         retry: 2,
//     });

//     // Thumbnail query using new API method
//     const thumbnailQuery = useQuery({
//         queryKey: ['fileThumbnail', currentFileId],
//         queryFn: () => fileEndpoint.getPreviewThumbnail(currentFileId, {
//             width: 200,
//             height: 200,
//             quality: 80
//         }),
//         enabled: isOpen && !!currentFileId && !!fileDetails,
//         staleTime: 10 * 60 * 1000, // Thumbnails can be cached longer
//         retry: 1,
//     });

//     // File content query for preview with enhanced type detection
//     const contentQuery = useQuery({
//         queryKey: ['fileContent', currentFileId],
//         queryFn: async () => {
//             try {
//                 const content = await fileEndpoint.getPreviewContent(currentFileId);
//                 return content;
//             } catch (error) {
//                 // Fallback to old method if new preview method fails
//                 return await fileEndpoint.getFileContent(currentFileId);
//             }
//         },
//         enabled: isOpen && !!currentFileId && isPreviewable(
//             fileDetails?.fileName || currentFile?.fileName || '', 
//             fileDetails?.mimeType || currentFile?.mimeType
//         ),
//         staleTime: 5 * 60 * 1000,
//         retry: 2,
//     });

//     // Star/unstar mutation
//     const starMutation = useMutation({
//         mutationFn: () => fileEndpoint.toggleStar(currentFileId),
//         onSuccess: (data: { starred: boolean }) => {
//             queryClient.setQueryData(['fileDetails', currentFileId], (old: FileItem | undefined) =>
//                 old ? { ...old, starred: data.starred } : old
//             );
//             toast.success(data.starred ? 'File starred ⭐' : 'File unstarred');
//         },
//         onError: (err: Error) => {
//             toast.error('Failed to update star status', {
//                 description: err.message
//             });
//         },
//     });

//     // Download mutation
//     const downloadMutation = useMutation({
//         mutationFn: () => fileEndpoint.downloadFile(currentFileId),
//         onSuccess: () => {
//             toast.success('Download started 📥');
//         },
//         onError: (err: Error) => {
//             toast.error('Download failed', {
//                 description: err.message
//             });
//         },
//     });

//     // Navigation functions
//     const canNavigateNext = useCallback(() => {
//         return files.length > 0 && state.currentIndex < files.length - 1;
//     }, [files.length, state.currentIndex]);

//     const canNavigatePrev = useCallback(() => {
//         return files.length > 0 && state.currentIndex > 0;
//     }, [files.length, state.currentIndex]);

//     const navigateNext = useCallback(() => {
//         if (canNavigateNext()) {
//             updateState({ 
//                 currentIndex: state.currentIndex + 1,
//                 scale: 1,
//                 position: { x: 0, y: 0 },
//                 rotation: 0,
//                 currentPage: 1,
//                 error: null
//             });
//         }
//     }, [canNavigateNext, state.currentIndex, updateState]);

//     const navigatePrev = useCallback(() => {
//         if (canNavigatePrev()) {
//             updateState({ 
//                 currentIndex: state.currentIndex - 1,
//                 scale: 1,
//                 position: { x: 0, y: 0 },
//                 rotation: 0,
//                 currentPage: 1,
//                 error: null
//             });
//         }
//     }, [canNavigatePrev, state.currentIndex, updateState]);

//     const navigateToFirst = useCallback(() => {
//         if (files.length > 0 && state.currentIndex > 0) {
//             updateState({ 
//                 currentIndex: 0,
//                 scale: 1,
//                 position: { x: 0, y: 0 },
//                 rotation: 0,
//                 currentPage: 1,
//                 error: null
//             });
//         }
//     }, [files.length, state.currentIndex, updateState]);

//     const navigateToLast = useCallback(() => {
//         if (files.length > 0 && state.currentIndex < files.length - 1) {
//             updateState({ 
//                 currentIndex: files.length - 1,
//                 scale: 1,
//                 position: { x: 0, y: 0 },
//                 rotation: 0,
//                 currentPage: 1,
//                 error: null
//             });
//         }
//     }, [files.length, state.currentIndex, updateState]);

//     // Enhanced PDF navigation with bounds checking
//     const nextPage = useCallback(() => {
//         if (state.numPages && state.currentPage < state.numPages) {
//             updateState({ currentPage: state.currentPage + 1 });
//         }
//     }, [state.numPages, state.currentPage, updateState]);

//     const prevPage = useCallback(() => {
//         if (state.currentPage > 1) {
//             updateState({ currentPage: state.currentPage - 1 });
//         }
//     }, [state.currentPage, updateState]);

//     const goToFirstPage = useCallback(() => {
//         if (state.currentPage > 1) {
//             updateState({ currentPage: 1 });
//         }
//     }, [state.currentPage, updateState]);

//     const goToLastPage = useCallback(() => {
//         if (state.numPages && state.currentPage < state.numPages) {
//             updateState({ currentPage: state.numPages });
//         }
//     }, [state.numPages, state.currentPage, updateState]);

//     const goToPage = useCallback((page: number) => {
//         if (state.numPages && page >= 1 && page <= state.numPages) {
//             updateState({ currentPage: page });
//         }
//     }, [state.numPages, updateState]);

//     // Zoom functions
//     const zoomIn = useCallback(() => {
//         updateState({ scale: Math.min(state.scale * 1.2, 3) });
//     }, [state.scale, updateState]);

//     const zoomOut = useCallback(() => {
//         updateState({ scale: Math.max(state.scale / 1.2, 0.5) });
//     }, [state.scale, updateState]);

//     const resetZoom = useCallback(() => {
//         updateState({ scale: 1, position: { x: 0, y: 0 } });
//     }, [updateState]);

//     // Enhanced zoom functions
//     const fitToScreen = useCallback(() => {
//         // Calculate optimal scale to fit content in viewport
//         const containerWidth = containerRef.current?.clientWidth || 800;
//         const containerHeight = containerRef.current?.clientHeight || 600;
//         const optimalScale = Math.min(containerWidth / 800, containerHeight / 600, 1);
//         updateState({ scale: optimalScale, position: { x: 0, y: 0 } });
//     }, [updateState]);

//     const fitToWidth = useCallback(() => {
//         // Calculate scale to fit width
//         const containerWidth = containerRef.current?.clientWidth || 800;
//         const optimalScale = Math.min(containerWidth / 800, 1);
//         updateState({ scale: optimalScale, position: { x: 0, y: 0 } });
//     }, [updateState]);

//     // Enhanced pan controls for keyboard navigation
//     const panUp = useCallback(() => {
//         if (state.scale > 1) {
//             updateState({ position: { x: state.position.x, y: state.position.y + 50 } });
//         }
//     }, [state.scale, state.position, updateState]);

//     const panDown = useCallback(() => {
//         if (state.scale > 1) {
//             updateState({ position: { x: state.position.x, y: state.position.y - 50 } });
//         }
//     }, [state.scale, state.position, updateState]);

//     const panLeft = useCallback(() => {
//         if (state.scale > 1) {
//             updateState({ position: { x: state.position.x + 50, y: state.position.y } });
//         }
//     }, [state.scale, state.position, updateState]);

//     const panRight = useCallback(() => {
//         if (state.scale > 1) {
//             updateState({ position: { x: state.position.x - 50, y: state.position.y } });
//         }
//     }, [state.scale, state.position, updateState]);

//     // UI state toggles
//     const toggleMetadata = useCallback(() => {
//         updateState({ showMetadata: !state.showMetadata });
//     }, [state.showMetadata, updateState]);

//     const toggleToolbar = useCallback(() => {
//         updateState({ showToolbar: !state.showToolbar });
//     }, [state.showToolbar, updateState]);

//     // Enhanced image rotation with proper state management
//     const rotateImageCW = useCallback(() => {
//         updateState({ rotation: (state.rotation + 90) % 360 });
//     }, [state.rotation, updateState]);

//     const rotateImageCCW = useCallback(() => {
//         updateState({ rotation: (state.rotation - 90 + 360) % 360 });
//     }, [state.rotation, updateState]);

//     const resetRotation = useCallback(() => {
//         updateState({ rotation: 0 });
//     }, [updateState]);

//     // Fullscreen toggle
//     const toggleFullscreen = useCallback(() => {
//         updateState({ isFullscreen: !state.isFullscreen });
//     }, [state.isFullscreen, updateState]);

//     // Action handlers
//     const handleToggleStar = useCallback(() => {
//         starMutation.mutate();
//     }, [starMutation]);

//     const handleDownload = useCallback(() => {
//         downloadMutation.mutate();
//     }, [downloadMutation]);

//     const handleShare = useCallback(() => {
//         if (navigator.share) {
//             navigator.share({
//                 title: fileDetails?.fileName || currentFile?.fileName,
//                 text: `Check out this file: ${fileDetails?.fileName || currentFile?.fileName}`,
//             }).catch(() => {
//                 toast.info('Share not supported on this device');
//             });
//         } else {
//             toast.info('Share functionality coming soon');
//         }
//     }, [fileDetails?.fileName, currentFile?.fileName]);

//     // Mouse drag handling for images
//     const handleMouseDown = useCallback((e: React.MouseEvent) => {
//         if (getFileType(fileDetails?.fileName || currentFile?.fileName || '') === 'image' && state.scale > 1) {
//             setDragStart({ x: e.clientX - state.position.x, y: e.clientY - state.position.y });
//             updateState({ isDragging: true });
//         }
//     }, [fileDetails?.fileName, currentFile?.fileName, state.scale, state.position, updateState]);

//     const handleMouseMove = useCallback((e: React.MouseEvent) => {
//         if (state.isDragging && dragStart) {
//             updateState({
//                 position: {
//                     x: e.clientX - dragStart.x,
//                     y: e.clientY - dragStart.y
//                 }
//             });
//         }
//     }, [state.isDragging, dragStart, updateState]);

//     const handleMouseUp = useCallback(() => {
//         setDragStart(null);
//         updateState({ isDragging: false });
//     }, [updateState]);

//     // Enhanced touch event handlers for mobile support
//     const handleTouchStart = useCallback((e: React.TouchEvent) => {
//         const touches = e.touches;
//         const currentTime = Date.now();
        
//         if (touches.length === 1) {
//             // Single touch - start drag
//             const touch = touches[0];
//             setDragStart({ x: touch.clientX - state.position.x, y: touch.clientY - state.position.y });
//             updateState({ isDragging: true, lastTouchTime: currentTime });
//         } else if (touches.length === 2) {
//             // Two finger touch - start pinch zoom
//             const touch1 = touches[0];
//             const touch2 = touches[1];
//             const distance = Math.sqrt(
//                 Math.pow(touch2.clientX - touch1.clientX, 2) + 
//                 Math.pow(touch2.clientY - touch1.clientY, 2)
//             );
//             updateState({ touchStartDistance: distance });
//         }
//     }, [state.position, updateState]);

//     const handleTouchMove = useCallback((e: React.TouchEvent) => {
//         e.preventDefault(); // Prevent scrolling
//         const touches = e.touches;
        
//         if (touches.length === 1 && state.isDragging && dragStart) {
//             // Single touch drag
//             const touch = touches[0];
//             updateState({
//                 position: {
//                     x: touch.clientX - dragStart.x,
//                     y: touch.clientY - dragStart.y
//                 }
//             });
//         } else if (touches.length === 2 && state.touchStartDistance) {
//             // Pinch zoom
//             const touch1 = touches[0];
//             const touch2 = touches[1];
//             const distance = Math.sqrt(
//                 Math.pow(touch2.clientX - touch1.clientX, 2) + 
//                 Math.pow(touch2.clientY - touch1.clientY, 2)
//             );
            
//             const scale = Math.max(0.5, Math.min(3, state.scale * (distance / state.touchStartDistance)));
//             updateState({ scale, touchStartDistance: distance });
//         }
//     }, [state.isDragging, state.touchStartDistance, state.scale, dragStart, updateState]);

//     const handleTouchEnd = useCallback((e: React.TouchEvent) => {
//         const currentTime = Date.now();
//         const timeDiff = currentTime - state.lastTouchTime;
        
//         // Double tap to zoom
//         if (e.touches.length === 0 && timeDiff < 300 && !state.isDragging) {
//             if (state.scale === 1) {
//                 zoomIn();
//             } else {
//                 resetZoom();
//             }
//         }
        
//         setDragStart(null);
//         updateState({ 
//             isDragging: false, 
//             touchStartDistance: null,
//             lastTouchTime: currentTime
//         });
//     }, [state.lastTouchTime, state.isDragging, state.scale, zoomIn, resetZoom, updateState]);

//     // Enhanced keyboard event handlers with comprehensive shortcuts
//     useEffect(() => {
//         const handleKeyDown = (e: KeyboardEvent) => {
//             if (!isOpen) return;

//             const key = e.key;
//             const keyWithModifiers = `${e.shiftKey ? 'Shift+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${key}`;
//             const capabilities = getPreviewCapabilities(
//                 fileDetails?.fileName || currentFile?.fileName || '',
//                 fileDetails?.mimeType || currentFile?.mimeType
//             );

//             // Prevent default for handled shortcuts
//             const isHandledShortcut = Object.values(KEYBOARD_SHORTCUTS).some(shortcuts => 
//                 shortcuts.includes(key) || shortcuts.includes(keyWithModifiers)
//             );

//             if (isHandledShortcut) {
//                 e.preventDefault();
//             }

//             // Modal control
//             if (KEYBOARD_SHORTCUTS.CLOSE.includes(key)) {
//                 onClose();
//                 return;
//             }

//             if (KEYBOARD_SHORTCUTS.TOGGLE_TOOLBAR.includes(key)) {
//                 toggleToolbar();
//                 return;
//             }

//             if (KEYBOARD_SHORTCUTS.TOGGLE_METADATA.includes(key)) {
//                 toggleMetadata();
//                 return;
//             }

//             if (capabilities.canFullscreen && KEYBOARD_SHORTCUTS.FULLSCREEN.includes(key)) {
//                 toggleFullscreen();
//                 return;
//             }

//             // File navigation
//             if (KEYBOARD_SHORTCUTS.NEXT_FILE.includes(key)) {
//                 navigateNext();
//                 return;
//             }

//             if (KEYBOARD_SHORTCUTS.PREV_FILE.includes(key)) {
//                 navigatePrev();
//                 return;
//             }

//             if (KEYBOARD_SHORTCUTS.FIRST_FILE.includes(key)) {
//                 navigateToFirst();
//                 return;
//             }

//             if (KEYBOARD_SHORTCUTS.LAST_FILE.includes(key)) {
//                 navigateToLast();
//                 return;
//             }

//             // Page navigation for PDFs
//             if (capabilities.canNavigatePages) {
//                 if (KEYBOARD_SHORTCUTS.NEXT_PAGE.includes(key) || KEYBOARD_SHORTCUTS.NEXT_PAGE.includes(keyWithModifiers)) {
//                     nextPage();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.PREV_PAGE.includes(key) || KEYBOARD_SHORTCUTS.PREV_PAGE.includes(keyWithModifiers)) {
//                     prevPage();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.FIRST_PAGE.includes(keyWithModifiers)) {
//                     goToFirstPage();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.LAST_PAGE.includes(keyWithModifiers)) {
//                     goToLastPage();
//                     return;
//                 }
//             }

//             // Zoom controls for zoomable content
//             if (capabilities.canZoom) {
//                 if (KEYBOARD_SHORTCUTS.ZOOM_IN.includes(key)) {
//                     zoomIn();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.ZOOM_OUT.includes(key)) {
//                     zoomOut();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.ZOOM_RESET.includes(key)) {
//                     resetZoom();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.ZOOM_FIT.includes(key)) {
//                     fitToScreen();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.ZOOM_WIDTH.includes(key)) {
//                     fitToWidth();
//                     return;
//                 }
//             }

//             // Image rotation
//             // if (capabilities.canRotate) {
//             //     if (KEYBOARD_SHORTCUTS.ROTATE_CW.includes(keyWithModifiers)) {
//             //         rotateImageCW();
//             //         return;
//             //     }

//             //     if (KEYBOARD_SHORTCUTS.ROTATE_CCW.includes(keyWithModifiers)) {
//             //         rotateImageCCW();
//             //         return;
//             //     }
//             // }

//             // Pan controls (when zoomed)
//             if (capabilities.canPan && state.scale > 1) {
//                 if (KEYBOARD_SHORTCUTS.PAN_UP.includes(key)) {
//                     panUp();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.PAN_DOWN.includes(key)) {
//                     panDown();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.PAN_LEFT.includes(key)) {
//                     panLeft();
//                     return;
//                 }

//                 if (KEYBOARD_SHORTCUTS.PAN_RIGHT.includes(key)) {
//                     panRight();
//                     return;
//                 }
//             }

//             // Action shortcuts
//             // if (KEYBOARD_SHORTCUTS.DOWNLOAD.includes(key)) {
//             //     handleDownload();
//             //     return;
//             // }

//             // if (KEYBOARD_SHORTCUTS.STAR.includes(key)) {
//             //     handleToggleStar();
//             //     return;
//             // }

//             // if (KEYBOARD_SHORTCUTS.SHARE.includes(keyWithModifiers)) {
//             //     handleShare();
//             //     return;
//             // }
//         };

//         document.addEventListener('keydown', handleKeyDown);
//         return () => document.removeEventListener('keydown', handleKeyDown);
//     }, [
//         isOpen,
//         fileDetails?.fileName,
//         fileDetails?.mimeType,
//         currentFile?.fileName,
//         currentFile?.mimeType,
//         state.scale,
//         onClose,
//         toggleToolbar,
//         toggleMetadata,
//         toggleFullscreen,
//         navigateNext,
//         navigatePrev,
//         navigateToFirst,
//         navigateToLast,
//         nextPage,
//         prevPage,
//         goToFirstPage,
//         goToLastPage,
//         zoomIn,
//         zoomOut,
//         resetZoom,
//         fitToScreen,
//         fitToWidth,
//         rotateImageCW,
//         rotateImageCCW,
//         panUp,
//         panDown,
//         panLeft,
//         panRight,
//         handleDownload,
//         handleToggleStar,
//         handleShare
//     ]);

//     // Format date utility
//     const formatDate = useCallback((date: string | undefined) => {
//         if (!date) return 'Unknown';
//         return new Date(date).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//         });
//     }, []);

//     // Enhanced error display component
//     const renderErrorState = (error: string, onRetry?: () => void) => (
//         <div className="flex flex-col items-center justify-center space-y-6 py-12">
//             <div className="relative">
//                 <div className="h-20 w-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
//                     <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
//                 </div>
//             </div>
//             <div className="space-y-3 text-center max-w-md">
//                 <h3 className="text-xl font-semibold text-foreground">Preview Error</h3>
//                 <p className="text-muted-foreground">{error}</p>
//                 {onRetry && (
//                     <Button onClick={onRetry} variant="outline" className="mt-4">
//                         Try Again
//                     </Button>
//                 )}
//             </div>
//         </div>
//     );

//     // Render loading skeleton
//     const renderPreviewSkeleton = () => (
//         <div className="flex flex-col items-center justify-center space-y-6 py-12">
//             <div className="relative">
//                 <Skeleton className="h-20 w-20 rounded-2xl" />
//                 <div className="absolute -bottom-2 -right-2">
//                     <Skeleton className="h-6 w-6 rounded-full" />
//                 </div>
//             </div>
//             <div className="space-y-3 text-center">
//                 <Skeleton className="h-6 w-64" />
//                 <Skeleton className="h-4 w-48" />
//                 <div className="flex gap-2 justify-center">
//                     <Skeleton className="h-6 w-16 rounded-full" />
//                     <Skeleton className="h-6 w-12 rounded-full" />
//                     <Skeleton className="h-6 w-20 rounded-full" />
//                 </div>
//             </div>
//         </div>
//     );

//     // Render preview content based on file type
//     const renderPreviewContent = () => {
//         if (contentQuery.isLoading) {
//             return renderPreviewSkeleton();
//         }

//         if (contentQuery.error || !currentFile) {
//             return renderErrorState(
//                 contentQuery.error?.message || 'Unable to preview this file',
//                 () => contentQuery.refetch()
//             );
//         }

//         const fileName = fileDetails?.fileName || currentFile?.fileName || '';
//         const mimeType = fileDetails?.mimeType || currentFile?.mimeType;
//         const fileType = getFileType(fileName, mimeType);

//         if (!isPreviewable(fileName, mimeType)) {
//             return (
//                 <div className="flex flex-col items-center justify-center space-y-8 text-center py-12">
//                     <div className="relative group">
//                         <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-900/50 shadow-lg transition-all duration-300 group-hover:scale-105">
//                             {getFileIcon(currentFile?.fileType!) || <File className="h-12 w-12 text-blue-600 dark:text-blue-400" />}
//                         </div>
//                         <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
//                             <Eye className="h-4 w-4 text-white" />
//                         </div>
//                     </div>
//                     <div className="space-y-4 max-w-md">
//                         <h3 className="text-2xl font-bold text-foreground tracking-tight">
//                             {fileName}
//                         </h3>
//                         <p className="text-muted-foreground text-lg">
//                             Preview not available for this file type
//                         </p>
//                         <div className="flex flex-wrap items-center justify-center gap-2">
//                             <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
//                                 {currentFile?.fileSize}
//                             </Badge>
//                             <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
//                                 {getFileExtension(fileName).toUpperCase()}
//                             </Badge>
//                         </div>
//                     </div>
//                     <Button
//                         onClick={handleDownload}
//                         disabled={downloadMutation.isPending}
//                         size="lg"
//                         className="min-w-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
//                     >
//                         <Download className="mr-2 h-5 w-5" />
//                         {downloadMutation.isPending ? 'Downloading...' : 'Download File'}
//                     </Button>
//                 </div>
//             );
//         }

//         // Route to appropriate viewer based on file type
//         switch (fileType) {
//             // case 'image':
//             //     return renderImageViewer();
//             // case 'pdf':
//             //     return renderPDFViewer();
//             case 'text':
//                 return renderTextViewer();
//             default:
//                 return null;
//         }
//     };

//     // Image viewer component using the dedicated ImageViewer component
//     // const renderImageViewer = () => {
//     //     return (
//     //         <ImageViewer
//     //             imageUrl={contentQuery.data}
//     //             fileName={fileDetails?.fileName || currentFile?.fileName || ''}
//     //             onLoadSuccess={() => {
//     //                 // Image loaded successfully
//     //                 updateState({ isLoading: false, error: null });
//     //             }}
//     //             onLoadError={(error) => {
//     //                 toast.error('Failed to load image');
//     //                 updateState({ error: error.message || 'Failed to load image' });
//     //             }}
//     //             isFullscreen={state.isFullscreen}
//     //             onToggleFullscreen={toggleFullscreen}
//     //         />
//     //     );
//     // };

//     // PDF viewer component using the dedicated PDFViewer component
//     // const renderPDFViewer = () => {
//     //     return (
//     //         <PDFViewer
//     //             fileUrl={contentQuery.data}
//     //             fileName={fileDetails?.fileName || currentFile?.fileName || ''}
//     //             onLoadSuccess={({ numPages }) => updateState({ numPages })}
//     //             onLoadError={(error) => {
//     //                 toast.error('Failed to load PDF');
//     //                 updateState({ error: error.message || 'Failed to load PDF' });
//     //             }}
//     //             isFullscreen={state.isFullscreen}
//     //             onToggleFullscreen={toggleFullscreen}
//     //             className={cn(
//     //                 "transition-all duration-300",
//     //                 state.isFullscreen && "fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
//     //             )}
//     //         />
//     //     );
//     // };

//     // Text viewer component
//     const renderTextViewer = () => {
//         const extension = getFileExtension(fileDetails?.fileName || currentFile?.fileName || '');
        
//         return (
//             <div className="w-full max-w-4xl">
//                 <div className="relative group">
//                     <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                         <Badge variant="secondary" className="font-mono text-xs">
//                             {extension === 'md' ? 'Markdown' : 'Plain Text'}
//                         </Badge>
//                     </div>
//                     <pre className="max-h-[65vh] w-full overflow-auto rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 p-8 text-sm font-mono leading-relaxed shadow-inner border">
//                         {contentQuery.data}
//                     </pre>
//                 </div>
//             </div>
//         );
//     };

//     const displayFile = fileDetails || currentFile;

//     if (!displayFile && !fileId) {
//         return null;
//     }

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent 
//                 className={cn(
//                     "p-0 overflow-hidden transition-all duration-300 border-0 shadow-2xl",
//                     // Fullscreen mode
//                     state.isFullscreen && "fixed inset-0 max-w-none max-h-none w-screen h-screen rounded-none bg-black/95 backdrop-blur-sm",
//                     // Responsive sizing based on viewport
//                     !state.isFullscreen && state.viewportSize === 'mobile' && "max-w-[100vw] max-h-[100vh] w-full h-full rounded-none bg-background",
//                     !state.isFullscreen && state.viewportSize === 'tablet' && state.orientation === 'portrait' && "max-w-[95vw] max-h-[95vh] w-[95vw] rounded-lg bg-gradient-to-br from-background via-background to-muted/10",
//                     !state.isFullscreen && state.viewportSize === 'tablet' && state.orientation === 'landscape' && "max-w-[90vw] max-h-[90vh] w-[90vw] rounded-lg bg-gradient-to-br from-background via-background to-muted/10",
//                     !state.isFullscreen && state.viewportSize === 'desktop' && "max-w-7xl max-h-[95vh] w-[85vw] rounded-xl bg-gradient-to-br from-background via-background to-muted/20"
//                 )}
//                 showCloseButton={false}
//             >
//                 {/* Enhanced Responsive Header */}
//                 {(!state.isFullscreen || state.showToolbar) && (
//                     <DialogHeader className={cn(
//                         "border-b bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-sm transition-all duration-300",
//                         state.isCompactMode ? "p-3" : "p-4 sm:p-6 pb-4",
//                         state.isFullscreen && "absolute top-0 left-0 right-0 z-10 bg-black/80"
//                     )}>
//                         <div className="flex items-center justify-between">
//                             <DialogTitle className={cn(
//                                 "flex items-center min-w-0 flex-1",
//                                 state.isCompactMode ? "space-x-2" : "space-x-3 sm:space-x-4"
//                             )}>
//                                 {/* Responsive icon */}
//                                 <div className={cn(
//                                     "flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0",
//                                     state.isCompactMode ? "h-6 w-6" : "h-8 w-8 sm:h-10 sm:w-10"
//                                 )}>
//                                     <Eye className={cn(
//                                         "text-white",
//                                         state.isCompactMode ? "h-3 w-3" : "h-4 w-4 sm:h-5 sm:w-5"
//                                     )} />
//                                 </div>
                                
//                                 {/* File info */}
//                                 <div className="min-w-0 flex-1">
//                                     <h2 className={cn(
//                                         "truncate font-bold tracking-tight",
//                                         state.isCompactMode ? "text-sm" : "text-lg sm:text-xl",
//                                         state.isFullscreen && "text-white"
//                                     )}>
//                                         {displayFile?.fileName || 'Loading...'}
//                                     </h2>
                                    
//                                     {/* Show metadata conditionally */}
//                                     {(!state.isCompactMode || state.showMetadata) && (
//                                         <p className={cn(
//                                             "text-muted-foreground mt-1",
//                                             state.isCompactMode ? "text-xs" : "text-xs sm:text-sm",
//                                             state.isFullscreen && "text-gray-300"
//                                         )}>
//                                             {getFileExtension(displayFile?.fileName || '').toUpperCase()} • {displayFile?.fileSize || '0'}
//                                             {files.length > 0 && (
//                                                 <span className="ml-2">
//                                                     ({state.currentIndex + 1} of {files.length})
//                                                 </span>
//                                             )}
//                                         </p>
//                                     )}
//                                 </div>
//                             </DialogTitle>

//                             {/* Enhanced Responsive Toolbar */}
//                             <div className={cn(
//                                 "flex items-center flex-shrink-0",
//                                 state.isCompactMode ? "space-x-0.5" : "space-x-1"
//                             )}>
//                                 {/* File Navigation - Show on all sizes if multiple files */}
//                                 {files.length > 1 && (
//                                     <>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={navigatePrev}
//                                             disabled={!canNavigatePrev()}
//                                             className={cn(
//                                                 "p-0 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 hover:scale-105",
//                                                 state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                                 state.isFullscreen && "hover:bg-white/10 text-white"
//                                             )}
//                                             title="Previous file (←)"
//                                         >
//                                             <ChevronLeft className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                         </Button>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={navigateNext}
//                                             disabled={!canNavigateNext()}
//                                             className={cn(
//                                                 "p-0 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 hover:scale-105",
//                                                 state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                                 state.isFullscreen && "hover:bg-white/10 text-white"
//                                             )}
//                                             title="Next file (→)"
//                                         >
//                                             <ChevronRight className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                         </Button>
//                                         {!state.isCompactMode && <div className="w-px h-4 bg-border mx-1" />}
//                                     </>
//                                 )}

//                                 {/* Primary Actions - Always visible */}
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={handleDownload}
//                                     disabled={downloadMutation.isPending}
//                                     className={cn(
//                                         "p-0 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 hover:scale-105",
//                                         state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                         state.isFullscreen && "hover:bg-white/10 text-white"
//                                     )}
//                                     title="Download file (D)"
//                                 >
//                                     <Download className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                 </Button>

//                                 {/* Secondary Actions - Hide on compact mode unless essential */}
//                                 {(!state.isCompactMode || state.viewportSize !== 'mobile') && (
//                                     <>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={handleToggleStar}
//                                             disabled={starMutation.isPending}
//                                             className={cn(
//                                                 "p-0 hover:bg-yellow-50 dark:hover:bg-yellow-950/50 transition-all duration-200 hover:scale-105",
//                                                 state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                                 state.isFullscreen && "hover:bg-white/10 text-white"
//                                             )}
//                                             title={displayFile?.starred ? 'Unstar file (S)' : 'Star file (S)'}
//                                         >
//                                             {displayFile?.starred ? (
//                                                 <Star className={cn(
//                                                     "fill-yellow-400 text-yellow-400",
//                                                     state.isCompactMode ? "h-3 w-3" : "h-4 w-4"
//                                                 )} />
//                                             ) : (
//                                                 <StarOff className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                             )}
//                                         </Button>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={handleShare}
//                                             className={cn(
//                                                 "p-0 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all duration-200 hover:scale-105",
//                                                 state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                                 state.isFullscreen && "hover:bg-white/10 text-white"
//                                             )}
//                                             title="Share file (Shift+S)"
//                                         >
//                                             <Share className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                         </Button>
//                                     </>
//                                 )}

//                                 {/* Viewport size indicator (development helper) */}
//                                 {process.env.NODE_ENV === 'development' && !state.isCompactMode && (
//                                     <div className="flex items-center space-x-1 ml-2 px-2 py-1 bg-muted/50 rounded text-xs">
//                                         {state.viewportSize === 'mobile' && <Smartphone className="h-3 w-3" />}
//                                         {state.viewportSize === 'tablet' && <Tablet className="h-3 w-3" />}
//                                         {state.viewportSize === 'desktop' && <Monitor className="h-3 w-3" />}
//                                         <span>{state.viewportSize}</span>
//                                     </div>
//                                 )}

//                                 {/* Close button - Always visible */}
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={onClose}
//                                     className={cn(
//                                         "p-0 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-105",
//                                         state.isCompactMode ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
//                                         state.isFullscreen && "hover:bg-white/10 text-white"
//                                     )}
//                                     title="Close dialog (Esc)"
//                                 >
//                                     <X className={cn(state.isCompactMode ? "h-3 w-3" : "h-4 w-4")} />
//                                 </Button>
//                             </div>
//                         </div>
//                     </DialogHeader>
//                 )}

//                 {/* Enhanced Responsive Preview Area */}
//                 <div 
//                     ref={containerRef}
//                     className={cn(
//                         "flex-1 transition-all duration-300",
//                         // Background styling based on mode
//                         state.isFullscreen ? "bg-black/90" : "bg-gradient-to-br from-muted/20 to-muted/40",
//                         // Responsive padding
//                         state.isFullscreen ? "p-2" : state.isCompactMode ? "p-2" : "p-4 sm:p-6"
//                     )}
//                 >
//                     <div className={cn(
//                         "flex items-center justify-center transition-all duration-300",
//                         // Container styling based on mode
//                         state.isFullscreen 
//                             ? "min-h-[calc(100vh-4rem)] bg-transparent" 
//                             : "rounded-2xl bg-background/50 backdrop-blur-sm border shadow-inner",
//                         // Responsive sizing and padding
//                         state.isFullscreen 
//                             ? "p-2" 
//                             : state.isCompactMode 
//                                 ? "min-h-[300px] p-2" 
//                                 : "min-h-[400px] sm:min-h-[500px] p-4 sm:p-8"
//                     )}>
//                         {renderPreviewContent()}
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 {!state.isFullscreen && (
//                     <div className="border-t bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-sm p-4 sm:p-6">
//                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                             <div className="flex items-center space-x-3">
//                                 <Button
//                                     onClick={handleDownload}
//                                     disabled={downloadMutation.isPending}
//                                     size="lg"
//                                     className="min-w-32 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//                                 >
//                                     <Download className="mr-2 h-4 w-4" />
//                                     {downloadMutation.isPending ? 'Downloading...' : 'Download'}
//                                 </Button>
//                                 <Button
//                                     variant="outline"
//                                     onClick={handleShare}
//                                     size="lg"
//                                     className="min-w-24 hover:scale-105 transition-all duration-200"
//                                 >
//                                     <Share className="mr-2 h-4 w-4" />
//                                     Share
//                                 </Button>
//                             </div>

//                             <div className="text-right text-sm text-muted-foreground space-y-1">
//                                 <div className="flex items-center space-x-2">
//                                     <span>Last modified:</span>
//                                     {isDetailsLoading ? (
//                                         <Skeleton className="inline-block h-4 w-32" />
//                                     ) : (
//                                         <span className="font-medium">
//                                             {formatDate(displayFile?.updatedAt)}
//                                         </span>
//                                     )}
//                                 </div>
//                                 {displayFile?.starred && (
//                                     <div className="flex items-center justify-end space-x-1">
//                                         <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                                         <span className="text-xs">Starred</span>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default PreviewModal;