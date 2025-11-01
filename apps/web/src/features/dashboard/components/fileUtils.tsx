
import { Folder, Image, Video, FileText, FileSpreadsheet, Presentation, Archive, File } from 'lucide-react'
import { cn } from '@/lib/utils'


export const getFileIcon = (type: string) => {
    const iconClass = 'w-6 h-6 flex-shrink-0'
    switch (type) {
        case 'folder':
            return <Folder className={cn(iconClass, 'text-blue-500')} />
        case 'image':
            return <Image className={cn(iconClass, 'text-emerald-500')} />
        case 'video':
            return <Video className={cn(iconClass, 'text-purple-500')} />
        case 'pdf':
            return <FileText className={cn(iconClass, 'text-red-500')} />
        case 'application/pdf':
            return <FileText className={cn(iconClass, 'text-red-500')} />
        case 'spreadsheet':
            return <FileSpreadsheet className={cn(iconClass, 'text-green-600')} />
        case 'presentation':
            return <Presentation className={cn(iconClass, 'text-orange-500')} />
        case 'archive':
            return <Archive className={cn(iconClass, 'text-amber-600')} />
        case 'document':
            return <FileText className={cn(iconClass, 'text-gray-500')} />
        default:
            return <File className={cn(iconClass, 'text-gray-400')} />
    }
}