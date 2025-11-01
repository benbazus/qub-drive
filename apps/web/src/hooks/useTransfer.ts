/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { CreateTransferRequest, FetchTransferResponse, FetchStatsResponse, DownloadFileRequest } from '../types/transfer.types';
import { useState, useCallback } from 'react';
import TransferEndpoint from '@/api/endpoints/transfer.endpoint';

/**
 * Hook for creating a new transfer with upload progress tracking
 */
export const useCreateTransfer = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (request: CreateTransferRequest) =>
            TransferEndpoint.createTransfer(request, setUploadProgress),
        onSuccess: (data) => {
            console.log(" PPPPPPPPPPPPPPPPPPPPPP ")
            console.log(data.data)
            console.log(" PPPPPPPPPPPPPPPPPPPPPP ")
            // Invalidate and refetch any relevant queries
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            setUploadProgress(0);
        },
        onError: () => {
            setUploadProgress(0);
        }
    });

    return {
        ...mutation,
        uploadProgress,
        createTransfer: mutation.mutate,
        createTransferAsync: mutation.mutateAsync
    };
};

/**
 * Hook for fetching transfer data
 */
export const useFetchTransferData = (
    shareLink: string,
    options?: Omit<UseQueryOptions<FetchTransferResponse, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['transfer', shareLink],
        queryFn: () => TransferEndpoint.fetchTransferData(shareLink),
        enabled: !!shareLink,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on 404 or 403 errors
            if (error instanceof Error && (error.message.includes('404') || error.message.includes('403'))) {
                return false;
            }
            return failureCount < 2;
        },
        ...options
    });
};

/**
 * Hook for fetching download statistics
 */
export const useFetchDownloadStats = (
    shareLink: string,
    options?: Omit<UseQueryOptions<FetchStatsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['transfer-stats', shareLink],
        queryFn: () => TransferEndpoint.fetchDownloadStats(shareLink),
        enabled: !!shareLink,
        refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
        staleTime: 1000 * 60, // 1 minute
        ...options
    });
};

/**
 * Hook for downloading files with progress tracking
 */
export const useDownloadFile = () => {
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const mutation = useMutation({
        mutationFn: async (request: DownloadFileRequest & { fileName: string }) => {
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
                const blob = await TransferEndpoint.downloadFile(
                    {
                        transferLink: request.transferLink,
                        fileId: request.fileId,
                        password: request.password
                    },
                    setDownloadProgress
                );


                return { blob, fileName: request.fileName };
            } catch (error: any) {

                // if (error.message === "No response from server. Please check your network connection") {
                //     console.log(" 2222222222YYYYYYYY222222222222222 ")
                //     console.log(error)
                //     console.log(" 222222222YYYYYY222222222222222 ")
                // }
                // else {
                //     console.log(" 1111111111RRRRRRRRRRRRR1111111111111111 ")
                //     console.log(error)
                //     console.log(" 11111111111RRRRRRRRRR111111111111111 ")
                setIsDownloading(false);
                setDownloadProgress(0);
                throw error;
                // }
            }
        },
        onSuccess: (data) => {

            TransferEndpoint.triggerBrowserDownload(data.blob, data.fileName);
            setIsDownloading(false);
            setDownloadProgress(0);
        },
        onError: (error) => {
            if (error.message === "No response from server. Please check your network connection") {
                console.log(" 2222222222YYYYYYYY222222222222222 ")
                console.log(error)
                console.log(" 222222222YYYYYY222222222222222 ")
            }
            else {
                setIsDownloading(false);
                setDownloadProgress(0);
            }
        }
    });

    return {
        ...mutation,
        downloadProgress,
        isDownloading,
        downloadFile: mutation.mutate,
        downloadFileAsync: mutation.mutateAsync
    };
};

/**
 * Hook for manual refetching of download stats
 */
export const useRefetchDownloadStats = () => {
    const queryClient = useQueryClient();

    return (shareLink: string) => {
        return queryClient.invalidateQueries({ queryKey: ['transfer-stats', shareLink] });
    };
};

/**
 * Hook for invalidating transfer data cache
 */
export const useInvalidateTransfer = () => {
    const queryClient = useQueryClient();

    return (shareLink: string) => {
        return queryClient.invalidateQueries({ queryKey: ['transfer', shareLink] });
    };
};

/**
 * Hook for fetching file/transfer data by token
 * Used for public file sharing with token-based access
 */
export const useGetFileByToken = (token: string, options?: Omit<UseQueryOptions<FetchTransferResponse, Error>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['file-by-token', token],
        queryFn: () => TransferEndpoint.fetchTransferData(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        ...options
    });
};

/**
 * Hook for downloading multiple files at once
 */
export const useDownloadAllFiles = () => {
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [isDownloading, setIsDownloading] = useState(false);
    const [completedFiles, setCompletedFiles] = useState<string[]>([]);
    const [failedFiles, setFailedFiles] = useState<Array<{ fileId: string; fileName: string; error: string }>>([]);

    const downloadAll = useCallback(async (
        files: Array<{ id: string; fileName: string }>,
        transferLink: string,
        password?: string
    ) => {
        setIsDownloading(true);
        setCompletedFiles([]);
        setFailedFiles([]);
        setDownloadProgress({});

        const downloadPromises = files.map(async (file) => {
            try {
                const blob = await TransferEndpoint.downloadFile(
                    {
                        transferLink,
                        fileId: file.id,
                        password
                    },
                    (progress) => {
                        setDownloadProgress(prev => ({
                            ...prev,
                            [file.id]: progress
                        }));
                    }
                );

                TransferEndpoint.triggerBrowserDownload(blob, file.fileName);
                setCompletedFiles(prev => [...prev, file.id]);
                return { success: true, fileId: file.id };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Download failed';
                setFailedFiles(prev => [...prev, { fileId: file.id, fileName: file.fileName, error: errorMessage }]);
                return { success: false, fileId: file.id, error: errorMessage };
            }
        });

        const results = await Promise.allSettled(downloadPromises);
        setIsDownloading(false);

        return results;
    }, []);

    const reset = useCallback(() => {
        setDownloadProgress({});
        setCompletedFiles([]);
        setFailedFiles([]);
        setIsDownloading(false);
    }, []);

    return {
        downloadAll,
        downloadProgress,
        isDownloading,
        completedFiles,
        failedFiles,
        reset
    };
};
