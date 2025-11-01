/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { CreateShareRequest, FetchShareResponse, FetchStatsResponse, DownloadFileRequest } from '../types/share.types';
import { useState, useCallback } from 'react';
import ShareEndpoint from '@/api/endpoints/share.endpoint';
import fileEndpoint from '@/api/endpoints/file.endpoint';

/**
 * Hook for creating a new share with upload progress tracking
 */
export const useCreateShareMutation = (
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void
) => {
    const createShareMutation = useMutation({
        mutationFn: async (request: CreateShareRequest) => {
            return fileEndpoint.createShare(request);
        },
        onSuccess: (result) => {
            onSuccess?.(result);
        },
        onError: (error) => {
            console.error('Share creation failed:', error);
            onError?.(error as Error);
        },
    });
    return createShareMutation;
};


//   // Folder creation mutation
//   const createFolderMutation = useMutation({
//     mutationFn: async (options: CreateFolderOptions) => {
//       return fileOperationsService.createFolder({
//         ...options,
//         parentId: options.parentId ?? getParentFolder,
//       });
//     },
//     onSuccess: (result) => {
//       invalidateFileQueries();
//       onSuccess?.(result);
//     },
//     onError: (error) => {
//       console.error('Folder creation failed:', error);
//       onError?.(error as Error);
//     },
//   });

/**
 * Hook for fetching share data
 */
export const useFetchShareData = (
    shareLink: string,
    options?: Omit<UseQueryOptions<FetchShareResponse, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['share', shareLink],
        queryFn: () => ShareEndpoint.fetchShareData(shareLink),
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
        queryKey: ['share-stats', shareLink],
        queryFn: () => ShareEndpoint.fetchDownloadStats(shareLink),
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
                const blob = await ShareEndpoint.downloadFile(
                    {
                        shareLink: request.shareLink,
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

            ShareEndpoint.triggerBrowserDownload(data.blob, data.fileName);
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
        return queryClient.invalidateQueries({ queryKey: ['share-stats', shareLink] });
    };
};

/**
 * Hook for invalidating share data cache
 */
export const useInvalidateShare = () => {
    const queryClient = useQueryClient();

    return (shareLink: string) => {
        return queryClient.invalidateQueries({ queryKey: ['share', shareLink] });
    };
};

/**
 * Hook for fetching file/share data by token
 * Used for public file sharing with token-based access
 */
export const useGetFileByToken = (token: string, options?: Omit<UseQueryOptions<FetchShareResponse, Error>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['file-by-token', token],
        queryFn: () => ShareEndpoint.fetchShareData(token),
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
        shareLink: string,
        password?: string
    ) => {
        setIsDownloading(true);
        setCompletedFiles([]);
        setFailedFiles([]);
        setDownloadProgress({});

        const downloadPromises = files.map(async (file) => {
            try {
                const blob = await ShareEndpoint.downloadFile(
                    {
                        shareLink,
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

                ShareEndpoint.triggerBrowserDownload(blob, file.fileName);
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
