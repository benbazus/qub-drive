
// import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { Upload, X, CheckCircle, AlertCircle, File, Minimize2, Maximize2, Pause, Play } from 'lucide-react';
// import { fileUploaderEndpoint } from '@/api/endpoints/fileUploader.endpoint';
// import { useFolder } from '@/context/folder-context';
// import { useFileQueryInvalidation } from '@/hooks/useFileQueryInvalidation';
// import { formatFileSize } from '@/utils/file.utils';
// import { getCurrentParentFolder } from '@/utils/parent-folder.utils';

// // Interfaces
// interface FileWithProgress {
//     file: File;
//     uploadId: string;
//     progress: number;
//     status: 'uploading' | 'success' | 'error' | 'pending' | 'paused';
//     id: string;
//     speed: number;
//     startTime: number;
//     estimatedTime: number | null;
//     error?: string;
// }

// interface FileUploadProps {
//     onFileUpload?: (files: File[]) => Promise<void>;
//     acceptedTypes?: string[];
//     maxFileSize?: number; // in bytes
//     maxFiles?: number;
//     multiple?: boolean;
//     onClose?: () => void;
// }

// // Component
// const FloatingFileUpload: React.FC<FileUploadProps> = ({
//     onFileUpload,
//     acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
//     maxFileSize = 10 * 1024 * 1024, // 10MB
//     maxFiles = 5,
//     multiple = true,
//     onClose,
// }) => {
//     const [files, setFiles] = useState<FileWithProgress[]>([]);
//     const [isDragOver, setIsDragOver] = useState(false);
//     const [isMinimized, setIsMinimized] = useState(false);
//     const [isVisible, setIsVisible] = useState(false);
//     const [globalDragCounter, setGlobalDragCounter] = useState(0);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const { getParentFolder } = useFolder();
//     const { invalidateFileQueries } = useFileQueryInvalidation();
//     // Use utility function to get parent folder with fallbacks
//     const currentFolder = getCurrentParentFolder(getParentFolder);

//     // Handle global drag and drop detection
//     useEffect(() => {
//         const handleGlobalDragEnter = (e: DragEvent) => {
//             e.preventDefault();
//             setGlobalDragCounter((prev) => prev + 1);
//             if (e.dataTransfer?.types.includes('Files')) {
//                 setIsVisible(true);
//                 setIsMinimized(false);
//                 setIsDragOver(true);
//             }
//         };

//         const handleGlobalDragLeave = (e: DragEvent) => {
//             e.preventDefault();
//             setGlobalDragCounter((prev) => prev - 1);
//             if (globalDragCounter === 1) {
//                 setIsDragOver(false);
//             }
//         };

//         const handleGlobalDrop = (e: DragEvent) => {
//             e.preventDefault();
//             setGlobalDragCounter(0);
//             setIsDragOver(false);
//         };

//         document.addEventListener('dragenter', handleGlobalDragEnter);
//         document.addEventListener('dragleave', handleGlobalDragLeave);
//         document.addEventListener('drop', handleGlobalDrop);

//         return () => {
//             document.removeEventListener('dragenter', handleGlobalDragEnter);
//             document.removeEventListener('dragleave', handleGlobalDragLeave);
//             document.removeEventListener('drop', handleGlobalDrop);
//         };
//     }, [globalDragCounter]);

//     // Generate unique ID for files
//     const generateId = () => Math.random().toString(36).substring(2, 11);

//     // Validate file based on size and type
//     const validateFile = (file: File): string | null => {
//         if (file.size > maxFileSize) {
//             return `File size exceeds ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB limit`;
//         }

//         if (acceptedTypes.length > 0) {
//             const isValidType = acceptedTypes.some((type) => {
//                 if (type.startsWith('.')) {
//                     return file.name.toLowerCase().endsWith(type.toLowerCase());
//                 }
//                 if (type.includes('*')) {
//                     const baseType = type.split('/')[0];
//                     return file.type.startsWith(baseType);
//                 }
//                 return file.type === type;
//             });

//             if (!isValidType) {
//                 return 'File type not supported';
//             }
//         }

//         return null;
//     };

//     // Real file upload using fileUploaderEndpoint
//     const performRealUpload = useCallback(async (fileWithProgress: FileWithProgress): Promise<void> => {
//         try {
//             await fileUploaderEndpoint.smartUpload(
//                 fileWithProgress.file,
//                 currentFolder!,
//                 {
//                     onProgress: (progress) => {
//                         setFiles((prev) =>
//                             prev.map((f) =>
//                                 f.id === fileWithProgress.id
//                                     ? {
//                                         ...f,
//                                         progress: progress.percentage,
//                                         speed: progress.loaded / ((Date.now() - f.startTime) / 1000),
//                                         estimatedTime: progress.percentage < 100
//                                             ? Math.round(
//                                                 (((100 - progress.percentage) / 100) * fileWithProgress.file.size) /
//                                                 (progress.loaded / ((Date.now() - f.startTime) / 1000))
//                                             )
//                                             : 0,
//                                     }
//                                     : f
//                             )
//                         );
//                     },
//                     onSuccess: () => {
//                         setFiles((prev) =>
//                             prev.map((f) =>
//                                 f.id === fileWithProgress.id
//                                     ? {
//                                         ...f,
//                                         status: 'success',
//                                         progress: 100,
//                                         speed: 0,
//                                         estimatedTime: 0,
//                                     }
//                                     : f
//                             )
//                         );
//                         // Invalidate file queries to refresh the UI
//                         invalidateFileQueries(currentFolder);
//                     },
//                     onError: (error) => {
//                         setFiles((prev) =>
//                             prev.map((f) =>
//                                 f.id === fileWithProgress.id
//                                     ? {
//                                         ...f,
//                                         status: 'error',
//                                         error: error.message,
//                                         speed: 0,
//                                         estimatedTime: 0,
//                                     }
//                                     : f
//                             )
//                         );
//                     },
//                 }
//             );
//         } catch (error: any) {
//             setFiles((prev) =>
//                 prev.map((f) =>
//                     f.id === fileWithProgress.id
//                         ? {
//                             ...f,
//                             status: 'error',
//                             error: error.message || 'Upload failed',
//                             speed: 0,
//                             estimatedTime: 0,
//                         }
//                         : f
//                 )
//             );
//         }
//     }, [currentFolder, invalidateFileQueries]);

//     // Process uploaded files
//     const processFiles = useCallback(
//         async (fileList: File[]) => {
//             if (fileList.length === 0) return;

//             setIsVisible(true);
//             setIsMinimized(false);

//             const validFiles: FileWithProgress[] = [];

//             for (const file of fileList) {
//                 if (files.length + validFiles.length >= maxFiles) {
//                     break;
//                 }

//                 const error = validateFile(file);
//                 const fileWithProgress: FileWithProgress = {
//                     file,
//                     uploadId: '',
//                     progress: 0,
//                     status: error ? 'error' : 'pending',
//                     id: generateId(),
//                     speed: 0,
//                     startTime: Date.now(),
//                     estimatedTime: null,
//                     error,
//                 };

//                 validFiles.push(fileWithProgress);
//             }

//             setFiles((prev) => [...prev, ...validFiles]);

//             const uploadsToProcess = validFiles.filter((f) => f.status === 'pending');

//             for (const fileWithProgress of uploadsToProcess) {
//                 setFiles((prev) =>
//                     prev.map((f) =>
//                         f.id === fileWithProgress.id ? { ...f, status: 'uploading' } : f
//                     )
//                 );

//                 try {
//                     await performRealUpload(fileWithProgress);
//                     if (onFileUpload) {
//                         await onFileUpload([fileWithProgress.file]);
//                     }
//                 } catch (error) {
//                     console.error('Upload failed:', error);
//                 }
//             }
//         },
//         [files.length, maxFiles, maxFileSize, acceptedTypes, onFileUpload, performRealUpload]
//     );

//     // Handle file selection from input
//     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFiles = Array.from(e.target.files || []);
//         if (selectedFiles.length > 0) {
//             processFiles(selectedFiles);
//         }
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//     };

//     // Trigger file input programmatically
//     const triggerFileUpload = () => {
//         fileInputRef.current?.click();
//     };

//     // Handle drag and drop
//     const handleDrop = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragOver(false);
//         const droppedFiles = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
//         processFiles(droppedFiles);
//     };

//     const handleDragOver = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragOver(true);
//     };

//     const handleDragLeave = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragOver(false);
//     };

//     // Pause upload
//     const pauseUpload = useCallback(async (id: string) => {
//         const file = files.find(f => f.id === id);
//         if (file && file.uploadId) {
//             try {
//                 await fileUploaderEndpoint.cancelUpload(file.uploadId);
//                 setFiles((prev) => 
//                     prev.map((f) => 
//                         f.id === id ? { ...f, status: 'paused' } : f
//                     )
//                 );
//             } catch (error) {
//                 console.error('Failed to pause upload:', error);
//             }
//         }
//     }, [files]);

//     // Resume upload
//     const resumeUpload = useCallback(async (id: string) => {
//         const file = files.find(f => f.id === id);
//         if (file && file.status === 'paused') {
//             setFiles((prev) => 
//                 prev.map((f) => 
//                     f.id === id ? { ...f, status: 'uploading', startTime: Date.now() } : f
//                 )
//             );
//             await performRealUpload(file);
//         }
//     }, [files, performRealUpload]);

//     // Remove a file from the list
//     const removeFile = useCallback(async (id: string) => {
//         const file = files.find(f => f.id === id);
//         if (file && file.uploadId && file.status === 'uploading') {
//             try {
//                 await fileUploaderEndpoint.cancelUpload(file.uploadId);
//             } catch (error) {
//                 console.error('Failed to cancel upload:', error);
//             }
//         }
//         setFiles((prev) => prev.filter((f) => f.id !== id));
//     }, [files]);

//     // Handle closing the component
//     const handleClose = () => {
//         setIsVisible(false);
//         setFiles([]);
//         onClose?.();
//     };

//     // Format time for display
//     const formatTime = (seconds: number): string => {
//         if (!seconds || seconds === Infinity) return '--';
//         if (seconds < 60) return `${Math.round(seconds)}s`;
//         if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
//         return `${Math.round(seconds / 3600)}h`;
//     };

//     // Get status icon based on file status
//     const getStatusIcon = (status: FileWithProgress['status']) => {
//         switch (status) {
//             case 'success':
//                 return <CheckCircle className="w-4 h-4 text-green-500" />;
//             case 'error':
//                 return <AlertCircle className="w-4 h-4 text-red-500" />;
//             case 'paused':
//                 return <Pause className="w-4 h-4 text-yellow-500" />;
//             case 'uploading':
//                 return <Upload className="w-4 h-4 text-blue-500" />;
//             default:
//                 return <File className="w-4 h-4 text-gray-400" />;
//         }
//     };

//     // Render nothing if not visible
//     if (!isVisible && files.length === 0) {
//         return (
//             <div className="fixed bottom-6 right-6 z-50">
//                 <button
//                     onClick={triggerFileUpload}
//                     className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out"
//                     aria-label="Upload files"
//                 >
//                     <Upload className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <>
//             {/* Global File Input */}
//             <input
//                 ref={fileInputRef}
//                 type="file"
//                 multiple={multiple}
//                 accept={acceptedTypes.join(',')}
//                 onChange={handleFileSelect}
//                 className="hidden"
//                 data-testid="file-input"
//             />

//             {/* Global drag and drop overlay */}
//             {isDragOver && (
//                 <div className="fixed inset-0 z-30 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
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
//                 className={`fixed bottom-6 right-6 z-50 transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'
//                     }`}
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
//                                 <h3 className="font-semibold text-gray-900 text-sm">File Upload</h3>
//                                 {files.length > 0 && !isMinimized && (
//                                     <p className="text-xs text-gray-500">{files.length}/{maxFiles} files</p>
//                                 )}
//                             </div>
//                         </div>
//                         <div className="flex items-center space-x-1">
//                             <button
//                                 onClick={() => setIsMinimized(!isMinimized)}
//                                 className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
//                                 aria-label={isMinimized ? 'Maximize' : 'Minimize'}
//                             >
//                                 {isMinimized ? (
//                                     <Maximize2 className="w-4 h-4 text-gray-600" />
//                                 ) : (
//                                     <Minimize2 className="w-4 h-4 text-gray-600" />
//                                 )}
//                             </button>
//                             <button
//                                 onClick={handleClose}
//                                 className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
//                                 aria-label="Close"
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
//                                     className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer ${isDragOver
//                                         ? 'border-blue-400 bg-blue-50 scale-[1.02]'
//                                         : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
//                                         }`}
//                                     onDrop={handleDrop}
//                                     onDragOver={handleDragOver}
//                                     onDragLeave={handleDragLeave}
//                                     onClick={() => fileInputRef.current?.click()}
//                                 >
//                                     <div className="flex flex-col items-center space-y-3">
//                                         <div
//                                             className={`p-3 rounded-full transition-colors duration-300 ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'
//                                                 }`}
//                                         >
//                                             <Upload
//                                                 className={`w-6 h-6 transition-colors duration-300 ${isDragOver ? 'text-blue-500' : 'text-gray-400'
//                                                     }`}
//                                             />
//                                         </div>
//                                         <div>
//                                             <h4 className="text-sm font-medium text-gray-900 mb-1">
//                                                 {isDragOver ? 'Drop files here' : 'Upload files'}
//                                             </h4>
//                                             <p className="text-xs text-gray-500 mb-2">
//                                                 Drag & drop or click to browse
//                                             </p>
//                                             <div className="text-xs text-gray-400 space-y-1">
//                                                 <div>Max {maxFiles} files • {(maxFileSize / (1024 * 1024)).toFixed(0)}MB each</div>
//                                                 <div className="truncate">
//                                                     {acceptedTypes.length > 0
//                                                         ? acceptedTypes.slice(0, 2).join(', ') +
//                                                         (acceptedTypes.length > 2 ? '...' : '')
//                                                         : 'Any type'}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* File List */}
//                             {files.length > 0 && (
//                                 <div className="px-4 pb-4">
//                                     <div className="space-y-2 max-h-60 overflow-y-auto">
//                                         {files.map((fileWithProgress) => (
//                                             <div
//                                                 key={fileWithProgress.id}
//                                                 className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
//                                             >
//                                                 <div className="flex items-center justify-between mb-2">
//                                                     <div className="flex items-center space-x-2 flex-1 min-w-0">
//                                                         {getStatusIcon(fileWithProgress.status)}
//                                                         <div className="flex-1 min-w-0">
//                                                             <p className="text-xs font-medium text-gray-900 truncate">
//                                                                 {fileWithProgress.file.name}
//                                                             </p>
//                                                             <div className="flex justify-between text-xs text-gray-500">
//                                                                 <span>{formatFileSize(fileWithProgress.file.size)}</span>
//                                                                 {fileWithProgress.status === 'uploading' && fileWithProgress.speed > 0 && (
//                                                                     // <span>
//                                                                     //     {formatFileSize(fileWithProgress.speed)}/s • {formatTime(fileWithProgress?.estimatedTime)} left
//                                                                     // </span>
//                                                                 )}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <div className="flex items-center gap-1">
//                                                         {fileWithProgress.status === 'uploading' && (
//                                                             <button
//                                                                 onClick={() => pauseUpload(fileWithProgress.id)}
//                                                                 className="p-1 hover:bg-gray-200 rounded-full transition-colors"
//                                                                 aria-label="Pause upload"
//                                                             >
//                                                                 <Pause className="w-3 h-3 text-gray-600" />
//                                                             </button>
//                                                         )}
//                                                         {fileWithProgress.status === 'paused' && (
//                                                             <button
//                                                                 onClick={() => resumeUpload(fileWithProgress.id)}
//                                                                 className="p-1 hover:bg-gray-200 rounded-full transition-colors"
//                                                                 aria-label="Resume upload"
//                                                             >
//                                                                 <Play className="w-3 h-3 text-gray-600" />
//                                                             </button>
//                                                         )}
//                                                         <button
//                                                             onClick={() => removeFile(fileWithProgress.id)}
//                                                             className="p-1 hover:bg-gray-200 rounded-full transition-colors"
//                                                             aria-label="Remove file"
//                                                         >
//                                                             <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
//                                                         </button>
//                                                     </div>
//                                                 </div>

//                                                 {/* Progress Bar */}
//                                                 {(fileWithProgress.status === 'uploading' || fileWithProgress.status === 'paused') && (
//                                                     <div className="space-y-1">
//                                                         <div className="flex justify-between text-xs text-gray-500">
//                                                             <span>
//                                                                 {fileWithProgress.status === 'paused' ? 'Paused' : 'Uploading...'}
//                                                             </span>
//                                                             <span>{Math.round(fileWithProgress.progress)}%</span>
//                                                         </div>
//                                                         <div className="w-full bg-gray-200 rounded-full h-1.5">
//                                                             <div
//                                                                 className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
//                                                                     fileWithProgress.status === 'paused' 
//                                                                         ? 'bg-yellow-500' 
//                                                                         : 'bg-gradient-to-r from-blue-500 to-purple-500'
//                                                                 }`}
//                                                                 style={{ width: `${fileWithProgress.progress}%` }}
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 )}

//                                                 {/* Error Message */}
//                                                 {fileWithProgress.status === 'error' && fileWithProgress.error && (
//                                                     <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
//                                                         {fileWithProgress.error}
//                                                     </div>
//                                                 )}

//                                                 {/* Success Message */}
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

//                     {/* Minimized State Preview */}
//                     {isMinimized && files.length > 0 && (
//                         <div className="px-4 py-2 flex items-center justify-between">
//                             <div className="flex items-center space-x-2">
//                                 <div className="flex -space-x-1">
//                                     {files.slice(0, 3).map((file) => (
//                                         <div
//                                             key={file.id}
//                                             className="w-6 h-6 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center"
//                                         >
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
//                                         className={`w-2 h-2 rounded-full ${file.status === 'success'
//                                             ? 'bg-green-400'
//                                             : file.status === 'error'
//                                                 ? 'bg-red-400'
//                                                 : file.status === 'uploading'
//                                                     ? 'bg-blue-400 animate-pulse'
//                                                     : file.status === 'paused'
//                                                         ? 'bg-yellow-400'
//                                                         : 'bg-gray-300'
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

// export default FloatingFileUpload;