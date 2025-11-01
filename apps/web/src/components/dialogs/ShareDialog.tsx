
/* eslint-disable no-console */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { File, Loader2, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileItem } from '@/types/file';
import fileEndpoint from '@/api/endpoints/file.endpoint';
import { useCreateShareMutation } from '@/hooks/useShare';


// Custom hook for current user
function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => fileEndpoint.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
}


interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '0', label: 'Never' },
];



const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, file }) => {
  const [requirePassword, setRequirePassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [email, setEmail] = useState('');
  const [shareState, setShareState] = useState({
    expiryDays: 7,
    message: ''
  });
  const successHandledRef = useRef(false);

  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setShareState({ expiryDays: 7, message: '' });
      setRequirePassword(false);
      setPasswordInput('');
      successHandledRef.current = false;
    } else {
      successHandledRef.current = false;
    }
  }, [isOpen]);

  // Email validation helper
  const isValidEmail = (emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  // At the top of your component, initialize the mutation with callbacks
  const createShareMutation = useCreateShareMutation(
    () => {
      // onSuccess callback
      toast.success(`Email sent to ${email.trim().toLowerCase()}`);

      // Close dialog after short delay
      setTimeout(() => {
        onClose();
      }, 100);
    },
    (error) => {
      // onError callback
      console.error('Failed to create invitation:', error);
      toast.error(error?.message || 'Failed to send invitation. Please try again.');
    }
  );

  const isSharing = createShareMutation.isPending;


  // Then update your handleShare function
  const handleShare = useCallback(async () => {
    if (!file?.id) {
      toast.error('No file selected');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email
    if (!trimmedEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if user is sharing with themselves
    if (currentUser && trimmedEmail === currentUser.email.toLowerCase()) {
      toast.error('You cannot share with yourself');
      return;
    }

    // No try-catch needed - errors are handled in the mutation's onError callback
    createShareMutation.mutate({
      recipientEmail: trimmedEmail,
      fileId: file.id,
      message: shareState.message.trim() || undefined,
      expirationDays: shareState.expiryDays.toString(),
      password: requirePassword ? passwordInput.trim() : undefined,
    });

  }, [file?.id, email, currentUser, createShareMutation, shareState.message, shareState.expiryDays, requirePassword, passwordInput]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base flex items-center gap-2">
            <File className="h-4 w-4 text-blue-600" />
            Share "{file?.fileName ?? 'Untitled'}"
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send invitation to access this file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <Label className="text-sm">Email Address</Label>
            <Input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>

          {/* Permission and Expiry - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Password Protection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Lock className="h-4 w-4" />
                Security
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-password"
                    checked={requirePassword}
                    onCheckedChange={(checked: boolean) => {
                      setRequirePassword(checked);
                      if (!checked) setPasswordInput('');
                    }}
                  />
                  <Label htmlFor="require-password" className="text-sm">Require password</Label>
                </div>
                {requirePassword && (
                  <Input
                    type="password"
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="h-9"
                  />
                )}
              </div>
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <Label className="text-sm">Expires</Label>
              <Select
                value={shareState.expiryDays.toString()}
                onValueChange={(value) =>
                  setShareState(prev => ({ ...prev, expiryDays: parseInt(value) }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-sm">Message (optional)</Label>
            <Textarea
              placeholder="Add a message..."
              value={shareState.message}
              onChange={(e) => setShareState(prev => ({ ...prev, message: e.target.value }))}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSharing}
            className="flex-1 h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || !email.trim()}
            className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;