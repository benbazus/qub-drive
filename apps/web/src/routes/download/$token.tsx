// // /* eslint-disable no-console */
// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { createFileRoute, redirect } from '@tanstack/react-router'
// // import { useState } from 'react';
// // import { Download, AlertCircle, FileText, Lock } from 'lucide-react';
// // import { formatFileSize, getDaysRemaining, isTransferExpired } from '@/utils/formatters';
// // import { useDownloadFile } from '@/hooks/useTransfer';
// // import { Alert, Btn, ProgressBar } from '@/features/BuilkTransfer/components/components';
// // import TransferEndpoint from '@/api/endpoints/transfer.endpoint';


// // // Define loader data type based on FetchTransferResponse
// // interface DownloadLoaderData {
// //   token: string;
// //   transferData: {
// //     id: string;
// //     title?: string;
// //     message?: string;
// //     senderEmail?: string;
// //     recipientEmail?: string;
// //     files: Array<{
// //       id: string;
// //       fileName: string;
// //       fileSize: number;
// //       mimeType: string;
// //       downloadUrl?: string;
// //     }>;
// //     totalSize: number;
// //     expirationDate: string;
// //     hasPassword: boolean;
// //     downloadLimit?: number;
// //     trackingEnabled: boolean;
// //     createdAt: string;
// //   };
// // }

// // // Define expected params
// // interface DownloadRouteParams {
// //   token: string;
// // }


// // export const Route = createFileRoute('/download/$token')({
// //   loader: async ({ params }: { params: DownloadRouteParams }): Promise<DownloadLoaderData> => {
// //     try {
// //       const response = await TransferEndpoint.fetchTransferData(params.token);

// //       // Check if the response indicates failure or has an error
// //       if (!response.success || response.error || !response.data) {
// //         const errorMessage = response.error || 'File not found or expired';

// //         // Check if it's a 404-like error message
// //         if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('expired')) {
// //           throw redirect({
// //             to: '/404',
// //             search: { message: errorMessage },
// //           });
// //         }

// //         // For other errors, redirect to error page
// //         throw redirect({
// //           to: '/500',
// //           search: { message: errorMessage },
// //         });
// //       }

// //       return {
// //         token: params.token,
// //         transferData: response.data
// //       };
// //     } catch {
// //       ErrorMessage()
// //     }
// //   },
// //   component: DownloadView,
// //   errorComponent: ({ error }) => (
// //     <div className="flex items-center justify-center min-h-screen bg-gray-50">
// //       <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
// //         <div className="text-center">
// //           <div className="text-red-500 text-6xl mb-4">⚠️</div>
// //           <h1 className="text-2xl font-bold text-gray-900 mb-2">
// //             Error Loading Transfer
// //           </h1>
// //           <p className="text-gray-600 mb-6">
// //             {(error as any).message || 'Failed to load transfer details'}
// //           </p>
// //           <a
// //             href="/"
// //             className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
// //           >
// //             Go to Homepage
// //           </a>
// //         </div>
// //       </div>
// //     </div>
// //   ),
// // })


// // function ErrorMessage() {
// //   return (
// //     <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
// //       <AlertCircle className="w-5 h-5 flex-shrink-0" />
// //       <span>
// //         <span className="font-semibold">Error:</span> Transfer not found or expired
// //       </span>
// //     </div>
// //   );
// // }

// // function DownloadView() {
// //   const { transferData, token } = Route.useLoaderData()

// //   const [enteredPassword, setEnteredPassword] = useState<string>('');
// //   const [passwordError, setPasswordError] = useState<boolean>(false);
// //   const [error, setError] = useState<string>('');
// //   const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

// //   const handleDownloadFile = async (fileId: string, fileName: string) => {
// //     setPasswordError(false);
// //     setError('');

// //     // Validate password if required
// //     if (transferData.hasPassword && !enteredPassword.trim()) {
// //       setPasswordError(true);
// //       setError('Please enter a password to download');
// //       return;
// //     }

// //     try {
// //       await downloadFile({
// //         transferLink: token,
// //         fileId,
// //         fileName,
// //         password: enteredPassword || undefined
// //       });
// //     } catch (err) {
// //       console.error('Download error:', err);
// //       if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
// //         setPasswordError(true);
// //         setError('Incorrect password');
// //       } else {
// //         setError(err instanceof Error ? err.message : 'Download failed');
// //       }
// //     }
// //   };

// //   const daysRemaining = getDaysRemaining(transferData.expirationDate);
// //   const isExpired = isTransferExpired(transferData.expirationDate);

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
// //       <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
// //         <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white text-center">
// //           <Download className="w-16 h-16 mx-auto mb-4" />
// //           <h1 className="text-3xl font-bold mb-2">Download Files</h1>
// //           <p className="text-blue-50">
// //             {transferData.senderEmail
// //               ? `Sent by ${transferData.senderEmail}`
// //               : 'Someone shared files with you'}
// //           </p>
// //         </div>

// //         <div className="p-8">
// //           {transferData.title && (
// //             <h2 className="text-2xl font-bold text-gray-800 mb-4">{transferData.title}</h2>
// //           )}
// //           {transferData.message && (
// //             <Alert type="info">
// //               <p className="text-gray-700">{transferData.message}</p>
// //             </Alert>
// //           )}

// //           <div className="my-6">
// //             <h3 className="font-semibold text-gray-700 mb-3">
// //               Files ({transferData.files.length})
// //             </h3>
// //             <div className="space-y-2 max-h-64 overflow-y-auto">
// //               {transferData.files.map(file => (
// //                 <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
// //                   <div className="flex items-center gap-3 flex-1 min-w-0">
// //                     <FileText className="w-5 h-5 text-blue-600" />
// //                     <div className="flex-1 min-w-0">
// //                       <p className="font-medium text-gray-800 truncate">{file.fileName}</p>
// //                       <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
// //                     </div>
// //                   </div>
// //                   <Btn
// //                     onClick={() => handleDownloadFile(file.id, file.fileName)}
// //                     disabled={isDownloading || isExpired}
// //                     className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
// //                       }`}
// //                   >
// //                     <Download className="w-4 h-4" />
// //                     {isDownloading ? 'Downloading...' : 'Download'}
// //                   </Btn>
// //                 </div>
// //               ))}
// //             </div>
// //             <p className="text-sm text-gray-600 text-center mt-3">
// //               Total size: <span className="font-semibold">{formatFileSize(transferData.totalSize)}</span>
// //             </p>
// //           </div>

// //           {!isExpired && daysRemaining <= 2 && (
// //             <Alert type="warning">
// //               <p className="font-semibold text-amber-900">Expiring Soon!</p>
// //               <p className="text-sm text-amber-700">
// //                 This transfer expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
// //               </p>
// //             </Alert>
// //           )}

// //           {transferData.hasPassword && (
// //             <div className="my-6">
// //               <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
// //                 <Lock className="w-5 h-5 text-blue-600" />
// //                 Password Required
// //               </label>
// //               <input
// //                 type="password"
// //                 placeholder="Enter password to download"
// //                 value={enteredPassword}
// //                 onChange={(e) => {
// //                   setEnteredPassword(e.target.value);
// //                   setPasswordError(false);
// //                 }}
// //                 className={`w-full px-5 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition ${passwordError ? 'border-red-500' : 'border-gray-300'
// //                   }`}
// //               />
// //               {passwordError && (
// //                 <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
// //                   <AlertCircle className="w-4 h-4" />
// //                   Incorrect password
// //                 </p>
// //               )}
// //             </div>
// //           )}

// //           {isDownloading && (
// //             <div className="my-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
// //               <div className="flex items-center justify-between mb-3">
// //                 <span className="font-semibold text-gray-700">Downloading...</span>
// //                 <span className="font-bold text-blue-600 text-xl">{downloadProgress}%</span>
// //               </div>
// //               <ProgressBar progress={downloadProgress} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
// //             </div>
// //           )}

// //           {isExpired && (
// //             <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
// //               <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
// //               <h3 className="text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
// //               <p className="text-red-700">This transfer has expired and is no longer available</p>
// //             </div>
// //           )}

// //           {(error || downloadError) && (
// //             <Alert type="error">
// //               <p className="text-red-700">{error || downloadError?.message}</p>
// //             </Alert>
// //           )}


// //         </div>
// //       </div>
// //     </div>
// //   );
// // };


// /* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { createFileRoute } from '@tanstack/react-router'
// import { useState } from 'react';
// import { Download, AlertCircle, FileText, Lock } from 'lucide-react';
// import { formatFileSize, getDaysRemaining, isTransferExpired } from '@/utils/formatters';
// import { useDownloadFile } from '@/hooks/useTransfer';
// import { Alert, Btn, ProgressBar } from '@/features/BuilkTransfer/components/components';
// import TransferEndpoint from '@/api/endpoints/transfer.endpoint';


// // Define loader data type based on FetchTransferResponse
// interface DownloadLoaderData {
//   token: string;
//   transferData: {
//     id: string;
//     title?: string;
//     message?: string;
//     senderEmail?: string;
//     recipientEmail?: string;
//     files: Array<{
//       id: string;
//       fileName: string;
//       fileSize: number;
//       mimeType: string;
//       downloadUrl?: string;
//     }>;
//     totalSize: number;
//     expirationDate: string;
//     hasPassword: boolean;
//     downloadLimit?: number;
//     trackingEnabled: boolean;
//     createdAt: string;
//   };
// }

// // Define expected params
// interface DownloadRouteParams {
//   token: string;
// }

// // Create a custom error type for better error handling
// class TransferError extends Error {
//   constructor(
//     message: string,
//     public readonly type: 'NOT_FOUND' | 'EXPIRED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN'
//   ) {
//     super(message);
//     this.name = 'TransferError';
//   }
// }

// // Error message display component
// const ErrorMessageDisplay = ({
//   type,
//   message
// }: {
//   type: TransferError['type'];
//   message: string
// }) => {
//   const errorConfig = {
//     NOT_FOUND: {
//       icon: '🔍',
//       title: 'Transfer Not Found',
//       defaultMessage: 'The file you\'re looking for doesn\'t exist or the link is invalid.',
//     },
//     EXPIRED: {
//       icon: '⏰',
//       title: 'Transfer Expired',
//       defaultMessage: 'This transfer link has expired and is no longer available.',
//     },
//     NETWORK: {
//       icon: '🌐',
//       title: 'Connection Error',
//       defaultMessage: 'Unable to connect to the server. Please check your internet connection.',
//     },
//     UNKNOWN: {
//       icon: '⚠️',
//       title: 'Something Went Wrong',
//       defaultMessage: 'An unexpected error occurred. Please try again later.',
//     },
//   };

//   const config = errorConfig[type];

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
//       <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
//         <div className="text-center">
//           <div className="text-6xl mb-4">{config.icon}</div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
//             {config.title}
//           </h1>
//           <p className="text-gray-600 mb-6">
//             {message || config.defaultMessage}
//           </p>
//           <div className="flex flex-col gap-3">
//             <a
//               href="/"
//               className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Go to Homepage
//             </a>
//             <button
//               onClick={() => window.location.reload()}
//               className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export const Route = createFileRoute('/download/$token')({
//   loader: async ({ params }: { params: DownloadRouteParams }): Promise<DownloadLoaderData> => {
//     try {
//       const response = await TransferEndpoint.fetchTransferData(params.token);

//       // Handle API response errors
//       if (!response.success || response.error || !response.data) {
//         const errorMessage = response.error || 'Transfer not available';

//         // Determine error type based on error message
//         if (errorMessage.toLowerCase().includes('not found')) {
//           throw new TransferError(
//             'The transfer you\'re looking for doesn\'t exist.',
//             'NOT_FOUND'
//           );
//         }

//         if (errorMessage.toLowerCase().includes('expired')) {
//           throw new TransferError(
//             'This transfer link has expired.',
//             'EXPIRED'
//           );
//         }

//         // Generic error for other cases
//         throw new TransferError(
//           'Unable to load transfer details. Please try again.',
//           'UNKNOWN'
//         );
//       }

//       return {
//         token: params.token,
//         transferData: response.data
//       };
//     } catch (error) {
//       // Handle network errors
//       if (error instanceof TypeError && error.message.includes('fetch')) {
//         throw new TransferError(
//           'Unable to connect. Please check your internet connection.',
//           'NETWORK'
//         );
//       }

//       // Re-throw TransferError as-is
//       if (error instanceof TransferError) {
//         throw error;
//       }

//       // Catch-all for unexpected errors
//       throw new TransferError(
//         'An unexpected error occurred. Please try again later.',
//         'UNKNOWN'
//       );
//     }
//   },
//   component: DownloadView,
//   errorComponent: ({ error }) => {
//     const transferError = error instanceof TransferError
//       ? error
//       : new TransferError('An unexpected error occurred', 'UNKNOWN');

//     return (
//       <ErrorMessageDisplay
//         type={transferError.type}
//         message={transferError.message}
//       />
//     );
//   },
// });

// function DownloadView() {
//   const { transferData, token } = Route.useLoaderData()

//   const [enteredPassword, setEnteredPassword] = useState<string>('');
//   const [passwordError, setPasswordError] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

//   const handleDownloadFile = async (fileId: string, fileName: string) => {
//     setPasswordError(false);
//     setError('');

//     // Validate password if required
//     if (transferData.hasPassword && !enteredPassword.trim()) {
//       setPasswordError(true);
//       setError('Please enter a password to download');
//       return;
//     }

//     try {
//       await downloadFile({
//         transferLink: token,
//         fileId,
//         fileName,
//         password: enteredPassword || undefined
//       });
//     } catch (err) {
//       console.error('Download error:', err);
//       if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
//         setPasswordError(true);
//         setError('Incorrect password');
//       } else {
//         setError(err instanceof Error ? err.message : 'Download failed');
//       }
//     }
//   };

//   const daysRemaining = getDaysRemaining(transferData.expirationDate);
//   const isExpired = isTransferExpired(transferData.expirationDate);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
//       <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white text-center">
//           <Download className="w-16 h-16 mx-auto mb-4" />
//           <h1 className="text-3xl font-bold mb-2">Download Files</h1>
//           <p className="text-blue-50">
//             {transferData.senderEmail
//               ? `Sent by ${transferData.senderEmail}`
//               : 'Someone shared files with you'}
//           </p>
//         </div>

//         <div className="p-8">
//           {transferData.title && (
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">{transferData.title}</h2>
//           )}
//           {transferData.message && (
//             <Alert type="info">
//               <p className="text-gray-700">{transferData.message}</p>
//             </Alert>
//           )}

//           <div className="my-6">
//             <h3 className="font-semibold text-gray-700 mb-3">
//               Files ({transferData.files.length})
//             </h3>
//             <div className="space-y-2 max-h-64 overflow-y-auto">
//               {transferData.files.map(file => (
//                 <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
//                   <div className="flex items-center gap-3 flex-1 min-w-0">
//                     <FileText className="w-5 h-5 text-blue-600" />
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-gray-800 truncate">{file.fileName}</p>
//                       <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
//                     </div>
//                   </div>
//                   <Btn
//                     onClick={() => handleDownloadFile(file.id, file.fileName)}
//                     disabled={isDownloading || isExpired}
//                     className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
//                       }`}
//                   >
//                     <Download className="w-4 h-4" />
//                     {isDownloading ? 'Downloading...' : 'Download'}
//                   </Btn>
//                 </div>
//               ))}
//             </div>
//             <p className="text-sm text-gray-600 text-center mt-3">
//               Total size: <span className="font-semibold">{formatFileSize(transferData.totalSize)}</span>
//             </p>
//           </div>

//           {!isExpired && daysRemaining <= 2 && (
//             <Alert type="warning">
//               <p className="font-semibold text-amber-900">Expiring Soon!</p>
//               <p className="text-sm text-amber-700">
//                 This transfer expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
//               </p>
//             </Alert>
//           )}

//           {transferData.hasPassword && (
//             <div className="my-6">
//               <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
//                 <Lock className="w-5 h-5 text-blue-600" />
//                 Password Required
//               </label>
//               <input
//                 type="password"
//                 placeholder="Enter password to download"
//                 value={enteredPassword}
//                 onChange={(e) => {
//                   setEnteredPassword(e.target.value);
//                   setPasswordError(false);
//                 }}
//                 className={`w-full px-5 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition ${passwordError ? 'border-red-500' : 'border-gray-300'
//                   }`}
//               />
//               {passwordError && (
//                 <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
//                   <AlertCircle className="w-4 h-4" />
//                   Incorrect password
//                 </p>
//               )}
//             </div>
//           )}

//           {isDownloading && (
//             <div className="my-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="font-semibold text-gray-700">Downloading...</span>
//                 <span className="font-bold text-blue-600 text-xl">{downloadProgress}%</span>
//               </div>
//               <ProgressBar progress={downloadProgress} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
//             </div>
//           )}

//           {isExpired && (
//             <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//               <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
//               <h3 className="text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
//               <p className="text-red-700">This transfer has expired and is no longer available</p>
//             </div>
//           )}

//           {(error || downloadError) && (
//             <Alert type="error">
//               <p className="text-red-700">{error || downloadError?.message}</p>
//             </Alert>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Download, AlertCircle, FileText, Lock } from 'lucide-react';
import { formatFileSize, getDaysRemaining, isTransferExpired } from '@/utils/formatters';
import { useDownloadFile } from '@/hooks/useTransfer';
import { Alert, Btn, ProgressBar } from '@/features/BuilkTransfer/components/components';
import TransferEndpoint from '@/api/endpoints/transfer.endpoint';

// Define loader data type based on FetchTransferResponse
interface DownloadLoaderData {
  token: string;
  transferData: {
    id: string;
    title?: string;
    message?: string;
    senderEmail?: string;
    recipientEmail?: string;
    files: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      downloadUrl?: string;
    }>;
    totalSize: number;
    expirationDate: string;
    hasPassword: boolean;
    downloadLimit?: number;
    trackingEnabled: boolean;
    createdAt: string;
  };
}

// Define expected params
interface DownloadRouteParams {
  token: string;
}

// Create a custom error type for better error handling
class TransferError extends Error {
  constructor(
    message: string,
    public readonly type: 'NOT_FOUND' | 'EXPIRED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

// Error message display component
const ErrorMessageDisplay = ({
  type,
  message
}: {
  type: TransferError['type'];
  message: string
}) => {
  const errorConfig = {
    NOT_FOUND: {
      icon: '🔍',
      title: 'Transfer Not Found',
      defaultMessage: 'The file you\'re looking for doesn\'t exist or the link is invalid.',
    },
    EXPIRED: {
      icon: '⏰',
      title: 'Transfer Expired',
      defaultMessage: 'This transfer link has expired and is no longer available.',
    },
    NETWORK: {
      icon: '🌐',
      title: 'Connection Error',
      defaultMessage: 'Unable to connect to the server. Please check your internet connection.',
    },
    UNKNOWN: {
      icon: '⚠️',
      title: 'Something Went Wrong',
      defaultMessage: 'An unexpected error occurred. Please try again later.',
    },
  };

  const config = errorConfig[type];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 sm:p-8">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">{config.icon}</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {message || config.defaultMessage}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Go to Homepage
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/download/$token')({
  loader: async ({ params }: { params: DownloadRouteParams }): Promise<DownloadLoaderData> => {
    try {
      const response = await TransferEndpoint.fetchTransferData(params.token);

      // Handle API response errors
      if (!response.success || response.error || !response.data) {
        const errorMessage = response.error || 'Transfer not available';

        // Determine error type based on error message
        if (errorMessage.toLowerCase().includes('not found')) {
          throw new TransferError(
            'The transfer you\'re looking for doesn\'t exist.',
            'NOT_FOUND'
          );
        }

        if (errorMessage.toLowerCase().includes('expired')) {
          throw new TransferError(
            'This transfer link has expired.',
            'EXPIRED'
          );
        }

        // Generic error for other cases
        throw new TransferError(
          'Unable to load transfer details. Please try again.',
          'UNKNOWN'
        );
      }

      return {
        token: params.token,
        transferData: response.data
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TransferError(
          'Unable to connect. Please check your internet connection.',
          'NETWORK'
        );
      }

      // Re-throw TransferError as-is
      if (error instanceof TransferError) {
        throw error;
      }

      // Catch-all for unexpected errors
      throw new TransferError(
        'An unexpected error occurred. Please try again later.',
        'UNKNOWN'
      );
    }
  },
  component: DownloadView,
  errorComponent: ({ error }) => {
    const transferError = error instanceof TransferError
      ? error
      : new TransferError('An unexpected error occurred', 'UNKNOWN');

    return (
      <ErrorMessageDisplay
        type={transferError.type}
        message={transferError.message}
      />
    );
  },
});

function DownloadView() {
  const { transferData, token } = Route.useLoaderData()

  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { downloadFile, downloadProgress, isDownloading, error: downloadError } = useDownloadFile();

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    setPasswordError(false);
    setError('');

    // Validate password if required
    if (transferData.hasPassword && !enteredPassword.trim()) {
      setPasswordError(true);
      setError('Please enter a password to download');
      return;
    }

    try {
      await downloadFile({
        transferLink: token,
        fileId,
        fileName,
        password: enteredPassword || undefined
      });
    } catch (err) {
      console.error('Download error:', err);
      if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
        setPasswordError(true);
        setError('Incorrect password');
      } else {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    }
  };

  const daysRemaining = getDaysRemaining(transferData.expirationDate);
  const isExpired = isTransferExpired(transferData.expirationDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-3 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 sm:p-8 text-white text-center">
          <Download className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Download Files</h1>
          <p className="text-sm sm:text-base text-blue-50">
            {transferData.senderEmail
              ? `Sent by ${transferData.senderEmail}`
              : 'Someone shared files with you'}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Title */}
          {transferData.title && (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{transferData.title}</h2>
          )}

          {/* Message */}
          {transferData.message && (
            <Alert type="info">
              <p className="text-sm sm:text-base text-gray-700">{transferData.message}</p>
            </Alert>
          )}

          {/* Files List */}
          <div className="my-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
              Files ({transferData.files.length})
            </h3>
            <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
              {transferData.files.map(file => (
                <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm sm:text-base">{file.fileName}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
                    </div>
                  </div>
                  <Btn
                    onClick={() => handleDownloadFile(file.id, file.fileName)}
                    disabled={isDownloading || isExpired}
                    className={`w-full sm:w-auto sm:ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base ${isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </Btn>
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 text-center mt-3">
              Total size: <span className="font-semibold">{formatFileSize(transferData.totalSize)}</span>
            </p>
          </div>

          {/* Expiring Soon Warning */}
          {!isExpired && daysRemaining <= 2 && (
            <Alert type="warning">
              <p className="font-semibold text-amber-900 text-sm sm:text-base">Expiring Soon!</p>
              <p className="text-xs sm:text-sm text-amber-700">
                This transfer expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
              </p>
            </Alert>
          )}

          {/* Password Input */}
          {transferData.hasPassword && (
            <div className="my-6">
              <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Password Required
              </label>
              <input
                type="password"
                placeholder="Enter password to download"
                value={enteredPassword}
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base ${passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {passwordError && (
                <p className="text-red-600 text-xs sm:text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Incorrect password
                </p>
              )}
            </div>
          )}

          {/* Download Progress */}
          {isDownloading && (
            <div className="my-6 bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700 text-sm sm:text-base">Downloading...</span>
                <span className="font-bold text-blue-600 text-lg sm:text-xl">{downloadProgress}%</span>
              </div>
              <ProgressBar progress={downloadProgress} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
            </div>
          )}

          {/* Expired Message */}
          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 text-center">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
              <p className="text-sm sm:text-base text-red-700">This transfer has expired and is no longer available</p>
            </div>
          )}

          {/* Error Display */}
          {(error || downloadError) && (
            <Alert type="error">
              <p className="text-sm sm:text-base text-red-700">{error || downloadError?.message}</p>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}