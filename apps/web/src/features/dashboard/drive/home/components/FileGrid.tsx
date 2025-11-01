// import React from 'react'
// import { cn } from '@/lib/utils'
// import { FileItem } from '@/types/file'
// import { MoreVertical, Folder, FileText, Image, Video, Music, Archive, Code } from 'lucide-react'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'

// interface FileGridProps {
//   files: FileItem[]
//   onFileSelect: (fileId: string) => void
//   onFileDoubleClick: (file: FileItem) => void
//   onFileAction: (action: string, file: FileItem) => void
//   isLoading?: boolean
// }

// const FileGrid: React.FC<FileGridProps> = ({
//   files,
//   onFileSelect,
//   onFileDoubleClick,
//   onFileAction,
//   isLoading = false
// }) => {
//   const getFileIcon = (fileType: string, mimeType?: string) => {
//     if (fileType === 'folder') {
//       return <Folder className="h-8 w-8 text-blue-500" />
//     }
    
//     if (mimeType) {
//       if (mimeType.startsWith('image/')) {
//         return <Image className="h-8 w-8 text-green-500" />
//       }
//       if (mimeType.startsWith('video/')) {
//         return <Video className="h-8 w-8 text-red-500" />
//       }
//       if (mimeType.startsWith('audio/')) {
//         return <Music className="h-8 w-8 text-purple-500" />
//       }
//       if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
//         return <Archive className="h-8 w-8 text-orange-500" />
//       }
//       if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
//         return <Code className="h-8 w-8 text-blue-600" />
//       }
//     }
    
//     return <FileText className="h-8 w-8 text-gray-500" />
//   }

//   const formatFileSize = (size: number | string): string => {
//     if (typeof size === 'string') return size
//     if (size === 0) return '0 B'
//     const k = 1024
//     const sizes = ['B', 'KB', 'MB', 'GB']
//     const i = Math.floor(Math.log(size) / Math.log(k))
//     return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
//   }

//   const formatDate = (date: string | Date): string => {
//     const d = new Date(date)
//     return d.toLocaleDateString('en-US', { 
//       month: 'short', 
//       day: 'numeric',
//       year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
//     })
//   }

//   if (isLoading) {
//     return (
//       <div className="grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
//         {Array.from({ length: 12 }).map((_, index) => (
//           <div
//             key={index}
//             className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
//           >
//             <div className="flex flex-col items-center space-y-3">
//               <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
//               <div className="w-full space-y-2">
//                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
//                 <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     )
//   }

//   return (
//     <div className="grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
//       {files.map((file) => (
//         <div
//           key={file.id}
//           className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer"
//           onDoubleClick={() => onFileDoubleClick(file)}
//           onClick={() => onFileSelect(file.id)}
//         >
//           {/* File Icon */}
//           <div className="flex flex-col items-center space-y-3">
//             <div className="relative">
//               <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
//                 {getFileIcon(file.fileType, file.mimeType)}
//               </div>
              
//               {/* File type badge for folders */}
//               {file.fileType === 'folder' && (
//                 <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
//                   <span className="text-xs text-white font-bold">
//                     {file.childCount || 0}
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* File Info */}
//             <div className="w-full text-center space-y-1">
//               <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                 {file.fileName}
//               </h3>
//               <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
//                 {file.fileType !== 'folder' && (
//                   <p>{formatFileSize(Number(file.fileSize))}</p>
//                 )}
//                 {file.createdAt && (
//                   <p>{formatDate(file.createdAt)}</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Action Menu */}
//           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
//                   <span className="sr-only">File actions</span>
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <DropdownMenuItem onClick={() => onFileAction('preview', file)}>
//                   Preview
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => onFileAction('download', file)}>
//                   Download
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={() => onFileAction('rename', file)}>
//                   Rename
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => onFileAction('move', file)}>
//                   Move
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => onFileAction('copyFile', file)}>
//                   Make a copy
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={() => onFileAction('share', file)}>
//                   Share
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => onFileAction('copyLink', file)}>
//                   Copy link
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={() => onFileAction('star', file)}>
//                   {file.starred ? 'Remove from starred' : 'Add to starred'}
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => onFileAction('details', file)}>
//                   Details
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem 
//                   onClick={() => onFileAction('delete', file)}
//                   className="text-red-600 dark:text-red-400"
//                 >
//                   Delete
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>

//           {/* Selection indicator */}
//           <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
//             <div className="h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
//           </div>

//           {/* Starred indicator */}
//           {file.starred && (
//             <div className="absolute bottom-2 left-2">
//               <div className="h-2 w-2 rounded-full bg-yellow-400" />
//             </div>
//           )}

//           {/* Shared indicator */}
//           {file.shared && (
//             <div className="absolute bottom-2 right-2">
//               <div className="h-2 w-2 rounded-full bg-green-400" />
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   )
// }

// export default FileGrid