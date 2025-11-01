
import React from 'react';
import { Star, Users, Lock, Loader2, Delete } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FileDropdownMenu } from '@/features/dashboard/components/FileDropdownMenu';
import { Thumbnail } from '@/components/Thumbnail';

import { DialogType } from '@/hooks/useFileManager';
import { FileItem } from '@/types/file';

// Define the interface for FileGridProps
interface FileGridProps {
  files: FileItem[];
  isLoading?: boolean;
  onFileDoubleClick: (file: FileItem) => void;
  onFileAction: (action: DialogType, file: FileItem) => void;
}

// Enhanced FileGrid component with modern styling
export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onFileDoubleClick,
  onFileAction,
  isLoading = false,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/20">
    <div className="p-4">


      <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {files.map((file) => (
          <Card
            key={file.id}
            className={`
              group relative overflow-hidden rounded-2xl border-2 border-transparent 
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
              cursor-pointer transition-all duration-300 ease-out
              hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 
              hover:scale-105 hover:-translate-y-2
              active:scale-95 active:translate-y-0
              ${isLoading ? 'pointer-events-none opacity-60' : ''}
              before:absolute before:inset-0 before:rounded-2xl 
              before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5
              before:opacity-0 before:transition-opacity before:duration-300
              hover:before:opacity-100
            `}
            onClick={() => !isLoading}
            onDoubleClick={() => !isLoading && onFileDoubleClick(file)}
          >
            <CardContent className="relative p-3 sm:p-4 md:p-6">

              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-md dark:bg-gray-900/70">
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Loading...
                    </span>
                  </div>
                </div>
              )}

              {/* Header with icon and menu */}
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-start justify-between">
                <div className="group-hover:animate-pulse">
                  <div className="relative p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 group-hover:from-blue-100 group-hover:to-purple-100 dark:group-hover:from-blue-800/30 dark:group-hover:to-purple-800/30 transition-all duration-500 shadow-lg group-hover:shadow-xl">
                    <Thumbnail
                      fileId={file.id}
                      mimeType={file.fileType}
                      fileName={file.fileName}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                      fallbackIcon={true}
                    />
                    {/* Floating particles effect */}
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                  </div>
                </div>
                <FileDropdownMenu file={file} onAction={onFileAction} />
              </div>

              {/* File name with elegant typography */}
              <h3 className="mb-2 sm:mb-3 font-bold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                <span className="line-clamp-2 group-hover:drop-shadow-sm">
                  {file.fileName}
                </span>
              </h3>

              {/* File metadata with improved spacing */}
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs">
                  {file.fileSize}
                </span>
                <span className="text-gray-500 dark:text-gray-400 italic text-xs hidden sm:inline">
                  {file.modified}
                </span>
              </div>

              {/* Status indicators with enhanced visual design */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
                {file.starred && (
                  <div className="group/star relative">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-yellow-600 dark:text-yellow-400 group-hover/star:animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-75 animate-ping"></div>
                  </div>
                )}
                {file.shared && (
                  <div className="group/share relative">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 group-hover/share:animate-bounce" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-75 animate-ping"></div>
                  </div>
                )}
                {file.locked && (
                  <div className="group/lock relative">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 group-hover/lock:animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-75 animate-ping"></div>
                  </div>
                )}
                {file.deleted && (
                  <div className="group/lock relative">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Delete className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400 group-hover/lock:animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-75 animate-ping"></div>
                  </div>
                )}
              </div>

              {/* Subtle hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 transition-all duration-500 pointer-events-none"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

