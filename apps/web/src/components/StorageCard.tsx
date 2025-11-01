

// import fileEndpoint from '@/api/endpoints/file.endpoint';
// import { StorageBreakdown, StorageData } from '@/features/dashboard/components/StorageCard';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { AxiosError } from 'axios';
// import React from 'react';


// // Uncomment and use the interface
// // export interface StorageData {
// //     used: number;
// //     total: number;
// //     breakdown: {
// //         documents: number;
// //         images: number;
// //         videos: number;
// //         audio: number;
// //     };
// // }

// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
// }

// export interface ApiError {
//   error: string;
//   message?: string;
// }

// export const storageKeys = {
//   all: ['storage'] as const,
//   user: () => ['storage'] as const,
//   detailed: () => ['storage', 'detailed'] as const,
//   dateRange: (startDate: string, endDate: string) =>
//     ['storage', 'range', startDate, endDate] as const,
// };

// export const useStorageStats = (enabled: boolean = true) => {
//   return useQuery<StorageData, AxiosError<ApiError>>({
//     queryKey: storageKeys.user(),
//     queryFn: () => fileEndpoint.getStorageStats(),
//     enabled,
//     staleTime: 5 * 60 * 1000,
//     retry: 2,
//     refetchOnWindowFocus: false,
//   });
// };

// export const useDetailedStorageStats = (enabled: boolean = true) => {
//   return useQuery<StorageData, AxiosError<ApiError>>({
//     queryKey: storageKeys.detailed(),
//     queryFn: () => fileEndpoint.getDetailedStorageStats(),
//     enabled,
//     staleTime: 5 * 60 * 1000,
//     retry: 2,
//     refetchOnWindowFocus: false,
//   });
// };

// export const useStorageByDateRange = (startDate: string, endDate: string, enabled: boolean = true) => {
//   return useQuery<StorageData, AxiosError<ApiError>>({
//     queryKey: storageKeys.dateRange(startDate, endDate),
//     queryFn: () => fileEndpoint.getStorageByDateRange({ startDate, endDate }),
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 2 * 60 * 1000,
//     retry: 1,
//   });
// };

// // Removed duplicate useRefreshStorageCache
// export const useStorageOperations = () => {
//   const queryClient = useQueryClient();

//   const refreshStorageCache = useMutation<void, AxiosError<ApiError>>({
//     mutationFn: () => fileEndpoint.refreshStorageCache(),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         predicate: (query) => query.queryKey[0] === 'storage',
//       });
//     },
//     onError: (error) => {
//       console.error('Failed to refresh storage cache:', error.response?.data?.message || error.message);
//     },
//   });

//   const invalidateStorageQueries = () => {
//     queryClient.invalidateQueries({
//       queryKey: storageKeys.user(),
//     });
//   };

//   const refetchStorageStats = () => {
//     queryClient.refetchQueries({
//       queryKey: storageKeys.user(),
//     });
//   };

//   return {
//     refreshStorageCache,
//     invalidateStorageQueries,
//     refetchStorageStats,
//   };
// };

// export const useStoragePercentage = () => {
//   const { data: storageData, isLoading } = useStorageStats();

//   const storagePercentage = storageData
//     ? Math.round((storageData.usedStorage / storageData.totalStorage) * 100)
//     : 0;

//   return {
//     percentage: storagePercentage,
//     isNearLimit: storagePercentage >= 80,
//     isAtLimit: storagePercentage >= 95,
//     remainingStorage: storageData ? storageData.totalStorage - storageData.usedStorage : 0,
//     isLoading,
//   };
// };

// export const useOptimisticStorageUpdate = () => {
//   const queryClient = useQueryClient();

//   const updateStorageOptimistically = (fileSizeGB: number, fileType: keyof StorageBreakdown) => {
//     queryClient.setQueryData<StorageData>(
//       storageKeys.user(),
//       (oldData) => {
//         if (!oldData) return oldData;

//         return {
//           ...oldData,
//           used: Math.round((oldData.usedStorage + fileSizeGB) * 10) / 10,
//           breakdown: {
//             ...oldData.breakdown,
//             [fileType]: Math.round((oldData.breakdown[fileType] + fileSizeGB) * 10) / 10,
//           },
//         };
//       }
//     );
//   };

//   const revertOptimisticUpdate = () => {
//     queryClient.invalidateQueries({
//       queryKey: storageKeys.user(),
//     });
//   };

//   return {
//     updateStorageOptimistically,
//     revertOptimisticUpdate,
//   };
// };

// export const useStorageErrorHandler = () => {
//   const handleStorageError = (error: AxiosError<ApiError>) => {
//     if (error.response?.status === 404) {
//       console.error('Storage endpoint not found');
//       return 'Storage service is temporarily unavailable';
//     }

//     if (error.response?.status === 403) {
//       console.error('Unauthorized access to storage data');
//       return 'You do not have permission to access this storage data';
//     }

//     // if (error?.response?.status >= 500) {
//     //   console.error('Server error:', error.response?.data?.message);
//     //   return 'Server error occurred while fetching storage data';
//     // }

//     console.error('Storage error:', error.message);
//     return error.response?.data?.message || 'Failed to load storage data';
//   };

//   return { handleStorageError };
// };

// export const StorageChart: React.FC = () => {
//   const { data: storageData, isLoading } = useStorageStats();
//   const { percentage } = useStoragePercentage();

//   if (isLoading || !storageData) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="relative w-32 h-32 mx-auto">
//       <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
//         <circle
//           cx="50"
//           cy="50"
//           r="40"
//           stroke="#e5e7eb"
//           strokeWidth="8"
//           fill="none"
//         />
//         <circle
//           cx="50"
//           cy="50"
//           r="40"
//           stroke="url(#gradient)"
//           strokeWidth="8"
//           fill="none"
//           strokeDasharray={`${percentage * 2.51} 251`}
//           strokeLinecap="round"
//         />
//         <defs>
//           <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
//             <stop offset="0%" stopColor="#3b82f6" />
//             <stop offset="100%" stopColor="#8b5cf6" />
//           </linearGradient>
//         </defs>
//       </svg>
//       <div className="absolute inset-0 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-xl font-bold text-gray-900 dark:text-white">
//             {storageData.usedStorage}GB
//           </div>
//           <div className="text-xs text-gray-500">of {storageData.totalStorage}GB</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// interface StorageCardProps {
//   onUpgrade: () => void;
// }

// export const StorageCard: React.FC<StorageCardProps> = ({ onUpgrade }) => {
//   const { data: storageData, isLoading } = useStorageStats();
//   const { handleStorageError } = useStorageErrorHandler();

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!storageData) {
//     return <div>{handleStorageError(new AxiosError('No data available'))}</div>;
//   }

//   return (
//     <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-auto">
//       <div className="text-center mb-6">
//         <StorageChart />
//       </div>

//       <div className="space-y-3">
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-gray-600 dark:text-gray-400">Documents</span>
//           <span className="font-medium text-gray-900 dark:text-white">
//             {storageData.breakdown.documents}GB
//           </span>
//         </div>
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-gray-600 dark:text-gray-400">Images</span>
//           <span className="font-medium text-gray-900 dark:text-white">
//             {storageData.breakdown.images}GB
//           </span>
//         </div>
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-gray-600 dark:text-gray-400">Videos</span>
//           <span className="font-medium text-gray-900 dark:text-white">
//             {storageData.breakdown.videos}GB
//           </span>
//         </div>
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-gray-600 dark:text-gray-400">Audio</span>
//           <span className="font-medium text-gray-900 dark:text-white">
//             {storageData.breakdown.audio}GB
//           </span>
//         </div>
//       </div>

//       <button
//         onClick={onUpgrade}
//         className="w-full mt-6 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
//       >
//         Upgrade Storage
//       </button>
//     </div>
//   );
// };