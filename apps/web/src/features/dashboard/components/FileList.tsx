import React from 'react'
import { Star, Users, Lock } from 'lucide-react'
import { FileItem } from '@/types/file'
import { FileDropdownMenu } from './FileDropdownMenu'
import { getFileIcon } from './fileUtils'

interface FileListProps {
    files: FileItem[]
    selectedFiles: Set<string>
    onFileSelect: (id: string) => void
    onSelectAll: (checked: boolean) => void
    onFileDoubleClick: (file: FileItem) => void
    onFileAction: (action: string, file: FileItem) => void
}

export const FileList: React.FC<FileListProps> = ({
    files,
    selectedFiles,
    onFileSelect,
    onSelectAll,
    onFileDoubleClick,
    onFileAction,
}) => {
    const areAllSelected = files.length > 0 && files.every((f) => selectedFiles.has(f.id))

    return (
        <div className='w-full overflow-x-auto'>
            <table className='w-full text-sm'>
                <thead className='border-b border-gray-200 dark:border-gray-700'>
                    <tr className='text-gray-600 dark:text-gray-400'>
                        <th className='h-12 w-12 px-4 text-left font-semibold'>
                            <input
                                type='checkbox'
                                className='border-gray-300 dark:border-gray-600 accent-blue-600 rounded-md w-4 h-4'
                                checked={areAllSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className='h-12 px-4 text-left font-semibold'>Name</th>
                        <th className='hidden h-12 px-4 text-left font-semibold md:table-cell'>Size</th>
                        <th className='hidden h-12 px-4 text-left font-semibold lg:table-cell'>Modified</th>
                        <th className='h-12 w-24 px-4 text-right font-semibold'></th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file) => (
                        <tr
                            key={file.id}
                            className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-blue-50 dark:data-[state=selected]:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-all duration-200'
                            data-state={selectedFiles.has(file?.id) ? 'selected' : 'unselected'}
                            onClick={() => onFileSelect(file.id)}
                            onDoubleClick={() => onFileDoubleClick(file)}
                        >
                            <td className='p-4'>
                                <input
                                    type='checkbox'
                                    checked={selectedFiles.has(file.id)}
                                    onChange={(e) => {
                                        e.stopPropagation()
                                        onFileSelect(file.id)
                                    }}
                                    className='border-gray-300 dark:border-gray-600 accent-blue-600 rounded-md w-4 h-4'
                                />
                            </td>
                            <td className='p-4 font-medium'>
                                <div className='flex items-center space-x-3'>
                                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                                        {getFileIcon(file.mimeType)}
                                    </div>
                                    <span className="text-gray-900 dark:text-white">{file.fileName}</span>
                                    <div className='flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100'>
                                        {file.starred && <Star className='h-3 w-3 fill-current text-yellow-500' />}
                                        {file.shared && <Users className='h-3 w-3 text-blue-500' />}
                                        {file.locked && <Lock className='h-3 w-3 text-red-500' />}
                                        {/* Preview button for previewable files */}
                                        {/* {isPreviewable(file.fileName) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onFileAction('preview', file);
                                                }}
                                                className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                title="Preview file"
                                            >
                                                <Eye className='h-3 w-3 text-blue-600 dark:text-blue-400' />
                                            </Button>
                                        )} */}
                                    </div>
                                </div>
                            </td>
                            <td className='text-gray-500 dark:text-gray-400 hidden p-4 md:table-cell font-medium'>
                                {file.fileSize}
                            </td>
                            <td className='text-gray-500 dark:text-gray-400 hidden p-4 lg:table-cell'>
                                {file.modified}
                            </td>
                            <td className='p-4 text-right'>
                                <FileDropdownMenu file={file} onAction={onFileAction} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}