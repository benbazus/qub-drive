
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, File, Folder } from "lucide-react";
import { FileItem } from "@/types/file";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { toast } from "sonner";

interface RenameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

function useRenameFile() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { fileId: string; newName: string }>({
        mutationFn: ({ fileId, newName }) => fileEndPoint.rename(fileId, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
}

const RenameDialog: React.FC<RenameDialogProps> = ({ isOpen, onClose, file }) => {
    const [newName, setNewName] = useState("");
    const [clientError, setClientError] = useState("");

    const renameMutation = useRenameFile();
    const { mutate, isPending, error: serverError, reset } = renameMutation;

    const getFileExtension = () => {
        if (file?.fileType === "folder" || !file?.fileName?.includes(".")) return "";
        return file.fileName.substring(file.fileName.lastIndexOf("."));
    };

    useEffect(() => {
        if (isOpen && file) {
            const extension = getFileExtension();
            const nameWithoutExtension = extension
                ? file.fileName.substring(0, file.fileName.lastIndexOf("."))
                : file.fileName;
            setNewName(nameWithoutExtension || "");
            setClientError("");
            reset();
        }
    }, [isOpen, file, reset]);

    const validateFileName = (name: string): string | null => {
        if (!name.trim()) {
            return "Name cannot be empty.";
        }
        if (name.length > 255) {
            return "Name is too long (maximum 255 characters).";
        }
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
            return "Name contains invalid characters.";
        }
        // Check for reserved names on Windows
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        if (reservedNames.test(name.trim())) {
            return "This name is reserved and cannot be used.";
        }
        return null;
    };

    const handleRename = () => {
        setClientError("");

        const trimmedName = newName.trim();
        const validationError = validateFileName(trimmedName);

        if (validationError) {
            setClientError(validationError);
            return;
        }

        if (!file?.id) {
            setClientError("File ID is missing.");
            return;
        }

        const finalName = trimmedName + getFileExtension();

        // Prevent API call if name hasn't changed
        if (finalName === file.fileName) {
            onClose();
            return;
        }

        mutate(
            { fileId: file.id, newName: finalName },
            {
                onSuccess: () => {
                    toast.success(
                        `${file.fileType === "folder" ? "Folder" : "File"} renamed successfully`,
                        {
                            description: `"${file.fileName}" → "${finalName}"`
                        }
                    );
                    onClose();
                },
                onError: (err) => {
                    toast.error("Failed to rename", {
                        description: err.message || "Please try again."
                    });
                }
            }
        );
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isPending && newName.trim()) {
            handleRename();
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    const displayError = serverError ? serverError.message : clientError;
    const isFolder = file?.fileType === "folder";
    const extension = getFileExtension();

    if (!file) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] gap-0">
                <DialogHeader className="pb-6">
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        <div className={`p-2 rounded-lg ${isFolder
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                            {isFolder ? (
                                <Folder className={`h-5 w-5 ${isFolder
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                    }`} />
                            ) : (
                                <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                        </div>
                        Rename {isFolder ? "Folder" : "File"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Enter a new name for "{file.fileName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current file preview */}
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
                                Current name
                            </p>
                        </div>
                    </div>

                    {/* Input section */}
                    <div className="space-y-3">
                        <Label htmlFor="new-name" className="text-sm font-medium text-gray-900 dark:text-white">
                            New name
                        </Label>
                        <div className="relative">
                            <Input
                                id="new-name"
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value);
                                    if (clientError) setClientError(""); // Clear error on input
                                }}
                                onKeyDown={handleKeyPress}
                                placeholder={`Enter ${isFolder ? 'folder' : 'file'} name`}
                                className={`pr-${extension ? '16' : '4'} ${displayError
                                    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
                                    : 'focus:ring-blue-500/20'
                                    } transition-all duration-200`}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                                aria-describedby={displayError ? "rename-error" : undefined}
                                aria-invalid={!!displayError}
                                disabled={isPending}
                            />
                            {!isFolder && extension && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">
                                        {extension}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Character count */}
                        <div className="flex justify-between items-center text-xs">
                            <span className={`${newName.length > 200
                                ? 'text-amber-600 dark:text-amber-400'
                                : newName.length > 240
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {newName.length}/255 characters
                            </span>
                            {!isFolder && extension && (
                                <span className="text-gray-500 dark:text-gray-400">
                                    Extension: {extension}
                                </span>
                            )}
                        </div>

                        {displayError && (
                            <div
                                className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                                id="rename-error"
                                role="alert"
                            >
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Invalid name
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        {displayError}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Validation hints */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Naming Guidelines
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>Cannot contain: &lt; &gt; : " / \ | ? *</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>Maximum 255 characters</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>Cannot be empty or only spaces</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6 gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRename}
                        disabled={isPending || !newName.trim() || !!displayError}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Renaming..." : "Rename"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RenameDialog;