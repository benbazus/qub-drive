// import React from 'react'
// import { cn } from '@/lib/utils'
// import { FileItem } from '@/types/file'
// import { 
//   MoreVertical, 
//   Folder, 
//   FileText, 
//   Image, 
//   Video, 
//   Music, 
//   Archive, 
//   Code,
//   Star,
//   Share,
//   Lock
// } from 'lucide-react'
// import { Checkbox } from '@/components/ui/checkbox'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'

// interface FileListProps {
//   files: FileItem[]
//   selectedFiles: Set<string>
//   onFileSelect: (fileId: string) => void
//   onFileDoubleClick: (file: FileItem) => void
//   onSelectAll: (checked: boolean) => void
//   onFileAction: (action: string, file: FileItem) => void
// }

// const FileList: React.FC<FileListProps> = ({
//   files,
//   selectedFiles,
//   onFileSelect,
//   onFileDoubleClick,
//   onSelectAll,
//   onFileAction
// }) => {
//   const getFileIcon = (fileType: string, mimeType?: string) => {
//     const className = "h-4 w-4"
    
//     if (fileType === 'folder') {
//       return <Folder className={cn(className, "text-blue-500")} />
//     }
    
//     if (mimeType) {
//       if (mimeType.startsWith('image/')) {
//         return <Image className={cn(className, "text-green-500")} />
//       }
//       if (mimeType.startsWith('video/')) {
//         return <Video className={cn(className, "text-red-500")} />
//       }
//       if (mimeType.startsWith('audio/')) {
//         return <Music className={cn(className, "text-purple-500")} />
//       }
//       if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
//         return <Archive className={cn(className, "text-orange-500")} />
//       }
//       if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
//         return <Code className={cn(className, "text-blue-600")} />
//       }
//     }
    
//     return <FileText className={cn(className, "text-gray-500")} />
//   }

//   const formatFileSize = (size: number | string): string => {
//     if (typeof size === 'string') return size
//     if (size === 0) return '--'
//     const k = 1024
//     const sizes = ['B', 'KB', 'MB', 'GB']
//     const i = Math.floor(Math.log(size) / Math.log(k))
//     return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
//   }

//   const formatDate = (date: string | Date): string => {
//     const d = new Date(date)
//     const now = new Date()
//     const diffTime = Math.abs(now.getTime() - d.getTime())
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
//     if (diffDays === 1) return 'Yesterday'
//     if (diffDays < 7) return `${diffDays} days ago`
    
//     return d.toLocaleDateString('en-US', { 
//       month: 'short', 
//       day: 'numeric',
//       year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
//     })
//   }

//   const isAllSelected = files.length > 0 && files.every(file => selectedFiles.has(file.id))
//   const isIndeterminate = selectedFiles.size > 0 && !isAllSelected

//   return (
//     <div className="w-full">
//       <Table>
//         <TableHeader>
//           <TableRow className="border-gray-200 dark:border-gray-700 hover:bg-transparent">
//             <TableHead className="w-12">
//               <Checkbox
//                 checked={isAllSelected}
//                 ref={(el) => {
//                   if (el) el.indeterminate = isIndeterminate
//                 }}
//                 onCheckedChange={onSelectAll}
//                 aria-label="Select all files"
//               />
//             </TableHead>
//             <TableHead className="font-semibold text-gray-900 dark:text-white">Name</TableHead>
//             <TableHead className="font-semibold text-gray-900 dark:text-white">Size</TableHead>
//             <TableHead className="font-semibold text-gray-900 dark:text-white">Modified</TableHead>
//             <TableHead className="font-semibold text-gray-900 dark:text-white">Type</TableHead>
//             <TableHead className="w-12"></TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {files.map((file) => (
//             <TableRow
//               key={file.id}
//               className={cn(
//                 "group cursor-pointer border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
//                 selectedFiles.has(file.id) && "bg-blue-50 dark:bg-blue-900/20"
//               )}
//               onDoubleClick={() => onFileDoubleClick(file)}
//             >
//               <TableCell>
//                 <Checkbox
//                   checked={selectedFiles.has(file.id)}
//                   onCheckedChange={() => onFileSelect(file.id)}
//                   aria-label={`Select ${file.fileName}`}
//                 />
//               </TableCell>
              
//               <TableCell>
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center">
//                     {getFileIcon(file.fileType, file.mimeType)}
//                   </div>
//                   <div className="flex items-center gap-2 min-w-0 flex-1">
//                     <span className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                       {file.fileName}
//                     </span>
//                     <div className="flex items-center gap-1">
//                       {file.starred && (
//                         <Star className="h-3 w-3 text-yellow-500 fill-current" />
//                       )}
//                       {file.shared && (
//                         <Share className="h-3 w-3 text-green-500" />
//                       )}
//                       {file.locked && (
//                         <Lock className="h-3 w-3 text-red-500" />
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </TableCell>
              
//               <TableCell className="text-sm text-gray-600 dark:text-gray-400">
//                 {file.fileType === 'folder' ? '--' : formatFileSize(Number(file.fileSize))}
//               </TableCell>
              
//               <TableCell className="text-sm text-gray-600 dark:text-gray-400">
//                 {file.createdAt ? formatDate(file.createdAt) : '--'}
//               </TableCell>
              
//               <TableCell className="text-sm text-gray-600 dark:text-gray-400 capitalize">
//                 {file.fileType === 'folder' ? 'Folder' : file.mimeType?.split('/')[0] || 'File'}
//               </TableCell>
              
//               <TableCell>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <button
//                       className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
//                       <span className="sr-only">File actions</span>
//                     </button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end" className="w-48">
//                     <DropdownMenuItem onClick={() => onFileAction('preview', file)}>
//                       Preview
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('download', file)}>
//                       Download
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem onClick={() => onFileAction('rename', file)}>
//                       Rename
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('move', file)}>
//                       Move
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('copyFile', file)}>
//                       Make a copy
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem onClick={() => onFileAction('share', file)}>
//                       Share
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('copyLink', file)}>
//                       Copy link
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem onClick={() => onFileAction('star', file)}>
//                       {file.starred ? 'Remove from starred' : 'Add to starred'}
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('lock', file)}>
//                       {file.locked ? 'Unlock' : 'Lock'}
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => onFileAction('details', file)}>
//                       Details
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem 
//                       onClick={() => onFileAction('delete', file)}
//                       className="text-red-600 dark:text-red-400"
//                     >
//                       Delete
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
      
//       {files.length === 0 && (
//         <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
//           <div className="text-center">
//             <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
//             <p className="text-lg font-medium">No files found</p>
//             <p className="text-sm">This folder is empty or no files match your search.</p>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default FileList