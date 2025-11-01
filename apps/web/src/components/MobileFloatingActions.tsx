import React, { useState } from 'react';
import { Plus, Upload, FolderPlus, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFloatingActionsProps {
  onUploadFile?: () => void;
  onCreateFolder?: () => void;
  onCreateDocument?: () => void;
}

export const MobileFloatingActions: React.FC<MobileFloatingActionsProps> = ({
  onUploadFile,
  onCreateFolder,
  onCreateDocument,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) return null;

  const actions = [
    {
      icon: Upload,
      label: 'Upload File',
      onClick: onUploadFile,
      color: 'from-green-500 to-green-600',
    },
    {
      icon: FolderPlus,
      label: 'Create Folder',
      onClick: onCreateFolder,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FileText,
      label: 'Create Document',
      onClick: onCreateDocument,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick?.();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Action Buttons */}
        {isOpen && (
          <div className="flex flex-col items-end space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            {actions.map((action, index) => (
              <div
                key={action.label}
                className="flex items-center space-x-3 animate-in slide-in-from-right-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label */}
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {action.label}
                </div>
                
                {/* Action Button */}
                <button
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    'w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center bg-gradient-to-r',
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center',
            isOpen && 'rotate-45'
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
};