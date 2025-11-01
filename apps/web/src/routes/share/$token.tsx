
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Loader2,
  Download,
  Eye,
  Lock,
  Calendar,
  User,
  FileText,
  Shield,
  Clock,
  Share2,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import fileEndpoint, { fileEndPoint } from "@/api/endpoints/file.endpoint";
import { PDFViewer, ImageViewer } from '@/components/viewers';



interface ShareAccessRequest {
  message?: string;
  requestedPermission?: string;
  guestName?: string;
  guestEmail?: string;
}
// Define share info interface
interface ShareInfo {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  sharedBy: string;
  shareType: string;
  permission: string;
  message?: string;
  expiresAt?: string;
  requiresPassword: boolean;
  requireApproval: boolean;
  isApproved?: boolean;
  isExpired: boolean;
  allowDownload: boolean;
  watermark?: boolean;
}

// Define loader data type
interface ShareLoaderData {
  shareToken: string;
  shareInfo: ShareInfo;
}

// Define expected params
interface ShareRouteParams {
  token: string;
}

// Create a custom error type for better error handling
class TransferError extends Error {
  constructor(
    message: string,
    public readonly type: 'NOT_FOUND' | 'EXPIRED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

// Error message display component
const ErrorMessageDisplay = ({
  type,
  message
}: {
  type: TransferError['type'];
  message: string
}) => {
  const errorConfig = {
    NOT_FOUND: {
      icon: '🔍',
      title: 'Transfer Not Found',
      defaultMessage: 'The file you\'re looking for doesn\'t exist or the link is invalid.',
    },
    EXPIRED: {
      icon: '⏰',
      title: 'Transfer Expired',
      defaultMessage: 'This transfer link has expired and is no longer available.',
    },
    NETWORK: {
      icon: '🌐',
      title: 'Connection Error',
      defaultMessage: 'Unable to connect to the server. Please check your internet connection.',
    },
    UNKNOWN: {
      icon: '⚠️',
      title: 'Something Went Wrong',
      defaultMessage: 'An unexpected error occurred. Please try again later.',
    },
  };

  const config = errorConfig[type];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 sm:p-8">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">{config.icon}</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {message || config.defaultMessage}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Go to Homepage
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/share/$token")({
  component: ShareViewPage,
  loader: async ({ params }: { params: ShareRouteParams }): Promise<ShareLoaderData> => {
    try {
      const response = await fileEndpoint.getSharedFile(params.token);
      return {
        shareToken: params.token,
        shareInfo: response.data
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TransferError(
          'Unable to connect. Please check your internet connection.',
          'NETWORK'
        );
      }

      // Re-throw TransferError as-is
      if (error instanceof TransferError) {
        throw error;
      }

      // Catch-all for unexpected errors
      throw new TransferError(
        'An unexpected error occurred. Please try again later.',
        'UNKNOWN'
      );
    }
  },
  errorComponent: ({ error }) => {
    const transferError = error instanceof TransferError
      ? error
      : new TransferError('An unexpected error occurred', 'UNKNOWN');

    return (
      <ErrorMessageDisplay
        type={transferError.type}
        message={transferError.message}
      />
    );
  },
});



// Helper function to get file type icon and color
const getFileTypeInfo = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return { icon: '📄', color: 'bg-red-100 text-red-700' };
  if (type.includes('doc') || type.includes('word')) return { icon: '📝', color: 'bg-blue-100 text-blue-700' };
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return { icon: '🖼️', color: 'bg-green-100 text-green-700' };
  if (type.includes('video')) return { icon: '🎥', color: 'bg-purple-100 text-purple-700' };
  if (type.includes('audio')) return { icon: '🎵', color: 'bg-orange-100 text-orange-700' };
  return { icon: '📁', color: 'bg-gray-100 text-gray-700' };
};

// Helper function to format file size
const formatFileSize = (size: string) => {
  const bytes = parseInt(size);
  if (isNaN(bytes)) return size;

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = bytes;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
};

function ShareViewPage() {
  const { shareInfo, shareToken } = Route.useLoaderData();
  const token = shareToken;

  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [accessRequest, setAccessRequest] = useState<ShareAccessRequest>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAccessRequestForm, setShowAccessRequestForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | undefined>();

  // Get approval token from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const approval = urlParams.get('approval');
    if (approval) {
      setApprovalToken(approval);
    }
  }, []);



  // Password verification mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      const response = await fileEndPoint.getSharedFile(token);
      return response;
    },
    onSuccess: () => {
      setShowPasswordForm(false);
      toast.success('Access granted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid password');
    },
  });

  // Access request mutation
  const accessRequestMutation = useMutation({
    mutationFn: async (data: ShareAccessRequest) => {
      const response = await fileEndpoint.requestShareAccess(token, data);
      return response;
    },
    onSuccess: () => {
      setShowAccessRequestForm(false);
      toast.success('Access request sent! You will be notified once approved.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request access');
    },
  });

  // Download file mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!shareInfo?.id) {
        throw new Error('File ID is not available');
      }
      const response = await fileEndpoint.downloadFile(shareInfo.id);
      return response;
    },
    onSuccess: (data) => {
      if (data.downloadUrl) {
        // Create a temporary link element for direct download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = shareInfo?.fileName || 'download';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download file');
    },
  });

  // Helper functions for preview
  const getPreviewUrl = () => {
    if (!shareInfo?.id) return '';
    return fileEndPoint.getPreviewUrl(shareInfo.id);
  };

  const isPreviewSupported = () => {
    if (!shareInfo) return false;
    return fileEndPoint.isPreviewSupported(shareInfo.fileType, shareInfo.fileName);
  };

  const getPreviewType = () => {
    if (!shareInfo) return 'unsupported';
    return fileEndPoint.getPreviewType(shareInfo.fileType, shareInfo.fileName);
  };

  const handlePreviewClick = () => {
    if (isPreviewSupported()) {
      setShowPreview(true);
    } else {
      toast.error('Preview not supported for this file type');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (shareInfo?.requiresPassword && !approvalToken) {
      setShowPasswordForm(true);
    }
    if (shareInfo?.requireApproval && !shareInfo?.isApproved) {
      setShowAccessRequestForm(true);
    }
  }, [shareInfo, approvalToken]);

  if (shareInfo?.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-orange-600">Link Expired</CardTitle>
            <CardDescription className="text-gray-600">
              This share link has expired and is no longer accessible. Please request a new link from the file owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/' })}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 border-0 shadow-lg"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileTypeInfo = shareInfo ? getFileTypeInfo(shareInfo.fileType) : { icon: '📁', color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shared File Access</h1>
              <p className="text-sm text-gray-600">Securely access shared content</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Password Form */}
        {showPasswordForm && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Password Required</span>
                  <Badge variant="secondary" className="ml-2">Protected</Badge>
                </div>
              </CardTitle>
              <CardDescription className="text-gray-600">
                This file is password protected. Please enter the correct password to access it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-white/50 border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && passwordMutation.mutate()}
                />
              </div>
              <Button
                onClick={() => passwordMutation.mutate()}
                disabled={!password || passwordMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg"
              >
                {passwordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Password...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Access File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Access Request Form */}
        {showAccessRequestForm && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Approval Required</span>
                  <Badge variant="secondary" className="ml-2">Restricted</Badge>
                </div>
              </CardTitle>
              <CardDescription className="text-gray-600">
                This file requires approval from the owner. Please provide your details to request access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name" className="text-sm font-medium">Your Name *</Label>
                  <Input
                    id="guest-name"
                    value={accessRequest.guestName || ''}
                    onChange={(e) =>
                      setAccessRequest((prev) => ({ ...prev, guestName: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={accessRequest.guestEmail || ''}
                    onChange={(e) =>
                      setAccessRequest((prev) => ({ ...prev, guestEmail: e.target.value }))
                    }
                    placeholder="Enter your email address"
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-message" className="text-sm font-medium">Message (optional)</Label>
                <Textarea
                  id="request-message"
                  value={accessRequest.message || ''}
                  onChange={(e) =>
                    setAccessRequest((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Why do you need access to this file?"
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => accessRequestMutation.mutate(accessRequest)}
                disabled={accessRequestMutation.isPending || !accessRequest.guestName || !accessRequest.guestEmail}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg"
              >
                {accessRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Request Access
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                * Required fields. The file owner will be notified of your request.
              </p>
            </CardContent>
          </Card>
        )}

        {/* File Information */}
        {!showPasswordForm && !showAccessRequestForm && shareInfo && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1"></div>
            <CardHeader className="pb-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${fileTypeInfo.color}`}>
                  {fileTypeInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl font-bold text-gray-900 truncate">
                    {shareInfo.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4" />
                    <span>Shared by <strong>{shareInfo.sharedBy}</strong></span>
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {shareInfo.shareType.toLowerCase()}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {shareInfo.permission.toLowerCase()} access
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/80 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <FileText className="h-4 w-4" />
                    File Size
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatFileSize(shareInfo.fileSize)}
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Info className="h-4 w-4" />
                    File Type
                  </div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {shareInfo.fileType}
                  </div>
                </div>

                {shareInfo.expiresAt && (
                  <div className="bg-gray-50/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      Expires
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(shareInfo.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Message from Sharer */}
              {shareInfo.message && (
                <>
                  <Separator />
                  <Alert className="border-blue-200 bg-blue-50/50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Message from {shareInfo.sharedBy}:</strong> {shareInfo.message}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Security Features */}
              {shareInfo.watermark && (
                <Alert className="border-amber-200 bg-amber-50/50">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Security Notice:</strong> This file includes a watermark for protection and tracking purposes.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12 bg-white/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  onClick={handlePreviewClick}
                  disabled={!isPreviewSupported()}
                >
                  <Eye className="mr-2 h-5 w-5" />
                  {isPreviewSupported() ? 'Preview File' : 'Preview Not Available'}
                </Button>

                {shareInfo.allowDownload && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadMutation.mutate();
                    }}
                    disabled={downloadMutation.isPending}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 shadow-lg"
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download File
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!shareInfo.allowDownload && (
                <Alert className="border-gray-200 bg-gray-50/50">
                  <Info className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-gray-700">
                    Download is not permitted for this file. You can only preview the content.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className={`${isFullscreen ? 'max-w-full w-full h-full' : 'max-w-6xl w-full max-h-[90vh]'} p-0 overflow-hidden`}>
          <div className="relative h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-50 bg-black/70 backdrop-blur-sm text-white hover:bg-black/80"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Preview content */}
            {shareInfo && showPreview && (
              <div className="p-4 h-[calc(100vh-100px)]">
                {getPreviewType() === 'pdf' && (
                  <PDFViewer
                    fileUrl={getPreviewUrl()}
                    fileName={shareInfo.fileName}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    className="w-full h-full"
                  />
                )}
                {getPreviewType() === 'image' && (
                  <ImageViewer
                    imageUrl={getPreviewUrl()}
                    fileName={shareInfo.fileName}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    className="w-full h-full"
                  />
                )}
                {getPreviewType() === 'unsupported' && (
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <AlertTriangle className="h-16 w-16 text-yellow-500" />
                    <h3 className="text-lg font-semibold">Preview Not Available</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      This file type is not supported for preview. You can download the file to view it.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}