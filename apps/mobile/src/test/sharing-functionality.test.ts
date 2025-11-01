import { sharingService } from '@/services/sharingService';
import { sharingApi } from '@/services/api/sharingApi';
import { 
  FileShare, 
  CreateShareRequest, 
  ShareInvitation, 
  ShareLinkRequest,
  SharePermission 
} from '@/types/sharing';

// Mock the API client
jest.mock('@/services/api/sharingApi');

const mockSharingApi = sharingApi as jest.Mocked<typeof sharingApi>;

describe('Sharing Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Link Generation and Access', () => {
    const mockFileId = 'file-123';
    const mockShareUrl = 'https://app.qubdrive.com/share/abc123';
    const mockToken = 'abc123';

    it('should create a sharing link with view access', async () => {
      const linkRequest: ShareLinkRequest = {
        accessLevel: 'view'
      };

      mockSharingApi.createSharingLink.mockResolvedValue(mockShareUrl);

      const result = await sharingService.createSharingLink(mockFileId, linkRequest);

      expect(mockSharingApi.createSharingLink).toHaveBeenCalledWith(mockFileId, linkRequest);
      expect(result).toBe(mockShareUrl);
    });

    it('should create a sharing link with edit access', async () => {
      const linkRequest: ShareLinkRequest = {
        accessLevel: 'edit'
      };

      mockSharingApi.createSharingLink.mockResolvedValue(mockShareUrl);

      const result = await sharingService.createSharingLink(mockFileId, linkRequest);

      expect(mockSharingApi.createSharingLink).toHaveBeenCalledWith(mockFileId, linkRequest);
      expect(result).toBe(mockShareUrl);
    });

    it('should create a secure link with password and expiration', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const result = await sharingService.createSecureLink(
        mockFileId,
        'password123',
        7,
        'view'
      );

      expect(mockSharingApi.createSharingLink).toHaveBeenCalledWith(mockFileId, {
        accessLevel: 'view',
        password: 'password123',
        expiresAt: expiresAt.toISOString(),
      });
    });

    it('should update sharing link settings', async () => {
      const updateSettings = {
        accessLevel: 'edit' as const,
        password: 'newpassword'
      };

      mockSharingApi.updateSharingLink.mockResolvedValue(mockShareUrl);

      const result = await sharingService.updateSharingLink(mockFileId, updateSettings);

      expect(mockSharingApi.updateSharingLink).toHaveBeenCalledWith(mockFileId, updateSettings);
      expect(result).toBe(mockShareUrl);
    });

    it('should revoke sharing link', async () => {
      mockSharingApi.revokeSharingLink.mockResolvedValue();

      await sharingService.revokeSharingLink(mockFileId);

      expect(mockSharingApi.revokeSharingLink).toHaveBeenCalledWith(mockFileId);
    });

    it('should get share by token for public access', async () => {
      const mockShare: FileShare = {
        id: 'share-123',
        fileId: mockFileId,
        fileName: 'test-file.pdf',
        fileType: 'file',
        ownerId: 'owner-123',
        ownerEmail: 'owner@example.com',
        ownerName: 'John Doe',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        shareLink: {
          id: 'link-123',
          token: mockToken,
          url: mockShareUrl,
          accessLevel: 'view',
          isActive: true,
          hasPassword: false,
          downloadCount: 0,
          createdAt: '2023-01-01T00:00:00Z'
        },
        permissions: []
      };

      mockSharingApi.getShareByToken.mockResolvedValue(mockShare);

      const result = await sharingService.getShareByToken(mockToken);

      expect(mockSharingApi.getShareByToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockShare);
    });

    it('should access shared file by token', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      mockSharingApi.accessSharedFile.mockResolvedValue(mockBlob);

      const result = await sharingService.accessSharedFile(mockToken);

      expect(mockSharingApi.accessSharedFile).toHaveBeenCalledWith(mockToken, undefined);
      expect(result).toBe(mockBlob);
    });

    it('should access password-protected shared file', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const password = 'password123';

      mockSharingApi.accessSharedFile.mockResolvedValue(mockBlob);

      const result = await sharingService.accessSharedFile(mockToken, password);

      expect(mockSharingApi.accessSharedFile).toHaveBeenCalledWith(mockToken, password);
      expect(result).toBe(mockBlob);
    });

    it('should handle link generation errors with retry', async () => {
      const linkRequest: ShareLinkRequest = {
        accessLevel: 'view'
      };

      // Mock first call to fail, second to succeed
      mockSharingApi.createSharingLink
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockShareUrl);

      const result = await sharingService.createSharingLink(mockFileId, linkRequest);

      expect(mockSharingApi.createSharingLink).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockShareUrl);
    });
  });

  describe('Permission Settings', () => {
    const mockFileId = 'file-123';
    const mockShareId = 'share-123';
    const mockUserId = 'user-456';

    const mockFileShare: FileShare = {
      id: mockShareId,
      fileId: mockFileId,
      fileName: 'test-document.pdf',
      fileType: 'file',
      ownerId: 'owner-123',
      ownerEmail: 'owner@example.com',
      ownerName: 'John Doe',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      permissions: [
        {
          id: 'perm-1',
          userId: mockUserId,
          email: 'user@example.com',
          name: 'Jane Smith',
          role: 'viewer',
          grantedAt: '2023-01-01T00:00:00Z',
          grantedBy: 'owner-123'
        }
      ]
    };

    it('should create share with viewer permissions', async () => {
      const shareRequest: CreateShareRequest = {
        fileId: mockFileId,
        userEmails: ['user@example.com'],
        role: 'viewer'
      };

      mockSharingApi.createShare.mockResolvedValue(mockFileShare);

      const result = await sharingService.createShare(shareRequest);

      expect(mockSharingApi.createShare).toHaveBeenCalledWith(shareRequest);
      expect(result).toEqual(mockFileShare);
      expect(result.permissions[0].role).toBe('viewer');
    });

    it('should create share with editor permissions', async () => {
      const editorShare = {
        ...mockFileShare,
        permissions: [{
          ...mockFileShare.permissions[0],
          role: 'editor' as const
        }]
      };

      const shareRequest: CreateShareRequest = {
        fileId: mockFileId,
        userEmails: ['user@example.com'],
        role: 'editor'
      };

      mockSharingApi.createShare.mockResolvedValue(editorShare);

      const result = await sharingService.createShare(shareRequest);

      expect(result.permissions[0].role).toBe('editor');
    });

    it('should update user permission from viewer to editor', async () => {
      mockSharingApi.updateUserPermission.mockResolvedValue();

      await sharingService.updateUserPermission(mockShareId, mockUserId, 'editor');

      expect(mockSharingApi.updateUserPermission).toHaveBeenCalledWith(
        mockShareId,
        mockUserId,
        'editor'
      );
    });

    it('should update user permission from editor to owner', async () => {
      mockSharingApi.updateUserPermission.mockResolvedValue();

      await sharingService.updateUserPermission(mockShareId, mockUserId, 'owner');

      expect(mockSharingApi.updateUserPermission).toHaveBeenCalledWith(
        mockShareId,
        mockUserId,
        'owner'
      );
    });

    it('should remove user from share', async () => {
      mockSharingApi.removeUserFromShare.mockResolvedValue();

      await sharingService.removeUserFromShare(mockShareId, mockUserId);

      expect(mockSharingApi.removeUserFromShare).toHaveBeenCalledWith(mockShareId, mockUserId);
    });

    it('should share file with multiple users with different roles', async () => {
      const invitations: ShareInvitation[] = [
        { email: 'viewer@example.com', role: 'viewer' },
        { email: 'editor@example.com', role: 'editor' }
      ];

      const multiUserShare: FileShare = {
        ...mockFileShare,
        permissions: [
          {
            id: 'perm-1',
            userId: 'user-1',
            email: 'viewer@example.com',
            role: 'viewer',
            grantedAt: '2023-01-01T00:00:00Z',
            grantedBy: 'owner-123'
          },
          {
            id: 'perm-2',
            userId: 'user-2',
            email: 'editor@example.com',
            role: 'editor',
            grantedAt: '2023-01-01T00:00:00Z',
            grantedBy: 'owner-123'
          }
        ]
      };

      mockSharingApi.shareWithUsers.mockResolvedValue(multiUserShare);

      const result = await sharingService.shareWithUsers(mockFileId, invitations);

      expect(mockSharingApi.shareWithUsers).toHaveBeenCalledWith(mockFileId, invitations);
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0].role).toBe('viewer');
      expect(result.permissions[1].role).toBe('editor');
    });

    it('should validate email addresses for sharing', async () => {
      const emails = ['valid@example.com', 'invalid-email', 'registered@example.com'];
      const validationResult = [
        {
          email: 'valid@example.com',
          isValid: true,
          isRegistered: false
        },
        {
          email: 'invalid-email',
          isValid: false,
          isRegistered: false
        },
        {
          email: 'registered@example.com',
          isValid: true,
          isRegistered: true,
          userId: 'user-789',
          name: 'Registered User'
        }
      ];

      mockSharingApi.validateEmails.mockResolvedValue(validationResult);

      const result = await sharingService.validateEmails(emails);

      expect(mockSharingApi.validateEmails).toHaveBeenCalledWith(emails);
      expect(result).toEqual(validationResult);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
      expect(result[2].isRegistered).toBe(true);
    });

    it('should get file sharing information with permissions', async () => {
      mockSharingApi.getFileSharing.mockResolvedValue(mockFileShare);

      const result = await sharingService.getFileSharing(mockFileId);

      expect(mockSharingApi.getFileSharing).toHaveBeenCalledWith(mockFileId);
      expect(result).toEqual(mockFileShare);
      expect(result.permissions).toBeDefined();
      expect(result.permissions[0].role).toBe('viewer');
    });
  });

  describe('Collaboration Scenarios', () => {
    const mockFileId = 'file-123';
    const mockShareId = 'share-123';

    it('should handle share invitation acceptance', async () => {
      mockSharingApi.acceptShare.mockResolvedValue();

      await sharingService.acceptShare(mockShareId);

      expect(mockSharingApi.acceptShare).toHaveBeenCalledWith(mockShareId);
    });

    it('should handle share invitation decline', async () => {
      mockSharingApi.declineShare.mockResolvedValue();

      await sharingService.declineShare(mockShareId);

      expect(mockSharingApi.declineShare).toHaveBeenCalledWith(mockShareId);
    });

    it('should get files shared with current user', async () => {
      const sharedFiles: FileShare[] = [
        {
          id: 'share-1',
          fileId: 'file-1',
          fileName: 'Shared Document 1.pdf',
          fileType: 'file',
          ownerId: 'owner-1',
          ownerEmail: 'owner1@example.com',
          ownerName: 'Owner One',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          permissions: []
        },
        {
          id: 'share-2',
          fileId: 'file-2',
          fileName: 'Shared Document 2.pdf',
          fileType: 'file',
          ownerId: 'owner-2',
          ownerEmail: 'owner2@example.com',
          ownerName: 'Owner Two',
          isActive: true,
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          permissions: []
        }
      ];

      mockSharingApi.getSharedWithMe.mockResolvedValue(sharedFiles);

      const result = await sharingService.getSharedWithMe(10, 0);

      expect(mockSharingApi.getSharedWithMe).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(sharedFiles);
      expect(result).toHaveLength(2);
    });

    it('should get files shared by current user', async () => {
      const sharedByMe: FileShare[] = [
        {
          id: 'share-3',
          fileId: 'file-3',
          fileName: 'My Shared Document.pdf',
          fileType: 'file',
          ownerId: 'current-user',
          ownerEmail: 'current@example.com',
          ownerName: 'Current User',
          isActive: true,
          createdAt: '2023-01-03T00:00:00Z',
          updatedAt: '2023-01-03T00:00:00Z',
          permissions: [
            {
              id: 'perm-1',
              userId: 'collaborator-1',
              email: 'collab1@example.com',
              role: 'editor',
              grantedAt: '2023-01-03T00:00:00Z',
              grantedBy: 'current-user'
            }
          ]
        }
      ];

      mockSharingApi.getSharedByMe.mockResolvedValue(sharedByMe);

      const result = await sharingService.getSharedByMe(10, 0);

      expect(mockSharingApi.getSharedByMe).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(sharedByMe);
      expect(result[0].permissions).toHaveLength(1);
    });

    it('should search users for collaboration', async () => {
      const searchResults = [
        {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          avatar: 'https://example.com/avatar1.jpg'
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          avatar: 'https://example.com/avatar2.jpg'
        }
      ];

      mockSharingApi.searchUsers.mockResolvedValue(searchResults);

      const result = await sharingService.searchUsers('john', 10);

      expect(mockSharingApi.searchUsers).toHaveBeenCalledWith('john', 10);
      expect(result).toEqual(searchResults);
      expect(result).toHaveLength(2);
    });

    it('should handle bulk sharing for collaboration', async () => {
      const fileIds = ['file-1', 'file-2', 'file-3'];
      const invitations: ShareInvitation[] = [
        { email: 'team@example.com', role: 'editor' }
      ];

      const mockShares: FileShare[] = fileIds.map((fileId, index) => ({
        id: `share-${index + 1}`,
        fileId,
        fileName: `File ${index + 1}.pdf`,
        fileType: 'file',
        ownerId: 'current-user',
        ownerEmail: 'current@example.com',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        permissions: []
      }));

      // Mock individual shareWithUsers calls
      mockSharingApi.shareWithUsers.mockImplementation((fileId) => {
        const index = fileIds.indexOf(fileId);
        return Promise.resolve(mockShares[index]);
      });

      const result = await sharingService.bulkShare(fileIds, invitations);

      expect(mockSharingApi.shareWithUsers).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should copy sharing settings between files', async () => {
      const sourceFileId = 'source-file';
      const targetFileId = 'target-file';

      const sourceShare: FileShare = {
        id: 'source-share',
        fileId: sourceFileId,
        fileName: 'Source File.pdf',
        fileType: 'file',
        ownerId: 'owner',
        ownerEmail: 'owner@example.com',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        shareLink: {
          id: 'link-1',
          token: 'token123',
          url: 'https://example.com/share/token123',
          accessLevel: 'edit',
          isActive: true,
          hasPassword: false,
          downloadCount: 0,
          createdAt: '2023-01-01T00:00:00Z'
        },
        permissions: [
          {
            id: 'perm-1',
            userId: 'user-1',
            email: 'user1@example.com',
            role: 'editor',
            grantedAt: '2023-01-01T00:00:00Z',
            grantedBy: 'owner'
          }
        ]
      };

      const targetShare: FileShare = {
        ...sourceShare,
        id: 'target-share',
        fileId: targetFileId,
        fileName: 'Target File.pdf'
      };

      mockSharingApi.getFileSharing.mockResolvedValue(sourceShare);
      mockSharingApi.createShare.mockResolvedValue(targetShare);

      const result = await sharingService.copyShareSettings(sourceFileId, targetFileId);

      expect(mockSharingApi.getFileSharing).toHaveBeenCalledWith(sourceFileId);
      expect(mockSharingApi.createShare).toHaveBeenCalledWith({
        fileId: targetFileId,
        userEmails: ['user1@example.com'],
        role: 'viewer',
        createLink: true,
        linkSettings: {
          accessLevel: 'edit'
        }
      });
      expect(result).toEqual(targetShare);
    });

    it('should handle real-time collaboration notifications', async () => {
      const notifications = [
        {
          id: 'notif-1',
          type: 'share_received' as const,
          fileId: 'file-1',
          fileName: 'Collaborative Document.pdf',
          fromUserId: 'user-1',
          fromUserEmail: 'user1@example.com',
          fromUserName: 'John Doe',
          message: 'John Doe shared a document with you',
          timestamp: '2023-01-01T00:00:00Z',
          isRead: false
        },
        {
          id: 'notif-2',
          type: 'permission_changed' as const,
          fileId: 'file-2',
          fileName: 'Project Plan.pdf',
          fromUserId: 'user-2',
          fromUserEmail: 'user2@example.com',
          fromUserName: 'Jane Smith',
          message: 'Your permission was changed to editor',
          timestamp: '2023-01-02T00:00:00Z',
          isRead: false
        }
      ];

      mockSharingApi.getShareNotifications.mockResolvedValue(notifications);

      const result = await sharingService.getShareNotifications(20, 0);

      expect(mockSharingApi.getShareNotifications).toHaveBeenCalledWith(20, 0);
      expect(result).toEqual(notifications);
      expect(result[0].type).toBe('share_received');
      expect(result[1].type).toBe('permission_changed');
    });

    it('should mark collaboration notifications as read', async () => {
      const notificationId = 'notif-1';

      mockSharingApi.markNotificationRead.mockResolvedValue();

      await sharingService.markNotificationRead(notificationId);

      expect(mockSharingApi.markNotificationRead).toHaveBeenCalledWith(notificationId);
    });

    it('should get share analytics for collaboration insights', async () => {
      const analytics = {
        totalShares: 15,
        activeShares: 12,
        totalViews: 150,
        totalDownloads: 45,
        recentActivity: [
          {
            id: 'activity-1',
            type: 'accessed' as const,
            userId: 'user-1',
            userEmail: 'user1@example.com',
            userName: 'John Doe',
            timestamp: '2023-01-01T00:00:00Z',
            details: 'Viewed document'
          }
        ]
      };

      mockSharingApi.getShareAnalytics.mockResolvedValue(analytics);

      const result = await sharingService.getShareAnalytics(mockFileId);

      expect(mockSharingApi.getShareAnalytics).toHaveBeenCalledWith(mockFileId);
      expect(result).toEqual(analytics);
      expect(result.totalShares).toBe(15);
      expect(result.recentActivity).toHaveLength(1);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    const mockFileId = 'file-123';

    it('should retry failed operations up to max retries', async () => {
      const error = new Error('Network timeout');
      
      // Mock to fail twice, then succeed
      mockSharingApi.getFileSharing
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          id: 'share-123',
          fileId: mockFileId,
          fileName: 'test.pdf',
          fileType: 'file',
          ownerId: 'owner',
          ownerEmail: 'owner@example.com',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          permissions: []
        });

      const result = await sharingService.getFileSharing(mockFileId);

      expect(mockSharingApi.getFileSharing).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('should throw error after max retries exceeded', async () => {
      const error = new Error('Persistent network error');
      
      mockSharingApi.getFileSharing.mockRejectedValue(error);

      await expect(sharingService.getFileSharing(mockFileId)).rejects.toThrow('Persistent network error');
      
      expect(mockSharingApi.getFileSharing).toHaveBeenCalledTimes(3); // Default max retries
    });

    it('should handle invalid share token gracefully', async () => {
      const invalidToken = 'invalid-token';
      const error = new Error('Invalid or expired token');
      
      mockSharingApi.getShareByToken.mockRejectedValue(error);

      await expect(sharingService.getShareByToken(invalidToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should handle permission denied errors', async () => {
      const shareId = 'share-123';
      const userId = 'user-456';
      const error = new Error('Permission denied');
      
      mockSharingApi.updateUserPermission.mockRejectedValue(error);

      await expect(
        sharingService.updateUserPermission(shareId, userId, 'owner')
      ).rejects.toThrow('Permission denied');
    });
  });
});