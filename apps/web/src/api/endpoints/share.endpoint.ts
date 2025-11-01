/* eslint-disable no-console */
import { apiClient } from '../api.client';
import {
    CreateShareRequest,
    CreateShareResponse,
    FetchShareResponse,
    FetchStatsResponse,
    DownloadFileRequest
} from '@/types/share.types';



export const ShareEndpoint = {

    createShare: async (request: CreateShareRequest, onProgress?: (progress: number) => void): Promise<CreateShareResponse> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // Append metadata
            if (request.message) formData.append('message', request.message);
            if (request.recipientEmail) formData.append('recipientEmail', request.recipientEmail);
            if (request.password) formData.append('password', request.password);
            formData.append('expirationDays', request.expirationDays);
            formData.append('fileId', request.fileId);

            const xhr = new XMLHttpRequest();

            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        onProgress(progress);
                    }
                });
            }

            // Success handler
            xhr.addEventListener('load', () => {
                if (xhr.status === 201) {
                    try {
                        const response = JSON.parse(xhr.responseText) as CreateShareResponse;
                        console.log(" @@@@@@@@@@@@@@@ ")
                        console.log(response)
                        console.log(" @@@@@@@@@@@@@@@ ")


                        resolve(response);
                    } catch {
                        reject(new Error('Failed to parse response'));
                    }
                } else {
                    reject(new Error('Upload failed. Please try again.'));
                }
            });

            // Error handler
            xhr.addEventListener('error', () => {
                reject(new Error('Network error. Please check your connection.'));
            });

            xhr.open('POST', `http://localhost:5001/api/shares`);
            xhr.send(formData);
        });
    },
    fetchShareData: async (shareLink: string): Promise<FetchShareResponse> => {
        const response = await apiClient.get(`/shares/${shareLink}`);

        // Handle error case from apiClient
        if (response.error) {
            return {
                success: false,
                data: null,
                error: response.error
            };
        }

        // Handle success case - response.data contains the actual API response
        return response.data as FetchShareResponse;
    },
    fetchDownloadStats: async (shareLink: string): Promise<FetchStatsResponse> => {
        const response = await apiClient.get(`/shares/${shareLink}/stats`);

        // Handle error case from apiClient
        if (response.error) {
            return {
                success: false,
                data: null,
                error: response.error
            };
        }

        // Handle success case - response.data contains the actual API response
        return response.data as FetchStatsResponse;
    },
    downloadFile: async (request: DownloadFileRequest, onProgress?: (progress: number) => void): Promise<Blob> => {
        const passwordParam = request.password
            ? `?password=${encodeURIComponent(request.password)}`
            : '';

        // Make request with responseType: 'blob' to handle binary data
        const url = `http://localhost:5001/api/shares/${request.shareLink}/files/${request.fileId}${passwordParam}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Download failed with status ${response.status}`);
        }

        // Get content type and length from response headers
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (!response.body) {
            throw new Error('Response body is empty');
        }

        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let loaded = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            if (total && onProgress) {
                const progress = Math.round((loaded / total) * 100);
                onProgress(progress);
            }
        }

        // Create blob with proper MIME type from response headers
        return new Blob(chunks, { type: contentType });
    },
    triggerBrowserDownload: (blob: Blob, fileName: string): void => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

export default ShareEndpoint;