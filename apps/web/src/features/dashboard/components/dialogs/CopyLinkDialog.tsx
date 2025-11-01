import React, { useState, useEffect } from 'react';
import { Link, Copy, Eye, Edit, Shield, Check, Loader2, Calendar, Download, Lock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types/file';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileEndPoint, CopyLinkData, CopyLinkResponse } from '../../../../api/endpoints/file.endpoint';
import { toast } from 'sonner';

// --- Helper Functions ---

const formatFileSize = (size: string | number | undefined): string => {
  if (!size) return '0 Bytes';

  const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
  if (isNaN(bytes) || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};



const getFileIcon = (_fileType?: string) => {
  // You can expand this based on your file type needs
  return <Link className="h-4 w-4" />;
};

// --- Type Definitions ---

interface FormState {
  linkType: 'VIEW' | 'EDIT';
  expiryDays: string;
  allowDownload: boolean;
  maxDownloads: string;
  requirePassword: boolean;
  password: string;
}

const initialState: FormState = {
  linkType: 'VIEW',
  expiryDays: '7',
  allowDownload: true,
  maxDownloads: '',
  requirePassword: false,
  password: '',
};

interface CopyLinkDialogProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
}

// --- React Query Hook ---

function useCreateShareLink() {
  const queryClient = useQueryClient();
  return useMutation<CopyLinkResponse, Error, CopyLinkData>({
    mutationFn: (data) => fileEndPoint.createShareLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

// --- Component ---

const CopyLinkDialog: React.FC<CopyLinkDialogProps> = ({ isOpen, file, onClose }) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const copyLinkMutation = useCreateShareLink();

  // Reset state when the dialog is opened
  useEffect(() => {
    if (isOpen) {
      setFormState(initialState);
      setGeneratedLink('');
      setCopied(false);
      copyLinkMutation.reset();
    }
  }, [isOpen, copyLinkMutation.reset]);

  const handleGenerateLink = () => {
    if (!file?.id) {
      toast.error('File ID is missing');
      return;
    }

    const linkData: CopyLinkData = {
      fileId: file.id,
      permission: 'VIEW', // Default permission
      downloadAllowed: formState.allowDownload,
      expiresAt: formState.expiryDays === 'never' ? undefined : new Date(Date.now() + parseInt(formState.expiryDays) * 24 * 60 * 60 * 1000).toISOString(),
      password: formState.requirePassword ? formState.password : undefined,
      requirePassword: formState.requirePassword,
    };

    copyLinkMutation.mutate(linkData, {
      onSuccess: (response) => {

        console.log(" ======== HHHHHHHHHH ============= ")
        console.log(response.shareUrl)
        console.log(" ======= HHHHHHHHHH ============== ")

        if (response?.shareUrl) {
          setGeneratedLink(response.shareUrl);
          toast.success('Shareable link generated', {
            description: 'Link is ready to share with others'
          });
        } else {
          toast.error('Failed to generate link', {
            description: 'Please try again'
          });
        }
      },
      onError: (error) => {
        toast.error('Generation failed', {
          description: error.message || 'Please check your connection and try again'
        });
      }
    });
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Link copied successfully', {
        description: 'You can now paste it anywhere to share'
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('Link copied successfully');
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackErr) {
        toast.error('Failed to copy link', {
          description: 'Please copy the link manually'
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleFormChange = (updates: Partial<FormState>) => {
    setFormState(prevState => ({ ...prevState, ...updates }));
  };

  const isGenerating = copyLinkMutation.isPending;
  const isFormValid = !formState.requirePassword || (formState.requirePassword && formState.password.trim() !== '');
  const isFolder = file?.fileType === 'folder';

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto gap-0">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Create Shareable Link
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Generate a secure link to share your {isFolder ? 'folder' : 'file'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Preview */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              {getFileIcon(file.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={file.fileName}>
                {file.fileName}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span className="capitalize">{file.fileType || 'Unknown type'}</span>
              </div>
            </div>
          </div>

          {/* Access Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Access Level
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFormChange({ linkType: 'VIEW' })}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02]',
                  formState.linkType === 'VIEW'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                )}
              >
                <Eye className="h-5 w-5 mb-2 text-blue-600 dark:text-blue-400" />
                <div className="font-medium">View Only</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recipients can view and comment
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleFormChange({ linkType: 'EDIT' })}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02]',
                  formState.linkType === 'EDIT'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-gray-800'
                )}
              >
                <Edit className="h-5 w-5 mb-2 text-orange-600 dark:text-orange-400" />
                <div className="font-medium">Can Edit</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recipients can edit and share
                </div>
              </button>
            </div>
          </div>

          {/* Link Expiration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Link Expires
            </Label>
            <Select
              value={formState.expiryDays}
              onValueChange={(value) => handleFormChange({ expiryDays: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expiry period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Options */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Options
            </h4>

            {/* Download Permission */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="allowDownload"
                  checked={formState.allowDownload}
                  onCheckedChange={(checked) => handleFormChange({ allowDownload: !!checked })}
                />
                <Label
                  htmlFor="allowDownload"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Allow downloads
                </Label>
              </div>

              {formState.allowDownload && (
                <div className="ml-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Download limit (optional)
                  </Label>
                  <Input
                    type="number"
                    value={formState.maxDownloads}
                    onChange={(e) => handleFormChange({ maxDownloads: e.target.value })}
                    placeholder="Unlimited downloads"
                    min="1"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Password Protection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="requirePassword"
                  checked={formState.requirePassword}
                  onCheckedChange={(checked) => handleFormChange({ requirePassword: !!checked })}
                />
                <Label
                  htmlFor="requirePassword"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Password protection
                </Label>
              </div>

              {formState.requirePassword && (
                <div className="ml-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Access password *
                  </Label>
                  <Input
                    type="password"
                    value={formState.password}
                    onChange={(e) => handleFormChange({ password: e.target.value })}
                    placeholder="Enter a secure password..."
                    className={cn(
                      !formState.password.trim() && formState.requirePassword
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400'
                        : ''
                    )}
                    required={formState.requirePassword}
                  />
                  {formState.requirePassword && !formState.password.trim() && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Password is required when password protection is enabled
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generated Link Section */}
          {generatedLink && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-green-100 dark:bg-green-800/30 rounded-full">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <Label className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Shareable Link Generated Successfully
                  </Label>
                </div>

                {/* Enhanced Link Display Control */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                    Your Shareable Link
                  </Label>

                  {/* Main Link Display */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-200/50 to-blue-200/50 dark:from-green-800/30 dark:to-blue-800/30 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-700 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-md">
                          <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all select-all">
                            {generatedLink}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Click anywhere on the link to select all
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Actions Row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={copyToClipboard}
                      className={cn(
                        'flex-1 transition-all duration-300 transform hover:scale-[1.02]',
                        copied
                          ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Link Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link to Clipboard
                        </>
                      )}
                    </Button>

                    {/* Additional Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const subject = encodeURIComponent(`Shared: ${file.fileName}`);
                          const body = encodeURIComponent(`I'm sharing "${file.fileName}" with you.\n\nAccess it here: ${generatedLink}\n\nThis link ${formState.expiryDays === 'never' ? 'never expires' : `expires in ${formState.expiryDays} day(s)`}.`);
                          window.open(`mailto:?subject=${subject}&body=${body}`);
                        }}
                        className="border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Share via email"
                      >
                        📧
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const text = encodeURIComponent(`Check out "${file.fileName}": ${generatedLink}`);
                          const url = `https://twitter.com/intent/tweet?text=${text}`;
                          window.open(url, '_blank', 'width=550,height=420');
                        }}
                        className="border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Share on Twitter"
                      >
                        🐦
                      </Button>
                    </div>
                  </div>

                  {/* Link Details Summary */}
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-green-200/50 dark:border-green-700/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Access:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formState.linkType === 'VIEW' ? '👀 View Only' : '✏️ Can Edit'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formState.expiryDays === 'never' ? '♾️ Never' : `⏰ ${formState.expiryDays} day(s)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Downloads:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formState.allowDownload ? '📥 Allowed' : '🚫 Blocked'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Protection:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formState.requirePassword ? '🔐 Password' : '🔓 None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-800/20 rounded-lg p-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Share this link with others to give them access to your {isFolder ? 'folder' : 'file'}.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link Summary */}
          {!generatedLink && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Link Summary</h5>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Access level:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formState.linkType === 'VIEW' ? 'View Only' : 'Can Edit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formState.expiryDays === 'never' ? 'Never' : `${formState.expiryDays} day(s)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formState.allowDownload ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formState.requirePassword ? 'Required' : 'Not required'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 sm:flex-none"
          >
            {generatedLink ? 'Done' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating || !isFormValid}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyLinkDialog;