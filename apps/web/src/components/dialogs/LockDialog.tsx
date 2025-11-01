import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { FileItem } from "@/types/file";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fileEndpoint from '@/api/endpoints/file.endpoint';
import { toast } from "sonner";



interface LockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

export const useLockFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fileId }: { fileId: string }) => fileEndpoint.lock(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },

    });
};

const LockDialog: React.FC<LockDialogProps> = ({ isOpen, onClose, file }) => {
    const lockMutation = useLockFile();
    const MAX_LENGTH = 40;

    if (!file) return null;

    const handleConfirmAction = () => {
        if (file.id) {
            const actionVerb = file.locked ? "unlock" : "lock";
            const actionPastTense = file.locked ? "Unlocked" : "Locked";

            lockMutation.mutate(
                { fileId: file.id },
                {
                    onSuccess: () => {
                        toast.success(`File "${file.fileName}" has been ${actionPastTense}.`);
                        onClose();
                    },

                    onError: (error) => {
                        toast.error(`Failed to ${actionVerb} "${file.fileName}". Please try again.`);
                        // Optional: Log the full error for debugging purposes.
                        console.error(`Failed to ${actionVerb} file:`, error);
                    },
                }
            );
        }
    };

    const isProcessing = lockMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {(() => {
                        // Define the maximum length for the file name

                        // Truncate the file name if it exceeds the max length
                        const displayName =
                            file.fileName.length > MAX_LENGTH
                                ? `${file.fileName.substring(0, MAX_LENGTH - 3)}...`
                                : file.fileName;

                        return (
                            <>
                                <DialogTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-red-600" />
                                    {file.locked ? `Unlock "${displayName}"` : `Lock "${displayName}"`}
                                </DialogTitle>
                                <DialogDescription>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {file.locked
                                            ? `Allow modifications to this ${file.fileType?.toLowerCase() || "file"}`
                                            : `Prevent modifications to this ${file.fileType?.toLowerCase() || "file"}`}
                                    </p>
                                </DialogDescription>
                            </>
                        );
                    })()}
                </DialogHeader>



                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">File Information</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p><span className="font-medium">Name:</span> {`${file.fileName.substring(0, MAX_LENGTH - 3)}...` || "Unknown"}</p>
                            <p><span className="font-medium">Type:</span> {file.fileType || "Unknown"}</p>
                            <p><span className="font-medium">Size:</span> {file.fileSize}</p>
                            <p><span className="font-medium">Shared:</span> {file.shared ? "Yes" : "No"}</p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                    {file.locked ? "Unlock Effects" : "Lock Effects"}
                                </p>
                                <div className="text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                                    {file.locked ? (
                                        <>
                                            <p>• File content can be modified.</p>
                                            <p>• File can be deleted or moved.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>• File content cannot be modified while locked.</p>
                                            <p>• File cannot be deleted or moved while locked.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant={file.locked ? "default" : "destructive"}
                        disabled={!file.id || isProcessing}
                        aria-label={file.locked ? `Unlock ${file.fileName}` : `Lock ${file.fileName}`}
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Lock className="h-4 w-4 mr-2" />
                        )}
                        {isProcessing ? 'Processing...' : (file.locked ? 'Unlock File' : 'Lock File')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LockDialog;