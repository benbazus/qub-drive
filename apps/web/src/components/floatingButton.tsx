// import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
// import { Upload, X, CheckCircle, AlertCircle, File, Minimize2, Maximize2 } from 'lucide-react';

// // Interfaces
// interface FileWithProgress {
//     file: File;
//     progress: number;
//     status: 'uploading' | 'success' | 'error' | 'pending';
//     id: string;
//     error?: string;
// }

// interface FileUploadOptions {
//     onFileUpload?: (files: File[]) => Promise<void>;
//     acceptedTypes?: string[];
//     maxFileSize?: number;
//     maxFiles?: number;
//     multiple?: boolean;
//     onClose?: () => void;
//     disabled?: boolean;
//     title?: string;
// }

// interface FileUploadContextType {
//     showUpload: (options?: FileUploadOptions) => void;
//     hideUpload: () => void;
//     isVisible: boolean;
// }

// // Constants
// const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// const DEFAULT_MAX_FILES = 5;
// const DEFAULT_ACCEPTED_TYPES = ['image/*', 'application/pdf', '.doc', '.docx'];
// const UPLOAD_RETRY_ATTEMPTS = 3;
// const UPLOAD_TIMEOUT = 30000; // 30 seconds

// // Create Context
// const FileUploadContext = createContext<FileUploadContextType | null>(null);

// // Custom Hook
// export const useFileUpload = (): FileUploadContextType => {
//     const context = useContext(FileUploadContext);
//     if (!context) {
//         throw new Error('useFileUpload must be used within a FileUploadProvider');
//     }
//     return context;
// };

// // Utility functions
// const generateId = (): string => {
//     return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
// };

// const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
// };

// const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
//     if (acceptedTypes.length === 0) return true;

//     return acceptedTypes.some((type) => {
//         if (type.startsWith('.')) {
//             return file.name.toLowerCase().endsWith(type.toLowerCase());
//         }
//         if (type.includes('*')) {
//             const baseType = type.split('/')[0];
//             return file.type.startsWith(baseType);
//         }
//         return file.type === type;
//     });
// };

// // File Upload Component (Internal)
// const FileUploadComponent: React.FC<{
//     isVisible: boolean;
//     options: FileUploadOptions;
//     onHide: () => void;
// }> = ({ isVisible, options, onHide }) => {
//     const {
//         onFileUpload,
//         acceptedTypes = DEFAULT_ACCEPTED_TYPES,
//         maxFileSize = DEFAULT_MAX_FILE_SIZE,
//         maxFiles = DEFAULT_MAX_FILES,
//         multiple = true,
//         onClose,
//         disabled = false,
//         title = 'File Upload',
//     } = options;

//     const [files, setFiles] = useState<FileWithProgress[]>([]);
//     const [isDragOver, setIsDragOver] = useState(false);
//     const [isMinimized, setIsMinimized] = useState(false);
//     const [globalDragCounter, setGlobalDragCounter] = useState(0);
//     const [isUploading, setIsUploading] = useState(false);

//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//     const abortControllerRef = useRef<AbortController | null>(null);

//     // Memoized values
//     const acceptedTypesString = useMemo(() => acceptedTypes.join(','), [acceptedTypes]);
//     const maxFileSizeFormatted = useMemo(() => (maxFileSize / (1024 * 1024)).toFixed(1), [maxFileSize]);

//     // Reset state when component becomes visible
//     useEffect(() => {
//         if (isVisible) {
//             setFiles([]);
//             setIsMinimized(false);
//             setIsDragOver(false);
//             setIsUploading(false);
//         }
//     }, [isVisible]);

//     // Cleanup on unmount
//     useEffect(() => {
//         return () => {
//             if (abortControllerRef.current) {
//                 abortControllerRef.current.abort();
//             }
//             if (dragTimeoutRef.current) {
//                 clearTimeout(dragTimeoutRef.current);
//             }
//         };
//     }, []);

//     // Handle global drag and drop detection
//     useEffect(() => {
//         if (disabled || !isVisible) return;

//         let dragCounter = 0;

//         const handleGlobalDragEnter = (e: DragEvent) => {
//             e.preventDefault();
//             dragCounter++;

//             if (e.dataTransfer?.types.includes('Files')) {
//                 setIsDragOver(true);
//                 setIsMinimized(false);
//                 setGlobalDragCounter(dragCounter);
//             }
//         };

//         const handleGlobalDragLeave = (e: DragEvent) => {
//             e.preventDefault();
//             dragCounter--;

//             if (dragCounter === 0) {
//                 if (dragTimeoutRef.current) {
//                     clearTimeout(dragTimeoutRef.current);
//                 }
//                 dragTimeoutRef.current = setTimeout(() => {
//                     setIsDragOver(false);
//                     setGlobalDragCounter(0);
//                 }, 100);
//             }
//         };

//         const handleGlobalDrop = (e: DragEvent) => {
//             e.preventDefault();
//             dragCounter = 0;
//             setGlobalDragCounter(0);
//             setIsDragOver(false);

//             if (dragTimeoutRef.current) {
//                 clearTimeout(dragTimeoutRef.current);
//             }
//         };

//         const handleGlobalDragOver = (e: DragEvent) => {
//             e.preventDefault();
//         };

//         document.addEventListener('dragenter', handleGlobalDragEnter);
//         document.addEventListener('dragleave', handleGlobalDragLeave);
//         document.addEventListener('drop', handleGlobalDrop);
//         document.addEventListener('dragover', handleGlobalDragOver);

//         return () => {
//             document.removeEventListener('dragenter', handleGlobalDragEnter);
//             document.removeEventListener('dragleave', handleGlobalDragLeave);
//             document.removeEventListener('drop', handleGlobalDrop);
//             document.removeEventListener('dragover', handleGlobalDragOver);

//             if (dragTimeoutRef.current) {
//                 clearTimeout(dragTimeoutRef.current);
//             }
//         };
//     }, [disabled, isVisible]);

//     // Validate file with comprehensive checks
//     const validateFile = useCallback((file: File): string | null => {
//         if (file.size > maxFileSize) {
//             return `File size exceeds ${maxFileSizeFormatted}MB limit`;
//         }

//         if (file.size === 0) {
//             return 'File is empty';
//         }

//         if (!validateFileType(file, acceptedTypes)) {
//             return 'File type not supported';
//         }

//         const isDuplicate = files.some(f =>
//             f.file.name === file.name &&
//             f.file.size === file.size &&
//             f.file.lastModified === file.lastModified
//         );

//         if (isDuplicate) {
//             return 'File already exists';
//         }

//         return null;
//     }, [files, maxFileSize, maxFileSizeFormatted, acceptedTypes]);

//     // Enhanced upload simulation
//     const simulateUpload = useCallback(async (fileWithProgress: FileWithProgress): Promise<void> => {
//         return new Promise((resolve, reject) => {
//             const abortController = new AbortController();
//             abortControllerRef.current = abortController;

//             let progress = 0;
//             const increment = Math.random() * 10 + 5;

//             const updateProgress = () => {
//                 if (abortController.signal.aborted) {
//                     reject(new Error('Upload cancelled'));
//                     return;
//                 }

//                 progress += increment;

//                 if (progress >= 100) {
//                     setFiles((prev) =>
//                         prev.map((f) =>
//                             f.id === fileWithProgress.id
//                                 ? { ...f, progress: 100, status: 'success' }
//                                 : f
//                         )
//                     );
//                     resolve();
//                     return;
//                 }

//                 setFiles((prev) =>
//                     prev.map((f) =>
//                         f.id === fileWithProgress.id
//                             ? { ...f, progress: Math.min(progress, 100) }
//                             : f
//                     )
//                 );

//                 const delay = Math.random() * 200 + 100;
//                 setTimeout(updateProgress, delay);
//             };

//             // Simulate random failures (remove in production)
//             if (Math.random() < 0.1) {
//                 setTimeout(() => {
//                     if (!abortController.signal.aborted) {
//                         setFiles((prev) =>
//                             prev.map((f) =>
//                                 f.id === fileWithProgress.id
//                                     ? { ...f, status: 'error', error: 'Upload failed' }
//                                     : f
//                             )
//                         );
//                         reject(new Error('Upload failed'));
//                     }
//                 }, 1000);
//                 return;
//             }

//             const timeoutId = setTimeout(() => {
//                 if (!abortController.signal.aborted) {
//                     setFiles((prev) =>
//                         prev.map((f) =>
//                             f.id === fileWithProgress.id
//                                 ? { ...f, status: 'error', error: 'Upload timeout' }
//                                 : f
//                         )
//                     );
//                     reject(new Error('Upload timeout'));
//                 }
//             }, UPLOAD_TIMEOUT);

//             abortController.signal.addEventListener('abort', () => {
//                 clearTimeout(timeoutId);
//             });

//             updateProgress();
//         });
//     }, []);

//     // Process uploaded files
//     const processFiles = useCallback(
//         async (fileList: File[]) => {
//             if (fileList.length === 0 || disabled || isUploading) return;

//             setIsUploading(true);

//             try {
//                 const validFiles: FileWithProgress[] = [];

//                 for (const file of fileList) {
//                     if (files.length + validFiles.length >= maxFiles) {
//                         break;
//                     }

//                     const error = validateFile(file);
//                     const fileWithProgress: FileWithProgress = {
//                         file,
//                         progress: 0,
//                         status: error ? 'error' : 'pending',
//                         id: generateId(),
//                         error,
//                     };

//                     validFiles.push(fileWithProgress);
//                 }

//                 if (validFiles.length === 0) return;

//                 setFiles((prev) => [...prev, ...validFiles]);

//                 const uploadsToProcess = validFiles.filter((f) => f.status === 'pending');

//                 for (const fileWithProgress of uploadsToProcess) {
//                     if (abortControllerRef.current?.signal.aborted) break;

//                     setFiles((prev) =>
//                         prev.map((f) =>
//                             f.id === fileWithProgress.id ? { ...f, status: 'uploading' } : f
//                         )
//                     );

//                     try {
//                         await simulateUpload(fileWithProgress);

//                         if (onFileUpload) {
//                             await onFileUpload([fileWithProgress.file]);
//                         }
//                     } catch (error) {
//                         console.error('Upload failed:', error);
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error processing files:', error);
//             } finally {
//                 setIsUploading(false);
//             }
//         },
//         [files.length, maxFiles, disabled, isUploading, validateFile, simulateUpload, onFileUpload]
//     );

//     // Handle file selection
//     const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFiles = Array.from(e.target.files || []);
//         if (selectedFiles.length > 0) {
//             processFiles(selectedFiles);
//         }
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//     }, [processFiles]);

//     // Trigger file input
//     const triggerFileUpload = useCallback(() => {
//         if (disabled || isUploading) return;
//         fileInputRef.current?.click();
//     }, [disabled, isUploading]);

//     // Drag and drop handlers
//     const handleDrop = useCallback((e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragOver(false);

//         if (disabled || isUploading) return;

//         const droppedFiles = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
//         if (droppedFiles.length > 0) {
//             processFiles(droppedFiles);
//         }
//     }, [disabled, isUploading, processFiles]);

//     const handleDragOver = useCallback((e: React.DragEvent) => {
//         e.preventDefault();
//         if (!disabled && !isUploading) {
//             setIsDragOver(true);
//         }
//     }, [disabled, isUploading]);

//     const handleDragLeave = useCallback((e: React.DragEvent) => {
//         e.preventDefault();
//         const rect = e.currentTarget.getBoundingClientRect();
//         const x = e.clientX;
//         const y = e.clientY;

//         if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
//             setIsDragOver(false);
//         }
//     }, []);

//     // Remove file
//     const removeFile = useCallback((id: string) => {
//         setFiles((prev) => prev.filter((f) => f.id !== id));
//     }, []);

//     // Handle close
//     const handleClose = useCallback(() => {
//         if (abortControllerRef.current) {
//             abortControllerRef.current.abort();
//         }

//         setFiles([]);
//         setIsUploading(false);
//         setIsDragOver(false);
//         onClose?.();
//         onHide();
//     }, [onClose, onHide]);

//     // Get status icon
//     const getStatusIcon = (status: FileWithProgress['status']) => {
//         switch (status) {
//             case 'success':
//                 return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />;
//             case 'error':
//                 return <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
//             default:
//                 return <File className="w-4 h-4 text-gray-400" aria-hidden="true" />;
//         }
//     };

//     if (!isVisible) return null;

//     return (
//         <>
//             {/* Hidden File Input */}
//             <input
//                 ref={fileInputRef}
//                 type="file"
//                 multiple={multiple}
//                 accept={acceptedTypesString}
//                 onChange={handleFileSelect}
//                 className="sr-only"
//                 disabled={disabled}
//                 aria-hidden="true"
//                 tabIndex={-1}
//             />

//             {/* Global drag overlay */}
//             {isDragOver && !disabled && (
//                 <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
//                     <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-dashed border-blue-400 text-center max-w-md mx-4">
//                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                             <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
//                         </div>
//                         <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop files here</h3>
//                         <p className="text-gray-600">Release to upload your files</p>
//                     </div>
//                 </div>
//             )}

//             {/* Floating Window */}
//             <div
//                 className="fixed bottom-6 right-6 z-40 transform transition-all duration-500 ease-out translate-y-0 opacity-100 scale-100"
//                 role="dialog"
//                 aria-label="File upload dialog"
//                 aria-modal="true"
//             >
//                 <div
//                     className={`bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-300 ease-out ${isMinimized ? 'w-80 h-16' : 'w-96 max-h-[600px]'
//                         }`}
//                 >
//                     {/* Header */}
//                     <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
//                         <div className="flex items-center space-x-2">
//                             <div className="p-2 bg-blue-100 rounded-lg">
//                                 <Upload className="w-4 h-4 text-blue-600" />
//                             </div>
//                             <div>
//                                 <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
//                                 {files.length > 0 && !isMinimized && (
//                                     <p className="text-xs text-gray-500">
//                                         {files.length}/{maxFiles} files
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                         <div className="flex items-center space-x-1">
//                             <button
//                                 onClick={() => setIsMinimized(!isMinimized)}
//                                 className="p-1.5 hover:bg-white/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
//                                 aria-label={isMinimized ? 'Maximize window' : 'Minimize window'}
//                             >
//                                 {isMinimized ? (
//                                     <Maximize2 className="w-4 h-4 text-gray-600" />
//                                 ) : (
//                                     <Minimize2 className="w-4 h-4 text-gray-600" />
//                                 )}
//                             </button>
//                             <button
//                                 onClick={handleClose}
//                                 className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-red-300"
//                                 aria-label="Close file upload"
//                             >
//                                 <X className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
//                             </button>
//                         </div>
//                     </div>

//                     {/* Content */}
//                     {!isMinimized && (
//                         <div className="max-h-[520px] overflow-y-auto">
//                             {/* Upload Area */}
//                             <div className="p-4">
//                                 <div
//                                     className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-blue-300 ${isDragOver && !disabled
//                                         ? 'border-blue-400 bg-blue-50 scale-[1.02]'
//                                         : disabled
//                                             ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
//                                             : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
//                                         }`}
//                                     onDrop={handleDrop}
//                                     onDragOver={handleDragOver}
//                                     onDragLeave={handleDragLeave}
//                                     onClick={disabled ? undefined : triggerFileUpload}
//                                     role="button"
//                                     tabIndex={disabled ? -1 : 0}
//                                     aria-label={disabled ? 'File upload disabled' : 'Click to select files'}
//                                     onKeyDown={(e) => {
//                                         if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
//                                             e.preventDefault();
//                                             triggerFileUpload();
//                                         }
//                                     }}
//                                 >
//                                     <div className="flex flex-col items-center space-y-3">
//                                         <div className={`p-3 rounded-full transition-colors duration-300 ${isDragOver && !disabled ? 'bg-blue-100' : 'bg-gray-100'
//                                             }`}>
//                                             <Upload className={`w-6 h-6 transition-colors duration-300 ${isDragOver && !disabled ? 'text-blue-500' : 'text-gray-400'
//                                                 }`} />
//                                         </div>
//                                         <div>
//                                             <h4 className="text-sm font-medium text-gray-900 mb-1">
//                                                 {disabled ? 'Upload disabled' : isDragOver ? 'Drop files here' : 'Upload files'}
//                                             </h4>
//                                             {!disabled && (
//                                                 <>
//                                                     <p className="text-xs text-gray-500 mb-2">Drag & drop or click to browse</p>
//                                                     <div className="text-xs text-gray-400 space-y-1">
//                                                         <div>Max {maxFiles} files • {maxFileSizeFormatted}MB each</div>
//                                                         <div className="truncate">
//                                                             {acceptedTypes.length > 0
//                                                                 ? acceptedTypes.slice(0, 2).join(', ') + (acceptedTypes.length > 2 ? '...' : '')
//                                                                 : 'Any type'}
//                                                         </div>
//                                                     </div>
//                                                 </>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* File List */}
//                             {files.length > 0 && (
//                                 <div className="px-4 pb-4">
//                                     <div className="space-y-2 max-h-60 overflow-y-auto">
//                                         {files.map((fileWithProgress, index) => (
//                                             <div key={fileWithProgress.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
//                                                 <div className="flex items-center justify-between mb-2">
//                                                     <div className="flex items-center space-x-2 flex-1 min-w-0">
//                                                         {getStatusIcon(fileWithProgress.status)}
//                                                         <div className="flex-1 min-w-0">
//                                                             <p className="text-xs font-medium text-gray-900 truncate">
//                                                                 {fileWithProgress.file.name}
//                                                             </p>
//                                                             <p className="text-xs text-gray-500">
//                                                                 {formatFileSize(fileWithProgress.file.size)}
//                                                             </p>
//                                                         </div>
//                                                     </div>
//                                                     <button
//                                                         onClick={() => removeFile(fileWithProgress.id)}
//                                                         className="p-1 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
//                                                         aria-label={`Remove ${fileWithProgress.file.name}`}
//                                                         disabled={fileWithProgress.status === 'uploading'}
//                                                     >
//                                                         <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
//                                                     </button>
//                                                 </div>

//                                                 {/* Progress Bar */}
//                                                 {fileWithProgress.status === 'uploading' && (
//                                                     <div className="space-y-1">
//                                                         <div className="flex justify-between text-xs text-gray-500">
//                                                             <span>Uploading...</span>
//                                                             <span>{Math.round(fileWithProgress.progress)}%</span>
//                                                         </div>
//                                                         <div className="w-full bg-gray-200 rounded-full h-1.5">
//                                                             <div
//                                                                 className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
//                                                                 style={{ width: `${fileWithProgress.progress}%` }}
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 )}

//                                                 {/* Error/Success Messages */}
//                                                 {fileWithProgress.status === 'error' && fileWithProgress.error && (
//                                                     <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
//                                                         {fileWithProgress.error}
//                                                     </div>
//                                                 )}
//                                                 {fileWithProgress.status === 'success' && (
//                                                     <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
//                                                         <CheckCircle className="w-3 h-3" />
//                                                         <span>Upload completed</span>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {/* Minimized State */}
//                     {isMinimized && files.length > 0 && (
//                         <div className="px-4 py-2 flex items-center justify-between">
//                             <div className="flex items-center space-x-2">
//                                 <div className="flex -space-x-1">
//                                     {files.slice(0, 3).map((file) => (
//                                         <div key={file.id} className="w-6 h-6 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center">
//                                             {getStatusIcon(file.status)}
//                                         </div>
//                                     ))}
//                                     {files.length > 3 && (
//                                         <div className="w-6 h-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
//                                             <span className="text-xs font-medium text-gray-600">+{files.length - 3}</span>
//                                         </div>
//                                     )}
//                                 </div>
//                                 <span className="text-xs text-gray-600">{files.length} files</span>
//                             </div>
//                             <div className="flex space-x-1">
//                                 {files.map((file) => (
//                                     <div
//                                         key={file.id}
//                                         className={`w-2 h-2 rounded-full ${file.status === 'success' ? 'bg-green-400' :
//                                             file.status === 'error' ? 'bg-red-400' :
//                                                 file.status === 'uploading' ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
//                                             }`}
//                                     />
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// };

// // Provider Component
// export const FileUploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [isVisible, setIsVisible] = useState(false);
//     const [options, setOptions] = useState<FileUploadOptions>({});

//     const showUpload = useCallback((uploadOptions: FileUploadOptions = {}) => {
//         setOptions(uploadOptions);
//         setIsVisible(true);
//     }, []);

//     const hideUpload = useCallback(() => {
//         setIsVisible(false);
//         setOptions({});
//     }, []);

//     const contextValue = useMemo(() => ({
//         showUpload,
//         hideUpload,
//         isVisible,
//     }), [showUpload, hideUpload, isVisible]);

//     return (
//         <FileUploadContext.Provider value={contextValue}>
//             {children}
//             <FileUploadComponent
//                 isVisible={isVisible}
//                 options={options}
//                 onHide={hideUpload}
//             />
//         </FileUploadContext.Provider>
//     );
// };

// // Trigger Button Component (Optional)
// export const FileUploadTrigger: React.FC<{
//     children?: React.ReactNode;
//     options?: FileUploadOptions;
//     className?: string;
// }> = ({ children, options = {}, className = '' }) => {
//     const { showUpload } = useFileUpload();

//     return (
//         <button
//             onClick={() => showUpload(options)}
//             className={`inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
//         >
//             {children || (
//                 <>
//                     <Upload className="w-4 h-4 mr-2" />
//                     Upload Files
//                 </>
//             )}
//         </button>
//     );
// };

// // Default export for the provider
// export default FileUploadProvider;