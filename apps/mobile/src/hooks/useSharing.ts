import { useState, useCallback } from "react";
import { Alert, Share as NativeShare } from "react-native";
import { FileItem } from "@/types/file";
import { FileShare, ShareInvitation } from "@/types/sharing";
import { sharingService } from "@/services/sharingService";

export interface SharingOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onUpdate?: () => void;
}

export interface UseSharingReturn {
  // State
  isLoading: boolean;
  currentShare: FileShare | null;

  // Actions
  shareFile: (
    file: FileItem,
    emails: string[],
    role?: "viewer" | "editor"
  ) => Promise<void>;
  createSharingLink: (
    file: FileItem,
    accessLevel?: "view" | "edit"
  ) => Promise<string>;
  shareViaLink: (file: FileItem) => Promise<void>;
  quickShare: (file: FileItem) => Promise<void>;
  getFileSharing: (fileId: string) => Promise<FileShare | null>;
  revokeSharing: (shareId: string) => Promise<void>;
  updatePermission: (
    shareId: string,
    userId: string,
    role: "viewer" | "editor" | "owner"
  ) => Promise<void>;
  removeUser: (shareId: string, userId: string) => Promise<void>;

  // Bulk operations
  bulkShare: (
    files: FileItem[],
    emails: string[],
    role?: "viewer" | "editor"
  ) => Promise<void>;

  // Utilities
  validateEmails: (emails: string[]) => Promise<
    {
      email: string;
      isValid: boolean;
      isRegistered: boolean;
      userId?: string;
      name?: string;
    }[]
  >;
  searchUsers: (query: string) => Promise<
    {
      id: string;
      email: string;
      name?: string;
      avatar?: string;
    }[]
  >;
}

export const useSharing = (options: SharingOptions = {}): UseSharingReturn => {
  const { onSuccess, onError, onUpdate } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [currentShare, setCurrentShare] = useState<FileShare | null>(null);

  // Helper to wrap actions with loading state
  const withLoading = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        const result = await action();
        onUpdate?.();
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        onError?.(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onUpdate]
  );

  // Share file with users
  const shareFile = useCallback(
    async (
      file: FileItem,
      emails: string[],
      role: "viewer" | "editor" = "viewer"
    ) => {
      await withLoading(async () => {
        const invitations: ShareInvitation[] = emails.map((email) => ({
          email,
          role,
        }));

        const share = await sharingService.shareWithUsers(file.id, invitations);
        setCurrentShare(share);
        onSuccess?.(`Shared "${file.name}" with ${emails.length} user(s)`);
      });
    },
    [withLoading, onSuccess]
  );

  // Create sharing link
  const createSharingLink = useCallback(
    async (
      file: FileItem,
      accessLevel: "view" | "edit" = "view"
    ): Promise<string> => {
      return withLoading(async () => {
        const url = await sharingService.createSharingLink(file.id, {
          accessLevel,
        });
        onSuccess?.(`Sharing link created for "${file.name}"`);
        return url;
      });
    },
    [withLoading, onSuccess]
  );

  // Share via native share with link
  const shareViaLink = useCallback(
    async (file: FileItem) => {
      await withLoading(async () => {
        try {
          // First create or get sharing link
          let shareUrl: string;
          try {
            const existingShare = await sharingService.getFileSharing(file.id);
            if (existingShare.shareLink?.isActive) {
              shareUrl = existingShare.shareLink.url;
            } else {
              shareUrl = await sharingService.createSharingLink(file.id, {
                accessLevel: "view",
              });
            }
          } catch {
            // No existing share, create new one
            shareUrl = await sharingService.createSharingLink(file.id, {
              accessLevel: "view",
            });
          }

          // Use native share
          await NativeShare.share({
            message: `Check out this ${file.type}: ${file.name}`,
            url: shareUrl,
            title: `Share ${file.name}`,
          });

          onSuccess?.(`Shared "${file.name}" via link`);
        } catch (err) {
          if (err instanceof Error && err.message !== "User cancelled") {
            throw err;
          }
        }
      });
    },
    [withLoading, onSuccess]
  );

  // Quick share - show native share options
  const quickShare = useCallback(
    async (file: FileItem) => {
      Alert.alert("Share File", `How would you like to share "${file.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share Link",
          onPress: () => shareViaLink(file),
        },
        {
          text: "Invite People",
          onPress: () => {
            // This would typically open the ShareDialog
            // For now, we'll show an alert
            Alert.alert(
              "Invite People",
              "This would open the share dialog to invite specific users.",
              [{ text: "OK" }]
            );
          },
        },
      ]);
    },
    [shareViaLink]
  );

  // Get file sharing information
  const getFileSharing = useCallback(
    async (fileId: string): Promise<FileShare | null> => {
      return withLoading(async () => {
        try {
          const share = await sharingService.getFileSharing(fileId);
          setCurrentShare(share);
          return share;
        } catch (error) {
          // File might not be shared
          return null;
        }
      });
    },
    [withLoading]
  );

  // Revoke sharing
  const revokeSharing = useCallback(
    async (shareId: string) => {
      await withLoading(async () => {
        await sharingService.deleteShare(shareId);
        setCurrentShare(null);
        onSuccess?.("Sharing revoked successfully");
      });
    },
    [withLoading, onSuccess]
  );

  // Update user permission
  const updatePermission = useCallback(
    async (
      shareId: string,
      userId: string,
      role: "viewer" | "editor" | "owner"
    ) => {
      await withLoading(async () => {
        await sharingService.updateUserPermission(shareId, userId, role);

        // Update current share if it matches
        if (currentShare && currentShare.id === shareId) {
          const updatedPermissions = currentShare.permissions.map(
            (permission) =>
              permission.userId === userId
                ? { ...permission, role }
                : permission
          );
          setCurrentShare({ ...currentShare, permissions: updatedPermissions });
        }

        onSuccess?.("Permission updated successfully");
      });
    },
    [withLoading, currentShare, onSuccess]
  );

  // Remove user from share
  const removeUser = useCallback(
    async (shareId: string, userId: string) => {
      await withLoading(async () => {
        await sharingService.removeUserFromShare(shareId, userId);

        // Update current share if it matches
        if (currentShare && currentShare.id === shareId) {
          const updatedPermissions = currentShare.permissions.filter(
            (permission) => permission.userId !== userId
          );
          setCurrentShare({ ...currentShare, permissions: updatedPermissions });
        }

        onSuccess?.("User removed from share");
      });
    },
    [withLoading, currentShare, onSuccess]
  );

  // Bulk share multiple files
  const bulkShare = useCallback(
    async (
      files: FileItem[],
      emails: string[],
      role: "viewer" | "editor" = "viewer"
    ) => {
      await withLoading(async () => {
        const invitations: ShareInvitation[] = emails.map((email) => ({
          email,
          role,
        }));

        const fileIds = files.map((file) => file.id);
        await sharingService.bulkShare(fileIds, invitations);

        onSuccess?.(
          `Shared ${files.length} files with ${emails.length} user(s)`
        );
      });
    },
    [withLoading, onSuccess]
  );

  // Validate email addresses
  const validateEmails = useCallback(
    async (emails: string[]) => {
      return withLoading(async () => {
        return sharingService.validateEmails(emails);
      });
    },
    [withLoading]
  );

  // Search users
  const searchUsers = useCallback(
    async (query: string) => {
      return withLoading(async () => {
        return sharingService.searchUsers(query);
      });
    },
    [withLoading]
  );

  return {
    // State
    isLoading,
    currentShare,

    // Actions
    shareFile,
    createSharingLink,
    shareViaLink,
    quickShare,
    getFileSharing,
    revokeSharing,
    updatePermission,
    removeUser,

    // Bulk operations
    bulkShare,

    // Utilities
    validateEmails,
    searchUsers,
  };
};
