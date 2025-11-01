

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/auth';
import React from 'react';
import storageEndpoint from '@/api/endpoints/storage.endpoint';

export interface StorageBreakdown {
    documents: number;
    images: number;
    videos: number;
    audio: number;
}

export interface StorageData {
    usedStorage: number;
    totalStorage: number;
    breakdown: StorageBreakdown;
}

export const storageKeys = {
    all: ['storage'] as const,
    user: () => ['storage'] as const,
    detailed: () => ['storage', 'detailed'] as const,
    dateRange: (startDate: string, endDate: string) =>
        ['storage', 'range', startDate, endDate] as const,
};

export const useStorageStats = (enabled: boolean = true) => {
    return useQuery({
        queryKey: storageKeys.user(),
        queryFn: () => storageEndpoint.getStorageStats(),
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

export const useDetailedStorageStats = (enabled: boolean = true) => {
    return useQuery({
        queryKey: storageKeys.detailed(),
        queryFn: () => storageEndpoint.getDetailedStorageStats(),
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

export const useStorageByDateRange = (startDate: string, endDate: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: storageKeys.dateRange(startDate, endDate),
        queryFn: () => storageEndpoint.getStorageByDateRange({ startDate, endDate }),
        enabled: enabled && !!startDate && !!endDate,
        staleTime: 2 * 60 * 1000,
        retry: 1,
    });
};

export const useStorageOperations = () => {
    const queryClient = useQueryClient();

    const refreshStorageCache = useMutation({
        mutationFn: () => storageEndpoint.refreshStorageCache(),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === 'storage',
            });
        },
    });

    const invalidateStorageQueries = () => {
        queryClient.invalidateQueries({
            queryKey: storageKeys.user(),
        });
    };

    const refetchStorageStats = () => {
        queryClient.refetchQueries({
            queryKey: storageKeys.user(),
        });
    };

    return {
        refreshStorageCache,
        invalidateStorageQueries,
        refetchStorageStats,
    };
};

export const useStoragePercentage = () => {
    const { data: storageData, isLoading } = useStorageStats();

    const storagePercentage = Number(storageData)
        ? Math.round((Number(storageData.usedStorage) / Number(storageData.totalStorage)) * 100)
        : 0;

    return {
        percentage: storagePercentage,
        isNearLimit: storagePercentage >= 80,
        isAtLimit: storagePercentage >= 95,
        remainingStorage: storageData ? Number(storageData.totalStorage) - Number(storageData.usedStorage) : 0,
        isLoading,
    };
};

export const useOptimisticStorageUpdate = () => {
    const queryClient = useQueryClient();

    const updateStorageOptimistically = (fileSizeGB: number, fileType: keyof StorageBreakdown) => {
        queryClient.setQueryData<StorageData>(
            storageKeys.user(),
            (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    usedStorage: Math.round((oldData.usedStorage + fileSizeGB) * 10) / 10,
                    breakdown: {
                        ...oldData.breakdown,
                        [fileType]: Math.round((oldData.breakdown[fileType] + fileSizeGB) * 10) / 10,
                    },
                };
            }
        );
    };

    const revertOptimisticUpdate = () => {
        queryClient.invalidateQueries({
            queryKey: storageKeys.user(),
        });
    };

    return {
        updateStorageOptimistically,
        revertOptimisticUpdate,
    };
};

export const useStorageErrorHandler = () => {
    const handleStorageError = (error: AxiosError<ApiError>) => {
        if (error.response?.status === 404) {
            console.error('Storage endpoint not found');
            return 'Storage service is temporarily unavailable';
        }

        if (error.response?.status === 403) {
            console.error('Unauthorized access to storage data');
            return 'You do not have permission to access this storage data';
        }

        console.error('Storage error:', error.message);
        return error.response?.data?.message || 'Failed to load storage data';
    };

    return { handleStorageError };
};

// Google-style Progress Bar Component
export const StorageProgressBar: React.FC = () => {
    const { data: storageData, isLoading } = useStorageStats();
    const { percentage, isNearLimit, isAtLimit } = useStoragePercentage();

    if (isLoading || !storageData) {
        return (
            <div className="animate-pulse">
                <div className="h-2 bg-gray-200 rounded-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
        );
    }

    const getProgressColor = () => {
        if (isAtLimit) return 'bg-red-500';
        if (isNearLimit) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const formatStorage = (gb: number) => {
        if (gb >= 1000) {
            return `${(gb / 1000).toFixed(1)} TB`;
        }
        return `${gb} GB`;
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Storage
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage}%
                </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatStorage(storageData.usedStorage)} used</span>
                <span>{formatStorage(storageData.totalStorage)} total</span>
            </div>
        </div>
    );
};

// Google-style Circular Progress Component
export const StorageCircularProgress: React.FC = () => {
    const { data: storageData, isLoading } = useStorageStats();
    const { percentage, isNearLimit, isAtLimit } = useStoragePercentage();

    if (isLoading || !storageData) {
        return (
            <div className="relative w-24 h-24 mx-auto">
                <div className="animate-pulse">
                    <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        );
    }

    const getStrokeColor = () => {
        if (isAtLimit) return '#ef4444';
        if (isNearLimit) return '#f59e0b';
        return '#3b82f6';
    };

    const circumference = 2 * Math.PI * 36;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const formatStorage = (gb: number) => {
        if (gb >= 1000) {
            return `${(gb / 1000).toFixed(1)} TB`;
        }
        if (gb >= 1) {
            return `${gb} GB`;
        }
        return `${(gb * 1000).toFixed(0)} MB`;
    };

    return (
        <div className="relative w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                    className="dark:stroke-gray-600"
                />
                {/* Progress circle */}
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={getStrokeColor()}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-in-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {percentage}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    <div>{formatStorage(storageData.usedStorage)}</div>
                    <div className="text-xs">used</div>
                </div>
            </div>
        </div>
    );
};

// Google-style Storage Breakdown Component
export const StorageBreakdownBar: React.FC = () => {
    const { data: detailedData, isLoading } = useDetailedStorageStats();

    if (isLoading || !detailedData) {
        return (
            <div className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded-full"></div>
            </div>
        );
    }

    const total = detailedData.usedStorage;
    const breakdown = detailedData.breakdown;

    const segments = [
        { type: 'documents', value: breakdown.documents, color: 'bg-blue-500', label: 'Documents' },
        { type: 'images', value: breakdown.images, color: 'bg-green-500', label: 'Images' },
        { type: 'videos', value: breakdown.videos, color: 'bg-purple-500', label: 'Videos' },
        { type: 'audio', value: breakdown.audio, color: 'bg-orange-500', label: 'Audio' },
    ];

    return (
        <div className="w-full">
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {segments.map((segment) => {
                    const percentage = total > 0 ? (segment.value / total) * 100 : 0;
                    return (
                        <div
                            key={segment.type}
                            className={`${segment.color} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                        />
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
                {segments.map((segment) => (
                    <div key={segment.type} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {segment.label}: {segment.value} GB
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Updated Storage Card with Google-style design
interface StorageCardProps {
    onUpgrade: () => void;
}

export const StorageCard: React.FC<StorageCardProps> = ({ onUpgrade }) => {
    const { data: storageData, isLoading } = useStorageStats();
    const { isNearLimit, isAtLimit } = useStoragePercentage();
    const { handleStorageError } = useStorageErrorHandler();

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="h-24 bg-gray-200 rounded-full mx-auto w-24"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!storageData) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center text-red-500">
                    {handleStorageError(new AxiosError('No data available'))}
                </div>
            </div>
        );
    }

    // const formatStorage = (gb: number) => {
    //     if (gb >= 1000) {
    //         return `${(gb / 1000).toFixed(1)} TB`;
    //     }
    //     return `${gb} GB`;
    // };

    // const getStatusMessage = () => {
    //     if (isAtLimit) {
    //         return { message: 'Storage almost full', color: 'text-red-600' };
    //     }
    //     if (isNearLimit) {
    //         return { message: 'Storage getting full', color: 'text-yellow-600' };
    //     }
    //     return {
    //         message: `${formatStorage(remainingStorage)} available`,
    //         color: 'text-gray-500 dark:text-gray-400'
    //     };
    // };

    //  const status = getStatusMessage();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center space-y-4">
                {/* <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    Storage
                </h3> */}

                {/* <StorageCircularProgress /> */}

                {/* <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatStorage(storageData.usedStorage)} of {formatStorage(storageData.totalStorage)} used
                    </div>
                    <div className={`text-sm ${status.color}`}>
                        {status.message}
                    </div>
                </div> */}

                <div className="pt-2">
                    <StorageProgressBar />
                </div>

                {(isNearLimit || isAtLimit) && (
                    <button
                        onClick={onUpgrade}
                        className="w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Get more storage
                    </button>
                )}

                {!isNearLimit && !isAtLimit && (
                    <button
                        onClick={onUpgrade}
                        className="w-full mt-4 px-4 py-2.5 text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Upgrade storage
                    </button>
                )}
            </div>
        </div>
    );
};

// Compact Storage Widget for sidebars
export const StorageWidget: React.FC = () => {
    const { data: storageData, isLoading } = useStorageStats();
    const { percentage, isNearLimit, isAtLimit } = useStoragePercentage();

    if (isLoading || !storageData) {
        return (
            <div className="animate-pulse space-y-2">
                <div className="h-2 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
        );
    }

    const formatStorage = (gb: number) => {
        if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
        return `${gb} GB`;
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600' :
                    isNearLimit ? 'text-yellow-600' :
                        'text-gray-900 dark:text-white'
                    }`}>
                    {percentage}%
                </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${isAtLimit ? 'bg-red-500' :
                        isNearLimit ? 'bg-yellow-500' :
                            'bg-blue-500'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatStorage(storageData.usedStorage)} of {formatStorage(storageData.totalStorage)}
            </div>
        </div>
    );
};