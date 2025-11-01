// /* eslint-disable no-console */
// import {
//     CreateTransferRequest,
//     CreateTransferResponse,
//     FetchTransferResponse,
//     FetchStatsResponse,
//     DownloadFileRequest
// } from '../types/transfer.types';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// export class TransferService {
//     /**
//      * Create a new file transfer
//      */
//     static async createTransfer(request: CreateTransferRequest, onProgress?: (progress: number) => void): Promise<CreateTransferResponse> {
//         return new Promise((resolve, reject) => {
//             const formData = new FormData();

//             console.log(" @@@@@@@@@@@@@@@ ")
//             // Append files
//             request.files.forEach(file => formData.append('files', file));

//             // Append metadata
//             if (request.title) formData.append('title', request.title);
//             if (request.message) formData.append('message', request.message);
//             if (request.senderEmail) formData.append('senderEmail', request.senderEmail);
//             if (request.recipientEmail) formData.append('recipientEmail', request.recipientEmail);
//             if (request.password) formData.append('password', request.password);
//             formData.append('expirationDays', request.expirationDays.toString());
//             if (request.downloadLimit) formData.append('downloadLimit', request.downloadLimit.toString());
//             formData.append('trackingEnabled', request.trackingEnabled.toString());

//             const xhr = new XMLHttpRequest();

//             // Progress tracking
//             if (onProgress) {
//                 xhr.upload.addEventListener('progress', (e) => {
//                     if (e.lengthComputable) {
//                         const progress = Math.round((e.loaded / e.total) * 100);
//                         onProgress(progress);
//                     }
//                 });
//             }

//             // Success handler
//             xhr.addEventListener('load', () => {
//                 if (xhr.status === 201) {
//                     try {
//                         const response = JSON.parse(xhr.responseText) as CreateTransferResponse;
//                         resolve(response);
//                     } catch {
//                         reject(new Error('Failed to parse response'));
//                     }
//                 } else {
//                     reject(new Error('Upload failed. Please try again.'));
//                 }
//             });

//             // Error handler
//             xhr.addEventListener('error', () => {
//                 reject(new Error('Network error. Please check your connection.'));
//             });

//             xhr.open('POST', `${API_BASE_URL}/transfers`);
//             xhr.send(formData);
//         });
//     }

//     /**
//      * Fetch transfer data by share link
//      */
//     static async fetchTransferData(shareLink: string): Promise<FetchTransferResponse> {
//         try {
//             const response = await fetch(`${API_BASE_URL}/transfers/${shareLink}`);
//             const data = await response.json();

//             if (!response.ok) {
//                 throw new Error(data.error || 'Failed to fetch transfer');
//             }

//             return data;
//         } catch (error) {
//             throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
//         }
//     }

//     /**
//      * Fetch download statistics for a transfer
//      */
//     static async fetchDownloadStats(shareLink: string): Promise<FetchStatsResponse> {
//         try {
//             const response = await fetch(`${API_BASE_URL}/transfers/${shareLink}/stats`);
//             const data = await response.json();

//             if (!response.ok) {
//                 throw new Error(data.error || 'Failed to fetch stats');
//             }

//             return data;
//         } catch (error) {
//             throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
//         }
//     }

//     /**
//      * Download a file from a transfer
//      */
//     static async downloadFile(
//         request: DownloadFileRequest,
//         onProgress?: (progress: number) => void
//     ): Promise<Blob> {
//         const passwordParam = request.password
//             ? `?password=${encodeURIComponent(request.password)}`
//             : '';

//         const response = await fetch(
//             `${API_BASE_URL}/transfers/${request.transferLink}/files/${request.fileId}${passwordParam}`
//         );

//         if (!response.ok) {
//             if (response.status === 400) {
//                 throw new Error('INVALID_PASSWORD');
//             }
//             throw new Error('Download failed');
//         }

//         const contentLength = response.headers.get('content-length');
//         const total = contentLength ? parseInt(contentLength, 10) : 0;

//         if (!response.body) {
//             throw new Error('Response body is empty');
//         }

//         const reader = response.body.getReader();
//         const chunks: Uint8Array[] = [];
//         let loaded = 0;

//         while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             chunks.push(value);
//             loaded += value.length;

//             if (total && onProgress) {
//                 const progress = Math.round((loaded / total) * 100);
//                 onProgress(progress);
//             }
//         }

//         return new Blob(chunks);
//     }

//     /**
//      * Trigger browser download for a blob
//      */
//     static triggerBrowserDownload(blob: Blob, fileName: string): void {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = fileName;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//     }
// }
