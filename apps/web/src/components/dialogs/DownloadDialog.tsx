
import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Download,
    FileArchive,
    HardDrive,
    Settings,
    Info,
    AlertCircle,
    FileText,
    Image,
    Video,
    Music,
    Package,
    Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { FileItem } from '@/types/file';
import fileEndPoint from '@/api/endpoints/file.endpoint';

// Mock types for development - these should be properly defined when API is ready
interface DownloadOptions {
    format: string;
    compression: 'none' | 'low' | 'medium' | 'high';
    includeMetadata: boolean;
    includeVersionHistory: boolean;
    notifyOnComplete: boolean;
    trackAnalytics: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface DownloadPrepareResponse {
    downloadUrl: string;
}

interface DownloadFormat {
    format: string;
    extension: string;
    description: string;
    size: number;
    recommended?: boolean;
}

interface CompressionOption {
    level: 'none' | 'low' | 'medium' | 'high';
    name: string;
    ratio: number;
    processingTime: number;
}

interface QuotaInfo {
    used: number;
    remaining: number;
    limit: number;
}

interface DownloadInfo {
    downloadFormats: DownloadFormat[];
    compressionOptions: CompressionOption[];
    quotaInfo?: QuotaInfo;
    estimatedTime?: number;
}

// Mock hooks for development
const useDownloadInfo = (fileId: string | undefined) => ({
    data: fileId ? {
        data: {
            downloadFormats: [
                { format: 'original', extension: 'original', description: 'Original format', size: 1024000, recommended: true },
                { format: 'pdf', extension: 'pdf', description: 'PDF format', size: 512000 },
            ],
            compressionOptions: [
                { level: 'none', name: 'No compression', ratio: 0, processingTime: 0 },
                { level: 'low', name: 'Low compression', ratio: 0.2, processingTime: 5 },
                { level: 'medium', name: 'Medium compression', ratio: 0.4, processingTime: 10 },
                { level: 'high', name: 'High compression', ratio: 0.6, processingTime: 20 },
            ],
            quotaInfo: {
                used: 5000000,
                remaining: 15000000,
                limit: 20000000,
            },
            estimatedTime: 30,
        } as DownloadInfo
    } : null,
    isLoading: false,
});

const usePrepareDownload = () => ({
    mutate: async (params: { fileId: string; options: DownloadOptions }, callbacks: any) => {
        try {
            await fileEndPoint.prepareDownload(params.fileId);
            setTimeout(() => {
                callbacks.onSuccess({
                    success: true,
                    data: { downloadUrl: `#download-${params.fileId}` }
                });
            }, 1000);
        } catch (error) {
            console.warn('Prepare download not implemented yet:', error);
            // Fallback behavior
            setTimeout(() => {
                callbacks.onSuccess({
                    success: true,
                    data: { downloadUrl: `#download-${params.fileId}` }
                });
            }, 1000);
        }
    },
    isPending: false,
});


interface DownloadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem;
}

const DownloadDialog: React.FC<DownloadDialogProps> = ({ isOpen, onClose, file }) => {
    const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
        format: 'original',
        compression: 'none',
        includeMetadata: true,
        includeVersionHistory: false,
        notifyOnComplete: true,
        trackAnalytics: true,
    });
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: downloadInfoResponse, isLoading } = useDownloadInfo(file?.id);
    const downloadInfo = downloadInfoResponse?.data;
    const prepareMutation = usePrepareDownload();

    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    const formatTime = useCallback((seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }, []);

    const formatDate = useCallback((date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const getFormatIcon = useCallback((format: string) => {
        if (format.includes('image')) return <Image className="h-4 w-4" />;
        if (format.includes('video')) return <Video className="h-4 w-4" />;
        if (format.includes('audio')) return <Music className="h-4 w-4" />;
        if (format.includes('archive')) return <FileArchive className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    }, []);

    const startDownload = useCallback(
        async (downloadUrl: string, fileName: string) => {
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
                const response = await fetch(downloadUrl);
                if (!response.ok) throw new Error('Download failed');

                const contentLength = response.headers.get('content-length');
                const total = parseInt(contentLength || '0', 10);
                let loaded = 0;

                const reader = response.body?.getReader();
                const chunks: Uint8Array[] = [];

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunks.push(value);
                        loaded += value.length;

                        if (total > 0) {
                            const progress = Math.round((loaded / total) * 100);
                            setDownloadProgress(progress);
                        }
                    }
                }

                const blob = new Blob(chunks);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success('Download completed successfully');
                onClose();
            } catch (error) {
                toast.error('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
            } finally {
                setIsDownloading(false);
                setDownloadProgress(0);
            }
        },
        [onClose]
    );

    const handleDownload = () => {
        if (!file?.id) {
            toast.error('Cannot download: file ID is missing.');
            return;
        }

        prepareMutation.mutate(
            { fileId: file.id, options: downloadOptions },
            {
                onSuccess: (response: ApiResponse<DownloadPrepareResponse>) => {
                    if (response.success && response.data?.downloadUrl) {
                        const format = downloadInfo?.downloadFormats.find((f) => f.format === downloadOptions.format);
                        const extension = format?.extension || '';
                        const fileName = `${file.fileName}${extension !== 'original' ? '.' + extension : ''}`;
                        startDownload(response.data.downloadUrl, fileName);
                    } else {
                        toast.error(response.message || 'Failed to prepare download');
                    }
                },
                onError: (error: any) => {
                    toast.error(error.message || 'Failed to prepare download');
                },
            }
        );
    };

    const selectedFormat = downloadInfo?.downloadFormats.find((f) => f.format === downloadOptions.format);
    const selectedCompression = downloadInfo?.compressionOptions.find((c) => c.level === downloadOptions.compression);
    const estimatedSize = selectedFormat && selectedCompression
        ? Math.round(selectedFormat.size * (1 - selectedCompression.ratio))
        : selectedFormat?.size || parseInt(file?.fileSize) || 0;

    const canDownload = downloadInfo?.quotaInfo
        ? estimatedSize <= downloadInfo.quotaInfo.remaining
        : true;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Download - {file?.fileName}
                    </DialogTitle>
                    <DialogDescription>Configure download options and format preferences</DialogDescription>
                </DialogHeader>

                {isDownloading && (
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Downloading...</span>
                            <span>{downloadProgress}%</span>
                        </div>
                        <Progress value={downloadProgress} className="w-full" />
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-4 text-muted-foreground">Loading download options...</div>
                )}

                {!isLoading && downloadInfo && (
                    <Tabs defaultValue="options" className="flex-1 overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2">
                            {/* <TabsTrigger value="options">Download Options</TabsTrigger>  */}
                            <TabsTrigger value="info">File Info</TabsTrigger>
                        </TabsList>

                        <TabsContent value="options" className="flex-1 overflow-y-auto space-y-6">
                            {/* Format Selection */}
                            <div className="space-y-3 hidden">
                                <Label className="text-base font-medium">Download Format</Label>
                                <div className="grid gap-3">
                                    {downloadInfo.downloadFormats.map((format) => (
                                        <div
                                            key={format.format}
                                            className={cn(
                                                'p-3 border rounded-lg cursor-pointer transition-colors',
                                                downloadOptions.format === format.format
                                                    ? 'border-primary bg-primary/5'
                                                    : 'hover:bg-accent'
                                            )}
                                            onClick={() => setDownloadOptions((prev) => ({ ...prev, format: format.format }))}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && setDownloadOptions((prev) => ({ ...prev, format: format.format }))}
                                            aria-label={`Select ${format.extension.toUpperCase()} format`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getFormatIcon(format.format)}
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {format.extension.toUpperCase()}
                                                            {format.recommended && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Recommended
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{format.description}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">{formatFileSize(format.size)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compression */}
                            <div className="space-y-3 hidden">
                                <Label className="text-base font-medium">Compression Level</Label>
                                <Select
                                    value={downloadOptions.compression}
                                    onValueChange={(value: 'none' | 'low' | 'medium' | 'high') =>
                                        setDownloadOptions((prev) => ({ ...prev, compression: value }))
                                    }
                                >
                                    <SelectTrigger aria-label="Compression level">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {downloadInfo.compressionOptions.map((option) => (
                                            <SelectItem key={option.level} value={option.level}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{option.name}</span>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Badge variant="outline">{Math.round(option.ratio * 100)}% smaller</Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            +{formatTime(option.processingTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Additional Options */}
                            <div className="space-y-4 hidden">
                                <Label className="text-base font-medium">Additional Options</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="include-metadata"
                                            checked={downloadOptions.includeMetadata}
                                            onCheckedChange={(checked) =>
                                                setDownloadOptions((prev) => ({ ...prev, includeMetadata: checked as boolean }))
                                            }
                                            aria-label="Include metadata"
                                        />
                                        <Label htmlFor="include-metadata">
                                            Include metadata (creation date, author, tags, etc.)
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="include-version-history"
                                            checked={downloadOptions.includeVersionHistory}
                                            onCheckedChange={(checked) =>
                                                setDownloadOptions((prev) => ({ ...prev, includeVersionHistory: checked as boolean }))
                                            }
                                            aria-label="Include version history"
                                        />
                                        <Label htmlFor="include-version-history">
                                            Include version history (creates a ZIP with all versions)
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="notify-complete"
                                            checked={downloadOptions.notifyOnComplete}
                                            onCheckedChange={(checked) =>
                                                setDownloadOptions((prev) => ({ ...prev, notifyOnComplete: checked as boolean }))
                                            }
                                            aria-label="Notify on complete"
                                        />
                                        <Label htmlFor="notify-complete">Notify me when download completes</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="track-analytics"
                                            checked={downloadOptions.trackAnalytics}
                                            onCheckedChange={(checked) =>
                                                setDownloadOptions((prev) => ({ ...prev, trackAnalytics: checked as boolean }))
                                            }
                                            aria-label="Track download analytics"
                                        />
                                        <Label htmlFor="track-analytics">Track download analytics (for usage insights)</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Download Summary */}
                            <div className="p-4 border rounded-lg bg-muted/50 hidden">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-4 w-4" />
                                    <span className="font-medium">Download Summary</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Format:</span>
                                        <span>{selectedFormat?.extension.toUpperCase() || 'Original'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Compression:</span>
                                        <span>{selectedCompression?.name || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Estimated size:</span>
                                        <span className="font-medium">{formatFileSize(estimatedSize)}</span>
                                    </div>
                                    {selectedCompression && selectedCompression.processingTime > 0 && (
                                        <div className="flex justify-between">
                                            <span>Processing time:</span>
                                            <span>{formatTime(selectedCompression.processingTime)}</span>
                                        </div>
                                    )}
                                    {downloadInfo.estimatedTime && (
                                        <div className="flex justify-between">
                                            <span>Download time:</span>
                                            <span>{formatTime(downloadInfo.estimatedTime)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="flex-1 overflow-y-auto space-y-6">
                            {/* File Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    <span className="font-medium">File Information</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Original size:</span>
                                        <div className="font-medium">{formatFileSize(parseInt(file.fileSize))}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">File type:</span>
                                        <div className="font-medium">{file.mimeType || file.type || 'Unknown'}</div>
                                    </div>
                                    {file.createdAt && (
                                        <div>
                                            <span className="text-muted-foreground">Created:</span>
                                            <div className="font-medium">{formatDate(file.createdAt)}</div>
                                        </div>
                                    )}
                                    {file.modified && (
                                        <div>
                                            <span className="text-muted-foreground">Modified:</span>
                                            <div className="font-medium">{formatDate(file.modified)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quota Information */}
                            {downloadInfo?.quotaInfo && (
                                <div className="space-y-4 hidden">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4" />
                                        <span className="font-medium">Download Quota</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Used this month:</span>
                                            <span>{formatFileSize(downloadInfo.quotaInfo.used)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Remaining:</span>
                                            <span>{formatFileSize(downloadInfo.quotaInfo.remaining)}</span>
                                        </div>
                                        <Progress
                                            value={(downloadInfo.quotaInfo.used / downloadInfo.quotaInfo.limit) * 100}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Quota Warning */}
                {downloadInfo?.quotaInfo && estimatedSize > downloadInfo.quotaInfo.remaining && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This download ({formatFileSize(estimatedSize)}) exceeds your remaining quota (
                            {formatFileSize(downloadInfo.quotaInfo.remaining)}). Please choose a smaller format or compression level.
                        </AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDownloading || prepareMutation.isPending}
                        aria-label="Cancel"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={isDownloading || prepareMutation.isPending || !canDownload}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        aria-label="Download file"
                    >
                        {isDownloading ? (
                            <>
                                <Zap className="h-4 w-4 animate-spin" />
                                Downloading...
                            </>
                        ) : prepareMutation.isPending ? (
                            <>
                                <Settings className="h-4 w-4 animate-spin" />
                                Preparing...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download ({formatFileSize(estimatedSize)})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DownloadDialog;