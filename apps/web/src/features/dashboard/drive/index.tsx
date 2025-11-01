


// import React, { useState, useCallback, useEffect } from 'react'

// import { FileFilters, FileItem, FilePagination, PathCrumb, FileListResponse, FileAction } from '@/types/file'
// import { useFolder } from '../../../context/folder-context'
// import { useQuery } from '@tanstack/react-query'



// import DialogContainer from '../components/dialogs/DialogContainer'
// import fileEndpoint from '@/api/endpoints/file.endpoint'
// import { Sidebar } from '@/components/layout/Sidebar'
// import { cn } from '@/lib/utils'
// import { AdminHeader } from '@/components/layout/AdminHeader'

// function useFileList(filters: FileFilters = {}, pagination: FilePagination = {}) {
//     return useQuery({
//         queryKey: ['files', filters, pagination],
//         queryFn: async (): Promise<FileListResponse> => {
//             const response = await fileEndpoint.getFileList(filters, pagination);
//             return response;
//         },
//     })
// }
// interface DashboardStats {
//     totalFiles: {
//         count: number
//         growth: number
//     }
//     storageUsed: {
//         bytes: number
//         growth: number
//     }
//     sharedFiles: {
//         count: number
//         growth: number
//     }
//     teamMembers: {
//         count: number
//         growth: number
//     }
// }


// function useDashboardStats() {
//     return useQuery({
//         queryKey: ['dashboard-stats'],
//         queryFn: async (): Promise<DashboardStats> => {
//             try {
//                 const stats = await fileEndpoint.getDashboardStats()
//                 return stats
//             } catch (error) {
//                 console.error('Failed to fetch dashboard stats:', error)
//                 // Fallback to mock data
//                 return {
//                     totalFiles: { count: 0, growth: 12.5 },
//                     storageUsed: { bytes: 0 * 1024 * 1024 * 1024, growth: 8.3 },
//                     sharedFiles: { count: 0, growth: -2.1 },
//                     teamMembers: { count: 0, growth: 5.0 }
//                 }
//             }
//         },
//         refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
//         staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
//     })
// }

// const DashboardPage = () => {
//     const { setParentFolder: setFolder } = useFolder()
//     const [viewFilter, setViewFilter] = useState('all');
//     const [sortBy, setSortBy] = useState('name');
//     const [sortOrder, setSortOrder] = useState('asc');
//     const [layout, setLayout] = useState<'grid' | 'list'>('grid')
//     const [filter, setFilter] = useState<'all' | 'folders' | 'files'>('all')
//     const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
//     const [searchQuery, setSearchQuery] = useState('')
//     const [currentView, setCurrentView] = useState<'home' | 'my-drives' | 'shared' | 'starred' | 'recent' | 'trash'>('home')
//     const [currentPath, setCurrentPath] = useState<PathCrumb[]>([
//         { id: null, name: 'My Drives' },
//     ])
//     const [isSidebarOpen, setSidebarOpen] = useState(false)
//     const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)

//     // Dialog states
//     const [dialogs, setDialogs] = useState({
//         preview: { open: false, file: null as FileItem | null },
//         move: { open: false, file: null as FileItem | null },
//         share: { open: false, file: null as FileItem | null },
//         rename: { open: false, file: null as FileItem | null },
//         delete: { open: false, file: null as FileItem | null },
//         details: { open: false, file: null as FileItem | null },
//         lock: { open: false, file: null as FileItem | null },
//         star: { open: false, file: null as FileItem | null },
//         copyFile: { open: false, file: null as FileItem | null },
//         copyLink: { open: false, file: null as FileItem | null }
//     })

//     const currentFolderId = currentPath[currentPath.length - 1].id

//     // Filters and pagination
//     const filters: FileFilters = {
//         search: searchQuery || undefined,
//         type: viewFilter,
//         parentId: currentFolderId!,
//     };

//     const pagination: FilePagination = {
//         page: 1,
//         limit: 100,
//         sortBy,
//         sortOrder,
//     };

//     const { data: filesData, isLoading: isLoadingFiles } = useFileList(filters, pagination);
//     const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

//     const displayStats = stats;

//     // Fixed: Properly handle the files data structure
//     const allFiles = Array.isArray(filesData?.files) ? filesData.files : filesData || [];

//     // Filter files based on current filter state
//     const filteredFiles = React.useMemo(() => {
//         let filtered = allFiles;

//         if (filter === 'folders') {
//             filtered = filtered?.filter((file: { fileType: string }) => file.fileType === 'folder');
//         } else if (filter === 'files') {
//             filtered = filtered?.filter((file: { fileType: string }) => file.fileType === 'file');
//         }

//         return filtered;
//     }, [allFiles, filter]);

//     const finalFilteredFiles = filteredFiles;



//     return (
//         <>
//             <div className='bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white flex h-screen w-full overflow-hidden'>
//                 <div
//                     className={cn(
//                         'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300',
//                         isSidebarOpen ? 'opacity-100 visible' : 'pointer-events-none opacity-0 invisible',
//                         'lg:hidden' // Only show overlay on mobile/tablet
//                     )}
//                     onClick={() => setSidebarOpen(false)}
//                 />


//                 <aside
//                     className={cn(
//                         'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl transition-all duration-300 ease-in-out',
//                         'fixed top-0 left-0 z-50 h-full lg:relative lg:translate-x-0'
//                     )}
//                 >
//                     <Sidebar

//                         setCurrentView={() => { }}
//                         setCurrentPath={() => { }}
//                         isCollapsed={isSidebarCollapsed}
//                         onToggleCollapse={() => {
//                             setSidebarCollapsed(!isSidebarCollapsed);


//                         }}

//                         isOpen={isSidebarOpen}
//                         onClose={() => setSidebarOpen(false)}
//                     />
//                 </aside>
//                 <AdminHeader
//                     isSidebarOpen={isSidebarOpen}
//                     setSidebarOpen={setSidebarOpen}
//                 />


//             </div>

//         </>
//     )
// }

// export default DashboardPage