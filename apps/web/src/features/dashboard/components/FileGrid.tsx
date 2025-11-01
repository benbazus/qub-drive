// import React from 'react'
// import { Star, Users, Lock, Loader2 } from 'lucide-react'
// import { Card, CardContent } from '@/components/ui/card'
// import { FileItem } from '@/types/file'
// import { FileDropdownMenu } from './FileDropdownMenu'
// import { getFileIcon } from './fileUtils'

// interface FileGridProps {
//     files: FileItem[]
//     onFileSelect: (id: string) => void
//     onFileDoubleClick: (file: FileItem) => void
//     onFileAction: (action: string, file: FileItem) => void
//     isLoading?: boolean // Made optional with default value
 
// }

// export const FileGrid: React.FC<FileGridProps> = ({
//     files,
//     onFileSelect,
//     onFileDoubleClick,
//     onFileAction,
//     isLoading ,
 
// }) => (
//     <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
//         {files.map((file) => {
             
            
//             return (
//                 <Card
//                     key={file.id}
//                     className={`group hover:border-blue-500/50 cursor-pointer border-2 border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative ${
//                         isLoading ? 'pointer-events-none opacity-75' : ''
//                     }`}
//                     onClick={() => !isLoading && onFileSelect(file.id)}
//                     onDoubleClick={() => !isLoading && onFileDoubleClick(file)}
//                 >
//                     <CardContent className='p-4'>
//                         {/* Loading overlay */}
//                         {isLoading && (
//                             <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg">
//                                 <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//                             </div>
//                         )}
                        
//                         <div className='mb-3 flex items-start justify-between'>
//                             <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-900/20 dark:group-hover:to-purple-900/20 transition-all duration-300">
//                                 {getFileIcon(file.mimeType)}
//                             </div>
//                             <FileDropdownMenu file={file} onAction={onFileAction}  />
//                         </div>
                        
//                         <h3 className='mb-2 truncate font-semibold text-gray-900 dark:text-white text-sm'>
//                             {file.fileName}
//                         </h3>
                        
//                         <div className='text-gray-500 dark:text-gray-400 flex items-center justify-between text-xs'>
//                             <span className="font-medium">{file.fileSize}</span>
//                             <span>{file.modified}</span>
//                         </div>
                        
//                         <div className='mt-3 flex items-center space-x-2'>
//                             {file.starred && (
//                                 <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
//                                     <Star className='h-3 w-3 fill-current text-yellow-600 dark:text-yellow-400' />
//                                 </div>
//                             )}
//                             {file.shared && (
//                                 <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
//                                     <Users className='h-3 w-3 text-blue-600 dark:text-blue-400' />
//                                 </div>
//                             )}
//                             {file.locked && (
//                                 <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
//                                     <Lock className='h-3 w-3 text-red-600 dark:text-red-400' />
//                                 </div>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card>
//             )
//         })}
//     </div>
// )

import React from 'react';
import { Star, Users, Lock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FileItem } from '@/types/file';
import { FileDropdownMenu } from './FileDropdownMenu';
import { getFileIcon } from './fileUtils';

// Define the interface for FileGridProps
interface FileGridProps {
  files: FileItem[];
  onFileSelect: (id: string) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onFileAction: (action: string, file: FileItem) => void;
  isLoading?: boolean; // Optional prop with default value
}

// FileGrid component
export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onFileSelect,
  onFileDoubleClick,
  onFileAction,
  isLoading = false, // Default value for isLoading
}) => (
  <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {files.map((file) => (
      <Card
        key={file.id} // Unique key for each file
        className={`group hover:border-blue-500/50 cursor-pointer border-2 border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative ${
          isLoading ? 'pointer-events-none opacity-75' : ''
        }`}
        onClick={() => !isLoading && onFileSelect(file.id)}
        onDoubleClick={() => !isLoading && onFileDoubleClick(file)}
      >
        <CardContent className="p-4">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}

          <div className="mb-3 flex items-start justify-between">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-900/20 dark:group-hover:to-purple-900/20 transition-all duration-300">
              {getFileIcon(file.mimeType)}
            </div>
            <FileDropdownMenu file={file} onAction={onFileAction} />
          </div>

          <h3 className="mb-2 truncate font-semibold text-gray-900 dark:text-white text-sm">
            {file.fileName}
          </h3>

          <div className="text-gray-500 dark:text-gray-400 flex items-center justify-between text-xs">
            <span className="font-medium">{file.fileSize}</span>
            <span>{file.modified}</span>
          </div>

          <div className="mt-3 flex items-center space-x-2">
            {file.starred && (
              <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-3 w-3 fill-current text-yellow-600 dark:text-yellow-400" />
              </div>
            )}
            {file.shared && (
              <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            {file.locked && (
              <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                <Lock className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);