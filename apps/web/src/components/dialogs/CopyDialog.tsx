import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, AlertCircle, Loader2, File, Folder, CheckCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { FileItem } from '@/types/file';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import fileEndpoint from '@/api/endpoints/file.endpoint';



interface CopyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

const useCopyFile = () => {
    const queryClient = useQueryClient();
    return useMutation<
        void,
        Error,
        { fileId: string; name: string }
    >({
        mutationFn: ({ fileId, name }: { fileId: string; name: string }) => 
            fileEndpoint.copyFile(fileId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
};

const CopyDialog: React.FC<CopyDialogProps> = ({ isOpen, onClose, file }) => {
    // CORRECTED: Fixed state typing - should be string, not object
    const [newName, setNewName] = useState<string>('');
    const [nameError, setNameError] = useState<string>('');
    const copyMutation = useCopyFile();

    const getFileExtension = useCallback(() => {
        if (!file || file.fileType === 'folder' || !file.fileName?.includes('.')) {
            return '';
        }
        return file.fileName.substring(file.fileName.lastIndexOf('.'));
    }, [file]);

    const fileExtension = getFileExtension();
    const isFolder = file?.fileType === 'folder';

    useEffect(() => {
        if (isOpen && file) {
            const nameWithoutExtension = fileExtension
                ? file.fileName.substring(0, file.fileName.lastIndexOf('.'))
                : file.fileName;
            // CORRECTED: Set as string, not object
            setNewName(`Copy of ${nameWithoutExtension}`);
            setNameError('');
            copyMutation.reset();
        }
    }, [isOpen, file, fileExtension, copyMutation.reset]);

    const validateName = useCallback((name: string): boolean => {
        if (!name.trim()) {
            setNameError('Name cannot be empty.');
            return false;
        }
        if (name.length > 255) {
            setNameError('Name is too long (maximum 255 characters).');
            return false;
        }
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
            setNameError('Name contains invalid characters.');
            return false;
        }
        // Check for reserved names on Windows
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        if (reservedNames.test(name.trim())) {
            setNameError('This name is reserved and cannot be used.');
            return false;
        }
        setNameError('');
        return true;
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewName(value);
        if (nameError) {
            validateName(value); // Clear error on input if there was one
        }
    };

    const handleCopy = () => {
        const trimmedName = newName.trim();

        if (!validateName(trimmedName) || !file?.id) {
            return;
        }

        const finalName = trimmedName + fileExtension;

        copyMutation.mutate(
            { fileId: file.id, name: finalName }, // CORRECTED: Use 'name' parameter as expected by API
            {
                onSuccess: () => {

                    toast.success(
                        `${isFolder ? 'Folder' : 'File'} copied successfully`,
                        {
                            description: `Created "${finalName}"`
                        }
                    );
                    onClose();

                },
                onError: (error) => {
                    toast.error('Copy failed', {
                        description: error.message || 'Please try again.'
                    });
                },
            }
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !copyMutation.isPending && newName.trim() && !nameError) {
            handleCopy();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!file) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] gap-0">
                <DialogHeader className="pb-6">
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        <div className={`p-2 rounded-lg ${isFolder
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                            <Copy className={`h-5 w-5 ${isFolder
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-blue-600 dark:text-blue-400'
                                }`} />
                        </div>
                        Copy {isFolder ? 'Folder' : 'File'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Create a copy of "{file.fileName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Original file preview */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                            {isFolder ? (
                                <Folder className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Original {isFolder ? 'folder' : 'file'}
                            </p>
                        </div>
                    </div>

                    {/* Copy name input */}
                    <div className="space-y-3">
                        <Label htmlFor="copy-name" className="text-sm font-medium text-gray-900 dark:text-white">
                            Name for the copy
                        </Label>
                        <div className="relative">
                            <Input
                                id="copy-name"
                                value={newName}
                                onChange={handleNameChange}
                                onKeyDown={handleKeyPress}
                                placeholder={`Enter name for the ${isFolder ? 'folder' : 'file'} copy`}
                                className={cn(
                                    `pr-${fileExtension ? '16' : '4'}`,
                                    nameError
                                        ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
                                        : 'focus:ring-blue-500/20',
                                    'transition-all duration-200'
                                )}
                                aria-describedby={nameError ? 'copy-error' : undefined}
                                aria-invalid={!!nameError}
                                disabled={copyMutation.isPending}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                            {!isFolder && fileExtension && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">
                                        {fileExtension}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Character count */}
                        <div className="flex justify-between items-center text-xs">
                            <span className={cn(
                                newName.length > 200
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : newName.length > 240
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                            )}>
                                {newName.length}/255 characters
                            </span>
                            {!isFolder && fileExtension && (
                                <span className="text-gray-500 dark:text-gray-400">
                                    Extension: {fileExtension}
                                </span>
                            )}
                        </div>

                        {nameError && (
                            <div
                                id="copy-error"
                                className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                                role="alert"
                            >
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Invalid name
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        {nameError}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview of the copy */}
                    {newName.trim() && !nameError && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-green-200 dark:border-green-700">
                                {isFolder ? (
                                    <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <File className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {newName.trim() + fileExtension}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    New copy preview
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Copy guidelines */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Copy Guidelines
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>Creates an independent copy of the {isFolder ? 'folder' : 'file'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>Copy will be created in the same location</span>
                            </div>
                            {!isFolder && (
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                    <span>File extension will be preserved automatically</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6 gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={copyMutation.isPending}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCopy}
                        disabled={!!nameError || !newName.trim() || copyMutation.isPending}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                        {copyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {copyMutation.isPending ? 'Creating Copy...' : 'Create Copy'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CopyDialog;