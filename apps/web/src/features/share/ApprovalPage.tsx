import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Shield,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';

interface ShareApprovalRequest {
  id: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sharedFile: {
    id: string;
    file: {
      id: string;
      fileName: string;
      fileSize: string;
      fileType: string;
      mimeType: string;
    };
    shareType: string;
    permission: string;
    expiresAt?: string;
    message?: string;
  };
  requestMessage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  responseMessage?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

function useApprovalRequest(approvalId: string) {
  return useQuery<ShareApprovalRequest, Error>({
    queryKey: ['approval-request', approvalId],
    queryFn: async () => {
      const response = await fileEndPoint.getApprovalRequest(approvalId);
      return response;
    },
    enabled: !!approvalId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function ApprovalPage() {
  const approvalId = useParams({ from: '/approvals/$approvalId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [responseMessage, setResponseMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: approvalRequest, isLoading, error } = useApprovalRequest(approvalId.approvalId);

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async (message?: string) => {
      const response = await fileEndPoint.approveShareRequest(approvalId.approvalId, { message });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-request', approvalId] });
      toast.success('Access request approved successfully!');
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
      setIsProcessing(false);
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async (message?: string) => {
      const response = await fileEndPoint.rejectShareRequest(approvalId.approvalId, { message });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-request', approvalId] });
      toast.success('Access request rejected.');
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
      setIsProcessing(false);
    },
  });

  const handleApprove = () => {
    setIsProcessing(true);
    approveMutation.mutate(responseMessage);
  };

  const handleReject = () => {
    setIsProcessing(true);
    rejectMutation.mutate(responseMessage);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading approval request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Request Not Found</CardTitle>
            <CardDescription>
              The approval request could not be found or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/dashboard' })} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!approvalRequest) {
    return null;
  }

  const isProcessed = approvalRequest.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="h-6 w-6" />
                  Access Request Approval
                </CardTitle>
                <CardDescription>
                  Review and respond to the file access request
                </CardDescription>
              </div>
              {getStatusBadge(approvalRequest.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Request Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Requester Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Requester:</span>
                  <span className="text-sm">
                    {approvalRequest.requester.firstName} {approvalRequest.requester.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{approvalRequest.requester.email}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Requested:</span>
                  <span className="text-sm">{formatDate(approvalRequest.requestedAt)}</span>
                </div>
                {approvalRequest.sharedFile.permission && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Requested Permission:</span>
                    <Badge variant="secondary">{approvalRequest.sharedFile.permission}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Request Message */}
            {approvalRequest.requestMessage && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Request Message:</span>
                  </div>
                  <Alert>
                    <AlertDescription>
                      "{approvalRequest.requestMessage}"
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">File Name:</span>
                <p className="text-sm font-medium">{approvalRequest.sharedFile.file.fileName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">File Type:</span>
                <p className="text-sm">{approvalRequest.sharedFile.file.fileType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">File Size:</span>
                <p className="text-sm">{formatFileSize(approvalRequest.sharedFile.file.fileSize)}</p>
              </div>
            </div>

            {approvalRequest.sharedFile.message && (
              <>
                <Separator />
                <div>
                  <span className="text-sm font-medium text-gray-500">Share Message:</span>
                  <Alert className="mt-2">
                    <AlertDescription>
                      "{approvalRequest.sharedFile.message}"
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}

            {approvalRequest.sharedFile.expiresAt && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Share Expires:</span>
                  <span className="text-sm">{formatDate(approvalRequest.sharedFile.expiresAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Response Section */}
        {isProcessed ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {approvalRequest.status === 'APPROVED' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Request {approvalRequest.status === 'APPROVED' ? 'Approved' : 'Rejected'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Processed:</span>
                <span className="text-sm">
                  {formatDate(approvalRequest.approvedAt || approvalRequest.rejectedAt || '')}
                </span>
              </div>
              {approvalRequest.responseMessage && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Response Message:</span>
                  <Alert className="mt-2">
                    <AlertDescription>
                      "{approvalRequest.responseMessage}"
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                Approve or reject this access request. You can optionally include a message for the requester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="response-message">Response Message (optional)</Label>
                <Textarea
                  id="response-message"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Add a message for the requester..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing || approveMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Request
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={isProcessing || rejectMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {rejectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Request
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The requester will be notified via email of your decision. If approved, they will gain access to the file with the specified permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/dashboard' })}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}