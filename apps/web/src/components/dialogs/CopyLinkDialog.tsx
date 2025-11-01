

import { useState, useEffect } from "react";
import { Link, Copy, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FileItem } from "../../api/types/file";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import fileEndpoint, { CopyLinkData, CopyLinkResponse } from "@/api/endpoints/file.endpoint";

// --- Helper Functions ---
const formatFileSize = (size: string | number | undefined): string => {
  if (!size) return "0 Bytes";
  const bytes = typeof size === "string" ? parseInt(size, 10) : size;
  if (isNaN(bytes) || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const calculateExpiresAt = (days: string): string | undefined => {
  if (days === "never") return undefined;
  const daysNum = parseInt(days, 10);
  if (isNaN(daysNum)) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + daysNum);
  return date.toISOString();
};

// --- Type Definitions ---
interface FormState {
  linkType: "VIEW" | "EDIT";
  expiryDays: string;
  allowDownload: boolean;
  maxDownloads: string;
  requirePassword: boolean;
  password: string;
}

const initialState: FormState = {
  linkType: "VIEW",
  expiryDays: "7",
  allowDownload: true,
  maxDownloads: "",
  requirePassword: false,
  password: "",
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
    mutationFn: (data) => fileEndpoint.createShareLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

// --- Component ---
const CopyLinkDialog: React.FC<CopyLinkDialogProps> = ({ isOpen, file, onClose }) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);


  const copyLinkMutation = useCreateShareLink();
  const isGenerating = copyLinkMutation.isPending;


  useEffect(() => {
    if (isOpen) {
      setFormState(initialState);
      setGeneratedLink("");
      setCopied(false);
      if (copyLinkMutation.reset) {
        copyLinkMutation.reset();
      }
    }
  }, [isOpen, copyLinkMutation.reset]);

  const handleGenerateLink = () => {
    if (!file?.id) {
      toast.error("File ID is missing");
      return;
    }
    const linkData: CopyLinkData = {
      fileId: file.id,
      permission: formState.linkType,
      shareType: "LINK",
      expiresAt: calculateExpiresAt(formState.expiryDays),
      downloadAllowed: formState.allowDownload,
      requirePassword: formState.requirePassword,
      password: formState.requirePassword ? formState.password : undefined,
      maxDownloads: formState.maxDownloads ? parseInt(formState.maxDownloads, 10) : undefined,
    };

    copyLinkMutation.mutate(linkData, {
      onSuccess: (response) => {

        console.log(" ======== HHHHHHHHHH ============= ")
        console.log(response)
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
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleFormChange = (updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  // Fixed checkbox handlers
  const handleAllowDownloadChange = (checked: boolean | string) => {
    const isChecked = checked === true || checked === "true";
    console.log("allowDownload clicked:", isChecked); // Debug log
    handleFormChange({ allowDownload: isChecked });
  };

  const handleRequirePasswordChange = (checked: boolean | string) => {
    const isChecked = checked === true || checked === "true";
    console.log("requirePassword clicked:", isChecked); // Debug log
    handleFormChange({
      requirePassword: isChecked,
      // Clear password when unchecking
      password: isChecked ? formState.password : ""
    });
  };

  const isFormValid = !formState.requirePassword || formState.password.trim();

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-600" />
            Share {file?.fileType || "File"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Info */}
           <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Link className="h-4 w-4" />
            <div className="truncate">
              <div className="font-medium">{file.fileName.length > 30 ? file.fileName.slice(0, 30) + '…' : file.fileName}</div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.fileSize)} • {file.fileType || "Unknown"}
              </div>
            </div>
          </div>

          {/* Access Level */}
        <div className="hidden">
            <Label className="text-sm font-medium">Access</Label>
            <Select
              value={formState.linkType}
              onValueChange={(value) => handleFormChange({ linkType: value as "VIEW" | "EDIT" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View Only</SelectItem>
                <SelectItem value="EDIT">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiration */}
          <div>
            <Label className="text-sm font-medium">Expires</Label>
            <Select
              value={formState.expiryDays}
              onValueChange={(value) => handleFormChange({ expiryDays: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">1 Week</SelectItem>
                <SelectItem value="30">1 Month</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Options */}
           <div className="space-y-3 hidden">
            {/* Allow Downloads Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowDownload"
                checked={formState.allowDownload}
                onCheckedChange={handleAllowDownloadChange}
              />
              <Label
                htmlFor="allowDownload"
                className="text-sm font-medium cursor-pointer"
              >
                Allow Downloads
              </Label>
            </div>

            {formState.allowDownload && (
              <div className="pl-6">
                <Input
                  type="number"
                  value={formState.maxDownloads}
                  onChange={(e) => handleFormChange({ maxDownloads: e.target.value })}
                  placeholder="Max Downloads (optional)"
                  min="1"
                />
              </div>
            )}

            {/* Require Password Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePassword"
                checked={formState.requirePassword}
                onCheckedChange={handleRequirePasswordChange}
              />
              <Label
                htmlFor="requirePassword"
                className="text-sm font-medium cursor-pointer"
              >
                Require Password
              </Label>
            </div>

            {formState.requirePassword && (
              <div className="pl-6 space-y-2">
                <Input
                  type="password"
                  value={formState.password}
                  onChange={(e) => handleFormChange({ password: e.target.value })}
                  placeholder="Enter password"
                  className={cn(
                    formState.requirePassword &&
                    !formState.password.trim() &&
                    "border-red-500 focus:border-red-500"
                  )}
                />
                {formState.requirePassword && !formState.password.trim() && (
                  <p className="text-xs text-red-600">Password is required</p>
                )}
              </div>
            )}
          </div>

          {/* Generated Link */}
          {generatedLink && (
            <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Link Generated</span>
              </div>
              <div className="relative">
                <Input value={generatedLink} readOnly className="pr-20" />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            {generatedLink ? "Done" : "Cancel"}
          </Button>
          {!generatedLink && (
            <Button onClick={handleGenerateLink} disabled={isGenerating || !isFormValid}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyLinkDialog;