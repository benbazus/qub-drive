import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFileIcon } from "../fileUtils";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { FileItem } from "@/types/file";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import fileEndPoint from "@/api/endpoints/file.endpoint";

interface PreviewDialogProps {
    isOpen: boolean;
    file: FileItem | null;
    onClose: () => void;

}

function useDownloadFile() {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { fileId: string }>({
        mutationFn: ({ fileId }) => fileEndPoint.downloadFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({ isOpen, file, onClose }) => {
    if (!file) return null;

    const downloadFileMutation = useDownloadFile();

    const handleDownload = () => {
        if (file?.id) {
            downloadFileMutation.mutate({ fileId: file.id });
        } else {
            console.log("Download file", file.fileName); // Fallback for demo purposes
        }
    };

    const handleOpenInNewTab = () => {
        // Mock implementation for opening in new tab
        console.log("Open file in new tab", file.fileName);
        // In a real implementation, this would open the file in a new tab
        // window.open(file.previewUrl, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {getFileIcon(file.fileType) || <span className="h-5 w-5" />}
                        Preview: {file.fileName}
                    </DialogTitle>
                    <DialogDescription>
                        File type: {(file.fileType)?.toUpperCase() || "Unknown"} • Size: {file.fileSize}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            {getFileIcon(file.fileType) || <span className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preview not available</h3>
                            <p className="text-gray-600 dark:text-gray-400">This file type cannot be previewed</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" onClick={handleDownload} aria-label={`Download ${file.fileName}`}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleOpenInNewTab} aria-label={`Open ${file.fileName} in new tab`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Open in new tab
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};



export default PreviewDialog;