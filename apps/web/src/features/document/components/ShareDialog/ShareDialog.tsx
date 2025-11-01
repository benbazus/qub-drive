/* eslint-disable no-console */
// components/ShareDialog/ShareDialog.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Mail,
  Users,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import {  CollaborationRole, LinkAccess } from "../types";
import {
  useInviteUser,
  useChangePermission,
  useRemoveCollaborator,
  useUpdateLinkAccess,
  useGetCollaborators,
  useGetLinkAccess,
} from "../../hooks/useSharing";

interface ShareDialogProps {
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  documentId: string;
  currentUserId: string;
  documentTitle: string;
}

interface InvitationStatus {
  message: string;
  type: "success" | "error" | "";
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  showShareDialog,
  setShowShareDialog,
  documentId,
  currentUserId,
  documentTitle,
}) => {
  const [shareEmail, setShareEmail] = useState<string>("");
  const [shareRole, setShareRole] = useState<CollaborationRole>("editor");
  const [shareLink] = useState<string>(
    `${window.location.origin}/?docId=${documentId}`
  );
  const [linkAccess, setLinkAccess] = useState<LinkAccess>("RESTRICTED");
  const [inviteStatus, setInviteStatus] = useState<InvitationStatus>({
    message: "",
    type: "",
  });
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Mutations and queries
  const inviteUserMutation = useInviteUser();
  const changePermissionMutation = useChangePermission();
  const removeCollaboratorMutation = useRemoveCollaborator();
  const updateLinkAccessMutation = useUpdateLinkAccess();
  const { data: collaborators = [], isLoading: collaboratorsLoading } =
    useGetCollaborators(documentId);
  const { data: linkAccessData } = useGetLinkAccess(documentId);

  const closeDialog = useCallback((): void => {
    setShowShareDialog(false);
    // Reset form state when closing
    setShareEmail("");
    setInviteStatus({ message: "", type: "" });
    setCopySuccess(false);
  }, [setShowShareDialog]);

  const handleEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setShareEmail(event.target.value);
      // Clear any previous error messages when user starts typing
      if (inviteStatus.type === "error") {
        setInviteStatus({ message: "", type: "" });
      }
    },
    [inviteStatus.type]
  );

  const handleRoleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setShareRole(event.target.value as CollaborationRole);
    },
    []
  );

  // Update link access when data is loaded
  useEffect(() => {
    if (linkAccessData) {
      setLinkAccess(linkAccessData.linkAccess);
    }
  }, [linkAccessData]);

  const handleLinkAccessChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const newLinkAccess = event.target.value as LinkAccess;
      setLinkAccess(newLinkAccess);

      // Update link access on server
      updateLinkAccessMutation.mutate({
        documentId,
        data: { linkAccess: newLinkAccess },
      });
    },
    [documentId, updateLinkAccessMutation]
  );

  const handleSendInvite = useCallback((): void => {
    // Validate email input
    if (!shareEmail.trim()) {
      setInviteStatus({
        message: "Please enter an email address",
        type: "error",
      });
      setTimeout(() => setInviteStatus({ message: "", type: "" }), 3000);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail.trim())) {
      setInviteStatus({
        message: "Please enter a valid email address",
        type: "error",
      });
      setTimeout(() => setInviteStatus({ message: "", type: "" }), 3000);
      return;
    }

    // Check if user is already a collaborator
    const isAlreadyCollaborator = collaborators.some(
      (user: { email?: string }) =>
        user.email?.toLowerCase() === shareEmail.trim().toLowerCase()
    );

    if (isAlreadyCollaborator) {
      setInviteStatus({
        message: "This user is already a collaborator",
        type: "error",
      });
      setTimeout(() => setInviteStatus({ message: "", type: "" }), 3000);
      return;
    }

    setInviteStatus({ message: "Sending invitation...", type: "success" });

    // Send invitation using mutation
    inviteUserMutation.mutate(
      {
        documentId,
        data: {
          email: shareEmail.trim(),
          role: shareRole,
        },
      },
      {
        onSuccess: () => {
          setInviteStatus({
            message: "Invitation sent successfully!",
            type: "success",
          });
          setShareEmail("");
          setTimeout(() => setInviteStatus({ message: "", type: "" }), 3000);
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to send invitation";
          setInviteStatus({
            message: errorMessage,
            type: "error",
          });
          setTimeout(() => setInviteStatus({ message: "", type: "" }), 3000);
        },
      }
    );
  }, [shareEmail, shareRole, documentId, collaborators, inviteUserMutation]);

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);

      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          console.error("Fallback copy failed");
        }

        document.body.removeChild(textArea);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        // Could show a toast notification here
      }
    }
  }, [shareLink]);

  const handleChangeAccess = useCallback(
    (userId: string, newRole: CollaborationRole): void => {
      changePermissionMutation.mutate({
        documentId,
        userId,
        data: { permission: newRole },
      });
    },
    [documentId, changePermissionMutation]
  );

  const handleRemoveCollaborator = useCallback(
    (userId: string): void => {
      if (confirm("Are you sure you want to remove this collaborator?")) {
        removeCollaboratorMutation.mutate({
          documentId,
          userId,
        });
      }
    },
    [documentId, removeCollaboratorMutation]
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (event.target === event.currentTarget) {
        closeDialog();
      }
    },
    [closeDialog]
  );

  const getStatusMessage = () => {
    if (!inviteStatus.message) return null;

    return (
      <p
        className={`text-sm mt-2 ${
          inviteStatus.type === "success" ? "text-green-600" : "text-red-600"
        }`}
      >
        {inviteStatus.message}
      </p>
    );
  };

  const getRoleOptions = (): CollaborationRole[] => {
    return ["viewer", "commenter", "editor"];
  };

  const getLinkAccessOptions = (): { value: LinkAccess; label: string }[] => {
    return [
      { value: "RESTRICTED", label: "Restricted" },
      { value: "ANYONE_WITH_LINK", label: "Anyone with the link" },
      { value: "PUBLIC", label: "Public on the web" },
    ];
  };

  const formatRoleLabel = (role: CollaborationRole): string => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "typing":
        return "bg-blue-500";
      case "viewing":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case "active":
        return "active";
      case "typing":
        return "typing...";
      case "viewing":
        return "viewing";
      case "offline":
        return "offline";
      default:
        return "online";
    }
  };

  const canChangePermissions = (user: {
    id: string;
    role: string;
  }): boolean => {
    return user.role !== "owner" && user.id !== currentUserId;
  };

  const isCurrentUserOwner = (): boolean => {
    return collaborators.some(
      (user: { id: string; role: string }) =>
        user.id === currentUserId && user.role === "owner"
    );
  };

  if (!showShareDialog) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2
                id="share-dialog-title"
                className="text-xl font-semibold text-gray-900"
              >
                Share Document
              </h2>
              <p className="text-sm text-gray-600 truncate max-w-xs">
                "{documentTitle}"
              </p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            aria-label="Close dialog"
          >
            <X size={20} className="text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-96 bg-gradient-to-b from-gray-50/30 to-white">
          {/* Add People */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label
              htmlFor="share-email"
              className="block text-sm font-semibold text-gray-900 mb-3"
            >
              Invite people to collaborate
            </label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  id="share-email"
                  type="email"
                  placeholder="Enter email address"
                  value={shareEmail}
                  onChange={handleEmailChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-all duration-200"
                  aria-describedby="email-error"
                />
              </div>
              <select
                value={shareRole}
                onChange={handleRoleChange}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 focus:bg-white transition-all duration-200 min-w-[120px]"
                aria-label="Permission level for invited user"
              >
                {getRoleOptions().map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSendInvite}
                disabled={!shareEmail.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-sm hover:shadow-md disabled:shadow-none"
                aria-label="Send invitation"
                title="Send invitation"
              >
                <Mail size={16} />
                <span>Send</span>
              </button>
            </div>
            {getStatusMessage()}
          </div>

          {/* Share Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="link-access"
                className="block text-sm font-medium text-gray-700"
              >
                Share link
              </label>
              <select
                id="link-access"
                value={linkAccess}
                onChange={handleLinkAccessChange}
                className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Link access level"
              >
                {getLinkAccessOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm focus:outline-none"
                aria-label="Document share link"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  copySuccess
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                aria-label={copySuccess ? "Link copied" : "Copy link"}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                <span className="text-sm">
                  {copySuccess ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Current Collaborators */}
          {collaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                <Users size={16} />
                <span>People with access ({collaborators.length})</span>
              </h3>
              <div className="space-y-3">
                {collaboratorsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">
                      Loading collaborators...
                    </p>
                  </div>
                ) : (
                  collaborators.map(
                    (
                      user: {
                        id: string;
                        name: string;
                        email: string;
                        role: string;
                        avatar: string;
                        status: string;
                      },
                      index: number
                    ) => (
                      <div
                        key={user.id || index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {user.name}
                              {user.id === currentUserId && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (You)
                                </span>
                              )}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-500">
                                {user.email || "email@example.com"}
                              </p>
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`}
                              />
                              <span className="text-xs text-gray-500">
                                {getStatusLabel(user.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role || "editor"}
                            onChange={(e) =>
                              handleChangeAccess(
                                user.id,
                                e.target.value as CollaborationRole
                              )
                            }
                            className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={
                              !canChangePermissions(user) ||
                              !isCurrentUserOwner()
                            }
                            aria-label={`Change permissions for ${user.name}`}
                          >
                            <option value="owner">Owner</option>
                            <option value="editor">Editor</option>
                            <option value="commenter">Commenter</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {canChangePermissions(user) &&
                            isCurrentUserOwner() && (
                              <button
                                onClick={() =>
                                  handleRemoveCollaborator(user.id)
                                }
                                className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={`Remove ${user.name} from document`}
                                title="Remove collaborator"
                              >
                                <MoreHorizontal
                                  size={16}
                                  className="text-gray-400"
                                />
                              </button>
                            )}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}

          {/* Empty state when no collaborators */}
          {collaborators.length === 0 && !collaboratorsLoading && (
            <div className="text-center py-6">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No collaborators yet</p>
              <p className="text-gray-400 text-xs">
                Invite people to start collaborating
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Share settings will be saved automatically</span>
          </div>
          <button
            onClick={closeDialog}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
