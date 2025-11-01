import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFileQueryInvalidation } from '@/hooks/useFileQueryInvalidation';
import { FileItem } from '@/types/file';
import fileEndpoint from '@/api/endpoints/file.endpoint';


function useDeleteInfo(fileId?: string) {
    return useQuery({
        queryKey: ['fileDeleteInfo', fileId],
        queryFn: () => fileEndpoint.getDeleteInfo(fileId!),
        enabled: !!fileId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Custom hook for the delete mutation
const useDeleteFile = () => {
    const { invalidateFileQueries } = useFileQueryInvalidation();
    return useMutation({
        mutationFn: ({ file, deletePermanently }: { file: FileItem; deletePermanently: boolean }) =>
            fileEndpoint.deleteFile(file.id, deletePermanently),
        onSuccess: (_data, variables) => {
            const { file, deletePermanently } = variables;
            toast.success(
                deletePermanently
                    ? `"${file.fileName}" has been permanently deleted.`
                    : `"${file.fileName}" has been moved to trash.`
            );
            invalidateFileQueries();

        },
        onError: (error: Error) => {
            toast.error(error.message || 'An unexpected error occurred.');
        },
    });
};

interface DeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, file }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [permanentDelete, setPermanentDelete] = useState(false);

    const {
        data: deleteInfoResponse,
        isError: isInfoError,
        isLoading: isLoadingInfo,
    } = useDeleteInfo(file?.id);

    const deleteInfo = deleteInfoResponse?.data;
    const deleteMutation = useDeleteFile();

    useEffect(() => {
        if (isOpen) {
            setConfirmDelete(false);
            setPermanentDelete(false);
        }
    }, [isOpen, file]);


    const handleDelete = () => {
        if (!file?.id) return;

        if (!confirmDelete) {
            toast.error('Please confirm deletion to proceed.');
            return;
        }

        deleteMutation.mutate({ file, deletePermanently: permanentDelete });
        onClose();
    };

    const getWarningMessage = () => {
        if (permanentDelete) {
            return 'This action is irreversible. The file will be permanently deleted and cannot be recovered.';
        }
        if (file?.fileType === 'folder' && (deleteInfo?.childrenCount ?? 0) > 0) {
            return `This folder and its ${deleteInfo.childrenCount} item(s) will be moved to trash.`;
        }
        if (deleteInfo?.hasSharedUsers) {
            return `This ${file?.fileType} is shared with ${deleteInfo.sharedUserCount} user(s) who will lose access.`;
        }
        return `This ${file?.fileType ?? 'item'} will be moved to trash and can be restored later.`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-500" />
                        Delete {file?.fileType === 'folder' ? 'Folder' : 'File'}
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{file?.fileName || 'Unknown item'}"?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {isLoadingInfo && (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading details...
                        </div>
                    )}

                    {isInfoError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>Could not load deletion details. Please try again.</AlertDescription>
                        </Alert>
                    )}

                    {deleteInfo && !isLoadingInfo && !isInfoError && (
                        <Alert variant={permanentDelete ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{getWarningMessage()}</AlertDescription>
                        </Alert>
                    )}

                    {!isLoadingInfo && !isInfoError && (
                        <>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="permanent-delete"
                                    checked={permanentDelete}
                                    onCheckedChange={(checked) => setPermanentDelete(checked === true)}
                                    aria-label="Delete permanently"
                                />
                                <label
                                    htmlFor="permanent-delete"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Delete permanently (skip trash)
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="confirm-delete"
                                    checked={confirmDelete}
                                    onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                                    aria-label="Confirm deletion"
                                />
                                <label htmlFor="confirm-delete" className="text-sm leading-none">
                                    I understand and wish to proceed.
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={deleteMutation.isPending || isLoadingInfo}
                        aria-label="Cancel"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={permanentDelete ? 'destructive' : 'default'}
                        onClick={handleDelete}
                        disabled={!confirmDelete || deleteMutation.isPending || isLoadingInfo || isInfoError}
                        className={cn(!permanentDelete && 'bg-blue-600 hover:bg-blue-700')}
                        aria-label={permanentDelete ? 'Delete permanently' : 'Move to trash'}
                    >
                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {deleteMutation.isPending
                            ? 'Deleting...'
                            : permanentDelete
                                ? 'Delete Permanently'
                                : 'Move to Trash'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteDialog;