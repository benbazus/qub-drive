import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getFileIcon } from "../fileUtils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Lock, Star, Users, Calendar, FolderOpen, User, HardDrive } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FileItem } from "@/types/file";

interface DetailsDialogProps {
    isOpen: boolean;
    file: FileItem | null;
    onClose: () => void;
}

const DetailsDialog: React.FC<DetailsDialogProps> = ({ isOpen, file, onClose }) => {
    if (!file) return null;

    // Helper function to format file size
    const formatFileSize = (size: string | number | undefined): string => {
        if (!size) return "Unknown";

        if (typeof size === 'string') {
            return size;
        }

        const bytes = Number(size);
        if (isNaN(bytes)) return "Unknown";

        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Helper function to format dates
    const formatDate = (date: string | Date | undefined): string => {
        if (!date) return "Unknown";

        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return "Unknown";

            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(dateObj);
        } catch (error) {
            return "Unknown";
        }
    };

    // Get file extension for display
    const getFileExtension = (fileName: string): string => {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : file.fileType?.toUpperCase() || "FILE";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        File Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Detailed information about your file
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* File Preview Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 border border-gray-200 dark:border-gray-700">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl" />
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                                {getFileIcon(file.type) || (
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                        {getFileExtension(file.fileName).charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate" title={file.fileName}>
                                    {file.fileName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {getFileExtension(file.fileName)} • {formatFileSize(file.fileSize)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Badges */}
                    {(file.starred || file.shared || file.locked) && (
                        <div className="flex flex-wrap gap-2">
                            {file.starred && (
                                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                                    <Star className="h-3 w-3 mr-1.5 fill-current" />
                                    Starred
                                </Badge>
                            )}
                            {file.shared && (
                                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                    <Users className="h-3 w-3 mr-1.5" />
                                    Shared
                                </Badge>
                            )}
                            {file.locked && (
                                <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800">
                                    <Lock className="h-3 w-3 mr-1.5" />
                                    Locked
                                </Badge>
                            )}
                        </div>
                    )}

                    <Separator className="bg-gray-200 dark:bg-gray-700" />

                    {/* File Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                <HardDrive className="h-3 w-3" />
                                File Size
                            </Label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatFileSize(file.fileSize)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                Last Modified
                            </Label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {(file.modified || file.createdAt)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Info className="h-3 w-3" />
                                File Type
                            </Label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {file.fileType === 'folder' ? 'Folder' : `${getFileExtension(file.fileName)} File`}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                Owner
                            </Label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file?.owner?.email || "You"}
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-gray-200 dark:bg-gray-700" />

                    {/* Additional Details */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">Additional Information</h4>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(file.createdAt)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-48" title={file.location || "/My Files"}>
                                    {file.location || "/My Files"}
                                </span>
                            </div>

                            {file.id && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">File ID</span>
                                    </div>
                                    <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                        {file.id.length > 12 ? `${file.id.substring(0, 12)}...` : file.id}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6 gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DetailsDialog;