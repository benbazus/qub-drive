// /* eslint-disable no-console */
// import { useState, useRef, useEffect, FC } from 'react';
// import { Upload, X, Download, Link2, Check, Copy, Lock, Calendar, Eye, EyeOff, BarChart3, ChevronDown, AlertCircle, FileText } from 'lucide-react';
// import {
//     FileMetadata,
//     TransferFormData,
//     AdvancedOptions,
//     ViewType,
//     AlertProps,
//     ButtonProps,
//     ProgressBarProps
// } from '../types/transfer.types';
// import {
//     useCreateTransfer,
//     useFetchTransferData,
//     useFetchDownloadStats,
//     useDownloadFile
// } from '../hooks/useTransfer';
// import { formatFileSize, getExpirationDate, getDaysRemaining, isTransferExpired, getFullShareLink } from '../utils/formatters';
 

// // Utility Components
// const Btn: FC<ButtonProps> = ({ onClick, className = '', children, disabled, ...props }) => (
//     <button onClick={onClick} disabled={disabled} className={`transition font-semibold ${className}`} {...props}>
//         {children}
//     </button>
// );

// const Alert: FC<AlertProps> = ({ type = 'error', children }) => {
//     const colors = { error: 'red', warning: 'amber', success: 'green', info: 'blue' };
//     const c = colors[type];
//     return (
//         <div className={`bg-${c}-50 border border-${c}-200 rounded-xl p-4 flex items-start gap-3`}>
//             <AlertCircle className={`w-5 h-5 text-${c}-600 mt-0.5`} />
//             <div className="flex-1">{children}</div>
//         </div>
//     );
// };

// const ProgressBar: FC<ProgressBarProps> = ({ progress, gradient }) => (
//     <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
//         <div className={`${gradient} h-3 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
//     </div>
// );

// const BuilkTransfer: FC = () => {
//     const [view, setView] = useState<ViewType>('upload');
//     const [files, setFiles] = useState<FileMetadata[]>([]);
//     const [form, setForm] = useState<TransferFormData>({ title: '', message: '', recipientEmail: '', senderEmail: '' });
//     const [isDragging, setIsDragging] = useState<boolean>(false);
//     const [shareLink, setShareLink] = useState<string>('');
//     const [copied, setCopied] = useState<boolean>(false);
//     const [error, setError] = useState<string>('');
//     const [advanced, setAdvanced] = useState<AdvancedOptions>({
//         password: '',
//         showPassword: false,
//         expirationDays: 7,
//         downloadLimit: null,
//         enableTracking: false,
//         showAdvanced: false
//     });
//     const [enteredPassword, setEnteredPassword] = useState<string>('');
//     const [passwordError, setPasswordError] = useState<boolean>(false);

//     const fileInputRef = useRef<HTMLInputElement>(null);

//     // React Query hooks
//     const { createTransfer, uploadProgress, isLoading: isUploading, isSuccess: uploadSuccess } = useCreateTransfer();
//     const { data: transferData, isLoading: isLoadingTransfer, error: transferError } = useFetchTransferData(shareLink, {
//         enabled: view === 'download' && !!shareLink
//     });
//     const { data: statsData } = useFetchDownloadStats(shareLink, {
//         enabled: view === 'success' && advanced.enableTracking && !!shareLink
//     });
//     const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

//     // File handling
//     const addFiles = (newFiles: File[]) => {
//         const filesWithMeta: FileMetadata[] = newFiles.map((file, idx) => ({
//             id: Date.now() + idx,
//             file,
//             name: file.name,
//             size: formatFileSize(file.size),
//             rawSize: file.size,
//             type: file.type || 'unknown'
//         }));
//         setFiles([...files, ...filesWithMeta]);
//     };

//     const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(true);
//     };

//     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(false);
//     };

//     const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(false);
//         addFiles(Array.from(e.dataTransfer.files));
//     };

//     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files) {
//             addFiles(Array.from(e.target.files));
//         }
//     };

//     const removeFile = (id: number) => setFiles(files.filter(f => f.id !== id));

//     const getTotalSize = (): string => formatFileSize(files.reduce((sum, f) => sum + f.rawSize, 0));

//     // Transfer handling
//     const handleTransfer = async () => {
//         if (!files.length) return;
//         setError('');

//         try {

//            // const shareLink = randomBytes(6).toString('base64url');

//             const response = await createTransfer({
//                 files: files.map(f => f.file),
//                 title: form.title || undefined,
//                 message: form.message || undefined,
//                 senderEmail: form.senderEmail || undefined,
//                 recipientEmail: form.recipientEmail || undefined,
//                 password: advanced.password || undefined,
//                 expirationDays: advanced.expirationDays,
//                 downloadLimit: advanced.downloadLimit || undefined,
//                 trackingEnabled: advanced.enableTracking
//             });

//             console.log(" @@@@@@@@@@@@@@@ ")
//             console.log(response)
//             console.log(" @@@@@@@@@@@@@@@ ")
            
//             // const shareLink = CryptoUtil.generateShareLink();

//             setShareLink( shareLink);
//             setView('success');
//         } catch (err) {
//             console.error('Upload error:', err);
//             setError(err instanceof Error ? err.message : 'Failed to upload files. Please try again.');
//         }
//     };

//     // Download handling
//     const handleDownloadFile = async (fileId: string, fileName: string) => {
//         setPasswordError(false);
//         setError('');

//         try {
//             await downloadFile({
//                 transferLink: shareLink,
//                 fileId,
//                 fileName,
//                 password: enteredPassword || undefined
//             });
//         } catch (err) {
//             console.error('Download error:', err);
//             if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
//                 setPasswordError(true);
//                 setError('Incorrect password');
//             } else {
//                 setError(err instanceof Error ? err.message : 'Download failed');
//             }
//         }
//     };

//     const copyToClipboard = () => {
//         navigator.clipboard.writeText(getFullShareLink(shareLink));
//         setCopied(true);
//         setTimeout(() => setCopied(false), 2000);
//     };

//     const resetTransfer = () => {
//         setView('upload');
//         setFiles([]);
//         setForm({ title: '', message: '', recipientEmail: '', senderEmail: '' });
//         setShareLink('');
//         setAdvanced({
//             password: '',
//             showPassword: false,
//             expirationDays: 7,
//             downloadLimit: null,
//             enableTracking: false,
//             showAdvanced: false
//         });
//         setEnteredPassword('');
//         setPasswordError(false);
//         setError('');
//     };

//     const switchToDownloadView = () => {
//         setView('download');
//     };

//     // Check URL for share link on mount
//     useEffect(() => {
//         const params = new URLSearchParams(window.location.search);
//         const share = params.get('share');
//         if (share) {
//             setShareLink(share);
//             setView('download');
//         }
//     }, []);

//     // Handle upload success
//     useEffect(() => {
//         if (uploadSuccess && view !== 'success') {
//             setView('success');
//         }
//     }, [uploadSuccess, view]);

//     // DOWNLOAD VIEW
//     if (view === 'download') {
//         if (isLoadingTransfer) {
//             return (
//                 <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6 flex items-center justify-center">
//                     <div className="text-white text-xl">Loading...</div>
//                 </div>
//             );
//         }

//         if (transferError || !transferData) {
//             return (
//                 <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
//                     <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center">
//                         <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
//                         <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
//                         <p className="text-gray-600 mb-6">
//                             {transferError?.message || 'Failed to load transfer data'}
//                         </p>
//                         <Btn onClick={resetTransfer} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
//                             Go Back
//                         </Btn>
//                     </div>
//                 </div>
//             );
//         }

//         const daysRemaining = getDaysRemaining(transferData.data.expirationDate);
//         const isExpired = isTransferExpired(transferData.data.expirationDate);

//         return (
//             <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
//                 <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
//                     <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white text-center">
//                         <Download className="w-16 h-16 mx-auto mb-4" />
//                         <h1 className="text-3xl font-bold mb-2">Download Files</h1>
//                         <p className="text-blue-50">
//                             {transferData.data.senderEmail
//                                 ? `Sent by ${transferData.data.senderEmail}`
//                                 : 'Someone shared files with you'}
//                         </p>
//                     </div>

//                     <div className="p-8">
//                         {transferData.data.title && (
//                             <h2 className="text-2xl font-bold text-gray-800 mb-4">{transferData.data.title}</h2>
//                         )}
//                         {transferData.data.message && (
//                             <Alert type="info">
//                                 <p className="text-gray-700">{transferData.data.message}</p>
//                             </Alert>
//                         )}

//                         <div className="my-6">
//                             <h3 className="font-semibold text-gray-700 mb-3">
//                                 Files ({transferData.data.files.length})
//                             </h3>
//                             <div className="space-y-2 max-h-64 overflow-y-auto">
//                                 {transferData.data.files.map(file => (
//                                     <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
//                                         <div className="flex items-center gap-3 flex-1 min-w-0">
//                                             <FileText className="w-5 h-5 text-blue-600" />
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="font-medium text-gray-800 truncate">{file.fileName}</p>
//                                                 <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
//                                             </div>
//                                         </div>
//                                         <Btn
//                                             onClick={() => handleDownloadFile(file.id, file.fileName)}
//                                             disabled={isDownloading || isExpired}
//                                             className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
//                                                 isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
//                                             }`}
//                                         >
//                                             <Download className="w-4 h-4" />
//                                             {isDownloading ? 'Downloading...' : 'Download'}
//                                         </Btn>
//                                     </div>
//                                 ))}
//                             </div>
//                             <p className="text-sm text-gray-600 text-center mt-3">
//                                 Total size: <span className="font-semibold">{formatFileSize(transferData.data.totalSize)}</span>
//                             </p>
//                         </div>

//                         {!isExpired && daysRemaining <= 2 && (
//                             <Alert type="warning">
//                                 <p className="font-semibold text-amber-900">Expiring Soon!</p>
//                                 <p className="text-sm text-amber-700">
//                                     This transfer expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
//                                 </p>
//                             </Alert>
//                         )}

//                         {transferData.data.hasPassword && (
//                             <div className="my-6">
//                                 <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                                     <Lock className="w-5 h-5 text-blue-600" />
//                                     Password Required
//                                 </label>
//                                 <input
//                                     type="password"
//                                     placeholder="Enter password to download"
//                                     value={enteredPassword}
//                                     onChange={(e) => {
//                                         setEnteredPassword(e.target.value);
//                                         setPasswordError(false);
//                                     }}
//                                     className={`w-full px-5 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition ${
//                                         passwordError ? 'border-red-500' : 'border-gray-300'
//                                     }`}
//                                 />
//                                 {passwordError && (
//                                     <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
//                                         <AlertCircle className="w-4 h-4" />
//                                         Incorrect password
//                                     </p>
//                                 )}
//                             </div>
//                         )}

//                         {isDownloading && (
//                             <div className="my-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
//                                 <div className="flex items-center justify-between mb-3">
//                                     <span className="font-semibold text-gray-700">Downloading...</span>
//                                     <span className="font-bold text-blue-600 text-xl">{downloadProgress}%</span>
//                                 </div>
//                                 <ProgressBar progress={downloadProgress} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
//                             </div>
//                         )}

//                         {isExpired && (
//                             <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//                                 <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
//                                 <h3 className="text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
//                                 <p className="text-red-700">This transfer has expired and is no longer available</p>
//                             </div>
//                         )}

//                         {(error || downloadError) && (
//                             <Alert type="error">
//                                 <p className="text-red-700">{error || downloadError?.message}</p>
//                             </Alert>
//                         )}

//                         <div className="mt-6 text-center">
//                             <Btn onClick={resetTransfer} className="text-blue-600 hover:text-blue-700">
//                                 ← Create Your Own Transfer
//                             </Btn>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // SUCCESS VIEW
//     if (view === 'success') {
//         const fullShareLink = getFullShareLink(shareLink);
//         const stats = statsData?.data;

//         return (
//             <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
//                 <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
//                     <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-white text-center">
//                         <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//                             <Check className="w-10 h-10" />
//                         </div>
//                         <h2 className="text-4xl font-bold mb-2">Transfer Complete!</h2>
//                         <p className="text-green-50">Your files are ready to share</p>
//                     </div>

//                     <div className="p-8">
//                         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-indigo-100">
//                             <div className="flex items-center gap-2 mb-3">
//                                 <Link2 className="w-5 h-5 text-indigo-600" />
//                                 <p className="font-semibold text-gray-700">Share Link</p>
//                             </div>
//                             <div className="flex items-center gap-2 mb-4">
//                                 <input
//                                     type="text"
//                                     value={fullShareLink}
//                                     readOnly
//                                     className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white font-mono text-sm"
//                                 />
//                                 <Btn
//                                     onClick={copyToClipboard}
//                                     className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl"
//                                 >
//                                     {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
//                                     {copied ? 'Copied!' : 'Copy'}
//                                 </Btn>
//                             </div>
//                             <Btn
//                                 onClick={switchToDownloadView}
//                                 className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2"
//                             >
//                                 <Eye className="w-5 h-5" />
//                                 Preview Download Page
//                             </Btn>
//                         </div>

//                         <div className="grid grid-cols-2 gap-4 mb-6">
//                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//                                 <p className="text-sm text-gray-600 mb-1">Files</p>
//                                 <p className="text-2xl font-bold text-gray-800">{files.length}</p>
//                             </div>
//                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//                                 <p className="text-sm text-gray-600 mb-1">Total Size</p>
//                                 <p className="text-2xl font-bold text-gray-800">{getTotalSize()}</p>
//                             </div>
//                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//                                 <p className="text-sm text-gray-600 mb-1">Expires</p>
//                                 <p className="text-lg font-semibold text-gray-800">
//                                     {getExpirationDate(advanced.expirationDays)}
//                                 </p>
//                             </div>
//                             {advanced.downloadLimit && (
//                                 <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//                                     <p className="text-sm text-gray-600 mb-1">Download Limit</p>
//                                     <p className="text-2xl font-bold text-gray-800">{advanced.downloadLimit}</p>
//                                 </div>
//                             )}
//                         </div>

//                         {advanced.password && (
//                             <Alert type="warning">
//                                 <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
//                                 <div className="flex-1">
//                                     <p className="font-semibold text-amber-900 mb-1">Password Protected</p>
//                                     <p className="text-sm text-amber-700">Recipients will need the password to download</p>
//                                 </div>
//                             </Alert>
//                         )}

//                         {advanced.enableTracking && stats && (
//                             <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 my-6 border border-blue-100">
//                                 <div className="flex items-center gap-2 mb-4">
//                                     <BarChart3 className="w-5 h-5 text-blue-600" />
//                                     <h3 className="font-bold text-gray-800 text-lg">Download Analytics</h3>
//                                 </div>
//                                 <div className="grid grid-cols-3 gap-4 mb-4">
//                                     <div className="bg-white rounded-xl p-4 shadow-sm">
//                                         <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
//                                         <p className="text-3xl font-bold text-blue-600">{stats.totalDownloads}</p>
//                                     </div>
//                                     <div className="bg-white rounded-xl p-4 shadow-sm">
//                                         <p className="text-sm text-gray-600 mb-1">Unique Users</p>
//                                         <p className="text-3xl font-bold text-purple-600">{stats.uniqueDownloaders}</p>
//                                     </div>
//                                     <div className="bg-white rounded-xl p-4 shadow-sm">
//                                         <p className="text-sm text-gray-600 mb-1">Last Download</p>
//                                         <p className="text-lg font-semibold text-gray-800">
//                                             {stats.lastDownload
//                                                 ? new Date(stats.lastDownload).toLocaleTimeString()
//                                                 : 'None yet'}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 {stats.downloads.length > 0 && (
//                                     <div className="bg-white rounded-xl p-4 shadow-sm">
//                                         <p className="font-semibold text-gray-700 mb-3">Recent Activity</p>
//                                         <div className="space-y-2 max-h-48 overflow-y-auto">
//                                             {stats.downloads.map(dl => (
//                                                 <div
//                                                     key={dl.id}
//                                                     className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
//                                                 >
//                                                     <div className="flex items-center gap-2">
//                                                         <Download className="w-4 h-4 text-blue-500" />
//                                                         <span className="text-gray-700">{dl.location || dl.ipAddress}</span>
//                                                     </div>
//                                                     <span className="text-gray-500">
//                                                         {new Date(dl.downloadedAt).toLocaleTimeString()}
//                                                     </span>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         <Btn
//                             onClick={resetTransfer}
//                             className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg hover:shadow-xl"
//                         >
//                             Send Another Transfer
//                         </Btn>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // UPLOAD VIEW
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
//             <div className="max-w-4xl mx-auto">
//                 <div className="text-center mb-8">
//                     <h1 className="text-5xl font-bold text-white mb-2">Bulk Transfer</h1>
//                     <p className="text-xl text-white/90">Secure file sharing with advanced features</p>
//                 </div>

//                 <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
//                     <div
//                         onDragOver={handleDragOver}
//                         onDragLeave={handleDragLeave}
//                         onDrop={handleDrop}
//                         onClick={() => fileInputRef.current?.click()}
//                         className={`border-3 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 mb-6 ${
//                             isDragging
//                                 ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg'
//                                 : 'border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50'
//                         }`}
//                     >
//                         <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
//                             <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
//                             <p className="text-2xl font-bold text-gray-800 mb-2">
//                                 {isDragging ? 'Drop your files here' : 'Upload your files'}
//                             </p>
//                             <p className="text-gray-600">Click or drag files here to upload</p>
//                             <p className="text-sm text-gray-500 mt-2">Up to 2GB per transfer</p>
//                         </div>
//                         <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
//                     </div>

//                     {error && (
//                         <Alert type="error">
//                             <p className="text-red-700">{error}</p>
//                         </Alert>
//                     )}

//                     {files.length > 0 && (
//                         <div className="mb-6">
//                             <h3 className="text-xl font-bold text-gray-800 mb-4">
//                                 Files ({files.length}) • {getTotalSize()}
//                             </h3>
//                             <div className="space-y-2 max-h-64 overflow-y-auto">
//                                 {files.map(file => (
//                                     <div
//                                         key={file.id}
//                                         className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition"
//                                     >
//                                         <div className="flex-1 min-w-0">
//                                             <p className="font-semibold text-gray-800 truncate">{file.name}</p>
//                                             <p className="text-sm text-gray-500">{file.size}</p>
//                                         </div>
//                                         <Btn
//                                             onClick={(e) => {
//                                                 e?.stopPropagation();
//                                                 removeFile(file.id);
//                                             }}
//                                             className="ml-4 p-2 hover:bg-red-100 rounded-lg text-red-600"
//                                         >
//                                             <X className="w-5 h-5" />
//                                         </Btn>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {isUploading && (
//                         <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
//                             <div className="flex items-center justify-between mb-3">
//                                 <span className="font-semibold text-gray-700">Uploading your files...</span>
//                                 <span className="font-bold text-indigo-600 text-xl">{uploadProgress}%</span>
//                             </div>
//                             <ProgressBar progress={uploadProgress} gradient="bg-gradient-to-r from-indigo-500 to-purple-500" />
//                         </div>
//                     )}

//                     {files.length > 0 && !isUploading && (
//                         <div className="space-y-4 mb-6">
//                             <input
//                                 type="text"
//                                 placeholder="Transfer title (optional)"
//                                 value={form.title}
//                                 onChange={(e) => setForm({ ...form, title: e.target.value })}
//                                 className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                             />
//                             <textarea
//                                 placeholder="Add a message (optional)"
//                                 value={form.message}
//                                 onChange={(e) => setForm({ ...form, message: e.target.value })}
//                                 rows={3}
//                                 className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
//                             />

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <input
//                                     type="email"
//                                     placeholder="Recipient email (optional)"
//                                     value={form.recipientEmail}
//                                     onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
//                                     className="px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                 />
//                                 <input
//                                     type="email"
//                                     placeholder="Your email (optional)"
//                                     value={form.senderEmail}
//                                     onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
//                                     className="px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                 />
//                             </div>

//                             <Btn
//                                 onClick={() => setAdvanced({ ...advanced, showAdvanced: !advanced.showAdvanced })}
//                                 className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-700"
//                             >
//                                 <span className="flex items-center gap-2">
//                                     <Lock className="w-5 h-5 text-indigo-600" />
//                                     Advanced Security Options
//                                 </span>
//                                 <ChevronDown
//                                     className={`w-5 h-5 transition-transform ${advanced.showAdvanced ? 'rotate-180' : ''}`}
//                                 />
//                             </Btn>

//                             {advanced.showAdvanced && (
//                                 <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 space-y-4 border-2 border-indigo-100">
//                                     <div>
//                                         <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                                             <Lock className="w-5 h-5 text-indigo-600" />
//                                             Password Protection
//                                         </label>
//                                         <div className="relative">
//                                             <input
//                                                 type={advanced.showPassword ? 'text' : 'password'}
//                                                 placeholder="Set a password (optional)"
//                                                 value={advanced.password}
//                                                 onChange={(e) => setAdvanced({ ...advanced, password: e.target.value })}
//                                                 className="w-full px-5 py-3 pr-12 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                             />
//                                             <Btn
//                                                 onClick={() =>
//                                                     setAdvanced({ ...advanced, showPassword: !advanced.showPassword })
//                                                 }
//                                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                                             >
//                                                 {advanced.showPassword ? (
//                                                     <EyeOff className="w-5 h-5" />
//                                                 ) : (
//                                                     <Eye className="w-5 h-5" />
//                                                 )}
//                                             </Btn>
//                                         </div>
//                                     </div>

//                                     <div>
//                                         <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                                             <Calendar className="w-5 h-5 text-indigo-600" />
//                                             Expiration Period
//                                         </label>
//                                         <select
//                                             value={advanced.expirationDays}
//                                             onChange={(e) =>
//                                                 setAdvanced({ ...advanced, expirationDays: Number(e.target.value) })
//                                             }
//                                             className="w-full px-5 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
//                                         >
//                                             <option value={1}>1 day</option>
//                                             <option value={3}>3 days</option>
//                                             <option value={7}>7 days (Default)</option>
//                                             <option value={14}>14 days</option>
//                                             <option value={30}>30 days</option>
//                                         </select>
//                                         <p className="text-sm text-gray-600 mt-2">
//                                             Expires on: {getExpirationDate(advanced.expirationDays)}
//                                         </p>
//                                     </div>

//                                     <div>
//                                         <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                                             <Download className="w-5 h-5 text-indigo-600" />
//                                             Download Limit
//                                         </label>
//                                         <select
//                                             value={advanced.downloadLimit || ''}
//                                             onChange={(e) =>
//                                                 setAdvanced({
//                                                     ...advanced,
//                                                     downloadLimit: e.target.value ? Number(e.target.value) : null
//                                                 })
//                                             }
//                                             className="w-full px-5 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
//                                         >
//                                             <option value="">Unlimited</option>
//                                             <option value={1}>1 download</option>
//                                             <option value={5}>5 downloads</option>
//                                             <option value={10}>10 downloads</option>
//                                             <option value={25}>25 downloads</option>
//                                             <option value={50}>50 downloads</option>
//                                         </select>
//                                     </div>

//                                     <label className="flex items-center gap-3 cursor-pointer">
//                                         <input
//                                             type="checkbox"
//                                             checked={advanced.enableTracking}
//                                             onChange={(e) =>
//                                                 setAdvanced({ ...advanced, enableTracking: e.target.checked })
//                                             }
//                                             className="w-5 h-5 text-indigo-600 border-2 border-indigo-300 rounded focus:ring-indigo-500"
//                                         />
//                                         <div className="flex items-center gap-2">
//                                             <BarChart3 className="w-5 h-5 text-indigo-600" />
//                                             <span className="font-semibold text-gray-700">Enable Download Tracking</span>
//                                         </div>
//                                     </label>
//                                     <p className="text-sm text-gray-600 ml-8">Track who downloads your files and when</p>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {files.length > 0 && !isUploading && (
//                         <Btn
//                             onClick={handleTransfer}
//                             className="w-full px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
//                         >
//                             <Link2 className="w-6 h-6" />
//                             Transfer Files
//                         </Btn>
//                     )}
//                 </div>

//                 <div className="mt-8 text-center text-white/90 space-y-2">
//                     <p className="text-lg">🔒 End-to-end encrypted • 🌍 Available worldwide</p>
//                     <p className="text-sm text-white/70">Files are automatically deleted after expiration</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default BuilkTransfer;


// /* eslint-disable no-console */

// // import { useState, useRef, useEffect, FC } from 'react';
// // import {
// //     FileMetadata,
// //     TransferFormData,
// //     AdvancedOptions,
// //     ViewType
// // } from '../types/transfer.types';
// // import {
// //     useCreateTransfer,
// //     useFetchTransferData,
// //     useFetchDownloadStats,
// //     useDownloadFile
// // } from '../hooks/useTransfer';
// // import { formatFileSize, getFullShareLink } from '../utils/formatters';

// // // Import the new View components
// // import { UploadView } from './transfer/UploadView';
// // import { DownloadView } from './transfer/DownloadView';
// // import { SuccessView } from './transfer/SuccessView';

// // const BuilkTransfer: FC = () => {
// //     const [view, setView] = useState<ViewType>('upload');
// //     const [files, setFiles] = useState<FileMetadata[]>([]);
// //     const [form, setForm] = useState<TransferFormData>({ title: '', message: '', recipientEmail: '', senderEmail: '' });
// //     const [isDragging, setIsDragging] = useState<boolean>(false);
// //     const [shareLink, setShareLink] = useState<string>('');
// //     const [copied, setCopied] = useState<boolean>(false);
// //     const [error, setError] = useState<string>('');
// //     const [advanced, setAdvanced] = useState<AdvancedOptions>({
// //         password: '',
// //         showPassword: false,
// //         expirationDays: 7,
// //         downloadLimit: null,
// //         enableTracking: false,
// //         showAdvanced: false
// //     });
// //     const [enteredPassword, setEnteredPassword] = useState<string>('');
// //     const [passwordError, setPasswordError] = useState<boolean>(false);

// //     const fileInputRef = useRef<HTMLInputElement>(null);

// //     // React Query hooks
// //     const { createTransfer, uploadProgress, isLoading: isUploading, isSuccess: uploadSuccess } = useCreateTransfer();
// //     const { data: transferData, isLoading: isLoadingTransfer, error: transferError } = useFetchTransferData(shareLink, {
// //         enabled: view === 'download' && !!shareLink
// //     });
// //     const { data: statsData } = useFetchDownloadStats(shareLink, {
// //         enabled: view === 'success' && advanced.enableTracking && !!shareLink
// //     });
// //     const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

// //     // --- All Logic and Handlers remain here ---

// //     // File handling
// //     const addFiles = (newFiles: File[]) => {
// //         const filesWithMeta: FileMetadata[] = newFiles.map((file, idx) => ({
// //             id: Date.now() + idx,
// //             file,
// //             name: file.name,
// //             size: formatFileSize(file.size),
// //             rawSize: file.size,
// //             type: file.type || 'unknown'
// //         }));
// //         setFiles([...files, ...filesWithMeta]);
// //     };

// //     const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
// //         e.preventDefault();
// //         setIsDragging(true);
// //     };

// //     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
// //         e.preventDefault();
// //         setIsDragging(false);
// //     };

// //     const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
// //         e.preventDefault();
// //         setIsDragging(false);
// //         addFiles(Array.from(e.dataTransfer.files));
// //     };

// //     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
// //         if (e.target.files) {
// //             addFiles(Array.from(e.target.files));
// //         }
// //     };

// //     const removeFile = (id: number) => setFiles(files.filter(f => f.id !== id));

// //     const getTotalSize = (): string => formatFileSize(files.reduce((sum, f) => sum + f.rawSize, 0));

// //     // Transfer handling
// //     const handleTransfer = async () => {
// //         if (!files.length) return;
// //         setError('');

// //         try {
// //             const response = await createTransfer({
// //                 files: files.map(f => f.file),
// //                 title: form.title || undefined,
// //                 message: form.message || undefined,
// //                 senderEmail: form.senderEmail || undefined,
// //                 recipientEmail: form.recipientEmail || undefined,
// //                 password: advanced.password || undefined,
// //                 expirationDays: advanced.expirationDays,
// //                 downloadLimit: advanced.downloadLimit || undefined,
// //                 trackingEnabled: advanced.enableTracking
// //             });

// //             setShareLink(response.data.shareLink);
// //             setView('success');
// //         } catch (err) {
// //             console.error('Upload error:', err);
// //             setError(err instanceof Error ? err.message : 'Failed to upload files. Please try again.');
// //         }
// //     };

// //     // Download handling
// //     const handleDownloadFile = async (fileId: string, fileName: string) => {
// //         setPasswordError(false);
// //         setError('');

// //         try {
// //             await downloadFile({
// //                 transferLink: shareLink,
// //                 fileId,
// //                 fileName,
// //                 password: enteredPassword || undefined
// //             });
// //         } catch (err) {
// //             console.error('Download error:', err);
// //             if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
// //                 setPasswordError(true);
// //                 setError('Incorrect password');
// //             } else {
// //                 setError(err instanceof Error ? err.message : 'Download failed');
// //             }
// //         }
// //     };

// //     const copyToClipboard = () => {
// //         navigator.clipboard.writeText(getFullShareLink(shareLink));
// //         setCopied(true);
// //         setTimeout(() => setCopied(false), 2000);
// //     };

// //     const resetTransfer = () => {
// //         setView('upload');
// //         setFiles([]);
// //         setForm({ title: '', message: '', recipientEmail: '', senderEmail: '' });
// //         setShareLink('');
// //         setAdvanced({
// //             password: '',
// //             showPassword: false,
// //             expirationDays: 7,
// //             downloadLimit: null,
// //             enableTracking: false,
// //             showAdvanced: false
// //         });
// //         setEnteredPassword('');
// //         setPasswordError(false);
// //         setError('');
// //     };

// //     const switchToDownloadView = () => {
// //         setView('download');
// //     };

// //     // Check URL for share link on mount
// //     useEffect(() => {
// //         const params = new URLSearchParams(window.location.search);
// //         const share = params.get('share');
// //         if (share) {
// //             setShareLink(share);
// //             setView('download');
// //         }
// //     }, []);

// //     // Handle upload success
// //     useEffect(() => {
// //         if (uploadSuccess && view !== 'success') {
// //             setView('success');
// //         }
// //     }, [uploadSuccess, view]);

// //     // --- NEW COMPACT RENDER LOGIC ---

// //     // DOWNLOAD VIEW
// //     if (view === 'download') {
// //         return (
// //             <DownloadView
// //                 isLoading={isLoadingTransfer}
// //                 transferData={transferData?.data}
               
// //                 fetchError={transferError?.message || (transferData ? null : 'Failed to load transfer data')}
// //                 onDownloadFile={handleDownloadFile}
// //                 isDownloading={isDownloading}
// //                 downloadProgress={downloadProgress}
               
// //                 downloadErrorMsg={error || downloadError?.message}
// //                 enteredPassword={enteredPassword}
// //                 onPasswordChange={(val) => {
// //                     setEnteredPassword(val);
// //                     setPasswordError(false);
// //                     setError('');
// //                 }}
// //                 passwordError={passwordError}
// //                 onReset={resetTransfer}
// //             />
// //         );
// //     }

// //     // SUCCESS VIEW
// //     if (view === 'success') {
// //         return (
// //             <SuccessView
// //                 shareLink={shareLink}
// //                 stats={statsData?.data}
// //                 files={files}
// //                 advancedOptions={advanced}
// //                 totalSize={getTotalSize()}
// //                 onCopyToClipboard={copyToClipboard}
// //                 isCopied={copied}
// //                 onSwitchToDownload={switchToDownloadView}
// //                 onReset={resetTransfer}
// //             />
// //         );
// //     }

// //     // UPLOAD VIEW (default)
// //     return (
// //         <UploadView
// //             files={files}
// //             form={form}
// //             onFormChange={setForm}
// //             advanced={advanced}
// //             onAdvancedChange={setAdvanced}
// //             isDragging={isDragging}
// //             error={error}
// //             fileInputRef={fileInputRef}
// //             onDragOver={handleDragOver}
// //             onDragLeave={handleDragLeave}
// //             onDrop={handleDrop}
// //             onFileSelect={handleFileSelect}
// //             onRemoveFile={removeFile}
// //             getTotalSize={getTotalSize}
// //             isUploading={isUploading}
// //             uploadProgress={uploadProgress}
// //             onTransfer={handleTransfer}
// //         />
// //     )
// // };

// // export default BuilkTransfer;