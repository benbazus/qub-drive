// /* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { FC, useState } from 'react';
// import { Download, AlertCircle, FileText, Lock } from 'lucide-react';
// import { Alert, Btn, ProgressBar } from './components';
// import { formatFileSize, getDaysRemaining, isTransferExpired } from '@/utils/formatters';
// import { useDownloadFile } from '@/hooks/useTransfer';

// interface DownloadViewProps {
//     transferData: any;
//     shareLink: string;
//     isLoadingTransfer: boolean;
//     transferError: any;

// }

// export const DownloadView: FC<DownloadViewProps> = ({
//     transferData,
//     shareLink,
//     isLoadingTransfer,
//     transferError,

// }) => {
//     const [enteredPassword, setEnteredPassword] = useState<string>('');
//     const [passwordError, setPasswordError] = useState<boolean>(false);
//     const [error, setError] = useState<string>('');
//     const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

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

//     if (isLoadingTransfer) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6 flex items-center justify-center">
//                 <div className="text-white text-xl">Loading...</div>
//             </div>
//         );
//     }

//     if (transferError || !transferData) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
//                 <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center">
//                     <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
//                     <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
//                     <p className="text-gray-600 mb-6">
//                         {transferError?.message || 'Failed to load transfer data'}
//                     </p>

//                 </div>
//             </div>
//         );
//     }

//     const daysRemaining = getDaysRemaining(transferData.data.expirationDate);
//     const isExpired = isTransferExpired(transferData.data.expirationDate);

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
//             <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
//                 <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white text-center">
//                     <Download className="w-16 h-16 mx-auto mb-4" />
//                     <h1 className="text-3xl font-bold mb-2">Download Files</h1>
//                     <p className="text-blue-50">
//                         {transferData.data.senderEmail
//                             ? `Sent by ${transferData.data.senderEmail}`
//                             : 'Someone shared files with you'}
//                     </p>
//                 </div>

//                 <div className="p-8">
//                     {transferData.data.title && (
//                         <h2 className="text-2xl font-bold text-gray-800 mb-4">{transferData.data.title}</h2>
//                     )}
//                     {transferData.data.message && (
//                         <Alert type="info">
//                             <p className="text-gray-700">{transferData.data.message}</p>
//                         </Alert>
//                     )}

//                     <div className="my-6">
//                         <h3 className="font-semibold text-gray-700 mb-3">
//                             Files ({transferData.data.files.length})
//                         </h3>
//                         <div className="space-y-2 max-h-64 overflow-y-auto">
//                             {transferData.data.files.map(file => (
//                                 <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
//                                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                                         <FileText className="w-5 h-5 text-blue-600" />
//                                         <div className="flex-1 min-w-0">
//                                             <p className="font-medium text-gray-800 truncate">{file.fileName}</p>
//                                             <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
//                                         </div>
//                                     </div>
//                                     <Btn
//                                         onClick={() => handleDownloadFile(file.id, file.fileName)}
//                                         disabled={isDownloading || isExpired}
//                                         className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
//                                             }`}
//                                     >
//                                         <Download className="w-4 h-4" />
//                                         {isDownloading ? 'Downloading...' : 'Download'}
//                                     </Btn>
//                                 </div>
//                             ))}
//                         </div>
//                         <p className="text-sm text-gray-600 text-center mt-3">
//                             Total size: <span className="font-semibold">{formatFileSize(transferData.data.totalSize)}</span>
//                         </p>
//                     </div>

//                     {!isExpired && daysRemaining <= 2 && (
//                         <Alert type="warning">
//                             <p className="font-semibold text-amber-900">Expiring Soon!</p>
//                             <p className="text-sm text-amber-700">
//                                 This transfer expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
//                             </p>
//                         </Alert>
//                     )}

//                     {transferData.data.hasPassword && (
//                         <div className="my-6">
//                             <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                                 <Lock className="w-5 h-5 text-blue-600" />
//                                 Password Required
//                             </label>
//                             <input
//                                 type="password"
//                                 placeholder="Enter password to download"
//                                 value={enteredPassword}
//                                 onChange={(e) => {
//                                     setEnteredPassword(e.target.value);
//                                     setPasswordError(false);
//                                 }}
//                                 className={`w-full px-5 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition ${passwordError ? 'border-red-500' : 'border-gray-300'
//                                     }`}
//                             />
//                             {passwordError && (
//                                 <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
//                                     <AlertCircle className="w-4 h-4" />
//                                     Incorrect password
//                                 </p>
//                             )}
//                         </div>
//                     )}

//                     {isDownloading && (
//                         <div className="my-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
//                             <div className="flex items-center justify-between mb-3">
//                                 <span className="font-semibold text-gray-700">Downloading...</span>
//                                 <span className="font-bold text-blue-600 text-xl">{downloadProgress}%</span>
//                             </div>
//                             <ProgressBar progress={downloadProgress} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
//                         </div>
//                     )}

//                     {isExpired && (
//                         <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//                             <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
//                             <h3 className="text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
//                             <p className="text-red-700">This transfer has expired and is no longer available</p>
//                         </div>
//                     )}

//                     {(error || downloadError) && (
//                         <Alert type="error">
//                             <p className="text-red-700">{error || downloadError?.message}</p>
//                         </Alert>
//                     )}


//                 </div>
//             </div>
//         </div>
//     );
// };
