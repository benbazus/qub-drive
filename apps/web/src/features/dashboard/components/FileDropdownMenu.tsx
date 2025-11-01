import React from 'react'
import {
    MoreVertical, Eye, Download, Star, Share2, Link, FolderOpen,
    Copy, Edit, Lock, Info, Trash2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { FileItem } from '@/types/file'
import { DialogType } from '@/hooks/useFileManager'

interface FileDropdownMenuProps {
    file: FileItem
    onAction: (action: DialogType, file: FileItem) => void
}

export const FileDropdownMenu: React.FC<FileDropdownMenuProps> = ({ file, onAction }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className='hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none'
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className='text-gray-500 dark:text-gray-400 h-4 w-4' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem onClick={() => onAction('preview', file)}>
                    <Eye className='mr-3 h-4 w-4 text-blue-500' />
                    Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('download', file)}>
                    <Download className='mr-3 h-4 w-4 text-green-500' />
                    Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction('star', file)}>
                    <Star
                        className={cn(
                            'mr-3 h-4 w-4',
                            file.starred ? 'fill-current text-yellow-500' : 'text-gray-400'
                        )}
                    />
                    {file.starred ? 'Remove star' : 'Add to starred'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('share', file)}>
                    <Share2 className='mr-3 h-4 w-4 text-purple-500' />
                    Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('copyLink', file)}>
                    <Link className='mr-3 h-4 w-4 text-blue-500' />
                    Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction('move', file)}>
                    <FolderOpen className='mr-3 h-4 w-4 text-orange-500' />
                    Move
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('copyFile', file)}>
                    <Copy className='mr-3 h-4 w-4 text-teal-500' />
                    Copy File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('rename', file)}>
                    <Edit className='mr-3 h-4 w-4 text-indigo-500' />
                    Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('lock', file)}>
                    <Lock className='mr-3 h-4 w-4 text-gray-500' />
                    {file.locked ? 'Unlock' : 'Lock'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('details', file)}>
                    <Info className='mr-3 h-4 w-4 text-gray-500' />
                    Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onAction('delete', file)}
                    className='text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                >
                    <Trash2 className='mr-3 h-4 w-4' />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}