import React from 'react'
import { Star, Users, Lock } from 'lucide-react'
import { FileItem } from '@/types/file'
import { getFileIcon } from '@/features/dashboard/components/fileUtils'
import { FileDropdownMenu } from '@/features/dashboard/components/FileDropdownMenu'

import { DialogType } from '@/hooks/useFileManager'

interface FileListProps {
  files: FileItem[]
  onSelectAll: (checked: boolean) => void
  onFileAction: (action: DialogType, file: FileItem) => void
  isLoading?: boolean; // Optional prop with default value
  onFileDoubleClick?: (file: FileItem) => void; // Optional double click handler
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onSelectAll,
  onFileAction,
  isLoading = false, // Default value for isLoading
  onFileDoubleClick,
}) => {
  const areAllSelected = files.length > 0

  
  return (
    <div className='w-full overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead className='border-b border-gray-200 dark:border-gray-700'>
          <tr className='text-gray-600 dark:text-gray-400'>
            <th className='h-12 w-12 px-2 sm:px-4 text-left font-semibold'>
              <input
                type='checkbox'
                className='border-gray-300 dark:border-gray-600 accent-blue-600 rounded-md w-4 h-4 touch-manipulation'
                checked={areAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className='h-12 px-2 sm:px-4 text-left font-semibold'>Name</th>
            <th className='hidden h-12 px-2 sm:px-4 text-left font-semibold md:table-cell'>Size</th>
            <th className='hidden h-12 px-2 sm:px-4 text-left font-semibold lg:table-cell'>Modified</th>
            <th className='h-12 w-16 sm:w-24 px-2 sm:px-4 text-right font-semibold'></th>
          </tr>
        </thead>
        <tbody>
          {files?.map((file) => (
            <tr
              key={file.id}
              className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-blue-50 dark:data-[state=selected]:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-all duration-200 touch-manipulation'
              onDoubleClick={() => onFileDoubleClick?.(file)}
            >
              <td className='p-2 sm:p-4 font-medium'>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-900 dark:text-white text-sm sm:text-base truncate block">{file.fileName}</span>
                    {/* Mobile-only metadata */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1">
                      <span>{file.fileSize}</span>
                      <span>•</span>
                      <span>{file.modified}</span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-1 sm:space-x-2 opacity-0 transition-opacity group-hover:opacity-100'>
                    {file.starred && <Star className='h-3 w-3 fill-current text-yellow-500' />}
                    {file.shared && <Users className='h-3 w-3 text-blue-500' />}
                    {file.locked && <Lock className='h-3 w-3 text-red-500' />}
                  </div>
                </div>
              </td>
              <td className='text-gray-500 dark:text-gray-400 hidden p-2 sm:p-4 md:table-cell font-medium'>
                {file.fileSize}
              </td>
              <td className='text-gray-500 dark:text-gray-400 hidden p-2 sm:p-4 lg:table-cell'>
                {file.modified}
              </td>
              <td className='p-2 sm:p-4 text-right'>
                <FileDropdownMenu file={file} onAction={onFileAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}