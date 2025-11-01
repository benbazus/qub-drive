import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Alert, Share as NativeShare } from 'react-native';
import { useSharing } from '@/hooks/useSharing';
import { sharingService } from '@/services/sharingService';
import { FileItem } from '@/types/file';
import { FileShare } from '@/types/sharing';

// Mock the sharing service
jest.mock('@/services/sharingService');

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
  };
});

const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
const mockNativeShare = NativeShare.share as jest.MockedFunction<typeof NativeShare.share>;

describe('useSharing Hook Tests', () => {
  const mockFile: FileItem = {
    id: 'file-123',
    name: 'Test Document.pdf',
    type: 'file',
    size: 1024000,
    mimeType: 'application/pdf',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ownerId: 'owner-123',
    parentId: null,
    path: '/Test Document.pdf',
    isStarred: false,
    isTrashed: false,
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true
    }
  };

  const mockShare: FileShare = {
    id: 'share-123',
    fileId: 'file-123',
    fileName: 'Test Document.pdf',
    fileType: 'file',
    ownerId: 'owner-123',
    ownerEmail: 'owner@example.com',
    ownerName: 'John Doe',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    shareLink: {
      id: 'link-123',
      token: 'abc123',
      url: 'https://app.qubdrive.com/share/abc123',
      accessLevel: 'view',
      isActive: true,
      hasPassword: false,
      downloadCount: 0,
      createdAt: '2023-01-01T00:00:00Z'
    },
    permissions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Share File Functionality', () => {
    it('should share file with users successfully', async () => {
      const onSuccess = jest.fn();
      const emails = ['user1@example.com', 'user2@example.com'];

      mockSharingService.shareWithUsers.mockResolvedValue(mockShare);

      const { result } = renderHook(() => useSharing({ onSuccess }));

      await act(async () => {
        await result.current.shareFile(mockFile, emails, 'viewer');
      });

      expect(mockSharingService.shareWithUsers).toHaveBeenCalledWith(
        mockFile.id,
        emails.map(email => ({ email, role: 'viewer' }))
      );
      expect(onSuccess).toHaveBeenCalledWith(`Shared "${mockFile.name}" with ${emails.length} user(s)`);
      expect(result.current.currentShare).toEqual(mockShare);
    });

    it('should handle share file errors', async () => {
      const onError = jest.fn();
      const error = new Error('Permission denied');

      mockSharingService.shareWithUsers.mockRejectedValue(error);

      const { result } = renderHook(() => useSharing({ onError }));

      await act(async () => {
        try {
          await result.current.shareFile(mockFile, ['user@example.com']);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith('Permission denied');
    });

    it('should create sharing link successfully', async () => {
      const onSuccess = jest.fn();
      const shareUrl = 'https://app.qubdrive.com/share/abc123';

      mockSharingService.createSharingLink.mockResolvedValue(shareUrl);

      const { result } = renderHook(() => useSharing({ onSuccess }));

      let resultUrl: string;
      await act(async () => {
        resultUrl = await result.current.createSharingLink(mockFile, 'edit');
      });

      expect(mockSharingService.createSharingLink).toHaveBeenCalledWith(
        mockFile.id,
        { accessLevel: 'edit' }
      );
      expect(onSuccess).toHaveBeenCalledWith(`Sharing link created for "${mockFile.name}"`);
      expect(resultUrl!).toBe(shareUrl);
    });

    it('should share via native share with existing link', async () => {
      const onSuccess = jest.fn();
      const shareUrl = 'https://app.qubdrive.com/share/abc123';

      mockSharingService.getFileSharing.mockResolvedValue(mockShare);
      mockNativeShare.mockResolvedValue({ action: 'sharedAction' });

      const { result } = renderHook(() => useSharing({ onSuccess }));

      await act(async () => {
        await result.current.shareViaLink(mockFile);
      });

      expect(mockSharingService.getFileSharing).toHaveBeenCalledWith(mockFile.id);
      expect(mockNativeShare).toHaveBeenCalledWith({
        message: `Check out this ${mockFile.type}: ${mockFile.name}`,
        url: mockShare.shareLink!.url,
        title: `Share ${mockFile.name}`,
      });
      expect(onSuccess).toHaveBeenCalledWith(`Shared "${mockFile.name}" via link`);
    });

    it('should create new link when sharing via native share without existing link', async () => {
      const onSuccess = jest.fn();
      const shareUrl = 'https://app.qubdrive.com/share/new123';

      mockSharingService.getFileSharing.mockRejectedValue(new Error('No share found'));
      mockSharingService.createSharingLink.mockResolvedValue(shareUrl);
      mockNativeShare.mockResolvedValue({ action: 'sharedAction' });

      const { result } = renderHook(() => useSharing({ onSuccess }));

      await act(async () => {
        await result.current.shareViaLink(mockFile);
      });

      expect(mockSharingService.createSharingLink).toHaveBeenCalledWith(
        mockFile.id,
        { accessLevel: 'view' }
      );
      expect(mockNativeShare).toHaveBeenCalledWith({
        message: `Check out this ${mockFile.type}: ${mockFile.name}`,
        url: shareUrl,
        title: `Share ${mockFile.name}`,
      });
    });

    it('should handle native share cancellation gracefully', async () => {
      const onError = jest.fn();
      const shareUrl = 'https://app.qubdrive.com/share/abc123';

      mockSharingService.getFileSharing.mockResolvedValue(mockShare);
      mockNativeShare.mockRejectedValue(new Error('User cancelled'));

      const { result } = renderHook(() => useSharing({ onError }));

      await act(async () => {
        await result.current.shareViaLink(mockFile);
      });

      expect(onError).not.toHaveBeenCalled(); // Should not call onError for user cancellation
    });

    it('should show quick share options', async () => {
      const { result } = renderHook(() => useSharing());

      await act(async () => {
        await result.current.quickShare(mockFile);
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Share File',
        `How would you like to share "${mockFile.name}"?`,
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Link', onPress: expect.any(Function) },
          { text: 'Invite People', onPress: expect.any(Function) }
        ])
      );
    });
  });

  describe('Permission Management', () => {
    it('should get file sharing information', async () => {
      mockSharingService.getFileSharing.mockResolvedValue(mockShare);

      const { result } = renderHook(() => useSharing());

      let share: FileShare | null;
      await act(async () => {
        share = await result.current.getFileSharing(mockFile.id);
      });

      expect(mockSharingService.getFileSharing).toHaveBeenCalledWith(mockFile.id);
      expect(share!).toEqual(mockShare);
      expect(result.current.currentShare).toEqual(mockShare);
    });

    it('should return null when file is not shared', async () => {
      mockSharingService.getFileSharing.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useSharing());

      let share: FileShare | null;
      await act(async () => {
        share = await result.current.getFileSharing(mockFile.id);
      });

      expect(share!).toBeNull();
    });

    it('should update user permission successfully', async () => {
      const onSuccess = jest.fn();
      const shareId = 'share-123';
      const userId = 'user-456';

      mockSharingService.updateUserPermission.mockResolvedValue();

      const { result } = renderHook(() => useSharing({ onSuccess }));

      // Set current share first
      act(() => {
        result.current.currentShare = {
          ...mockShare,
          permissions: [
            {
              id: 'perm-1',
              userId,
              email: 'user@example.com',
              role: 'viewer',
              grantedAt: '2023-01-01T00:00:00Z',
              grantedBy: 'owner-123'
            }
          ]
        };
      });

      await act(async () => {
        await result.current.updatePermission(shareId, userId, 'editor');
      });

      expect(mockSharingService.updateUserPermission).toHaveBeenCalledWith(
        shareId,
        userId,
        'editor'
      );
      expect(onSuccess).toHaveBeenCalledWith('Permission updated successfully');
      expect(result.current.currentShare?.permissions[0].role).toBe('editor');
    });

    it('should remove user from share successfully', async () => {
      const onSuccess = jest.fn();
      const shareId = 'share-123';
      const userId = 'user-456';

      mockSharingService.removeUserFromShare.mockResolvedValue();

      const { result } = renderHook(() => useSharing({ onSuccess }));

      // Set current share with user
      act(() => {
        result.current.currentShare = {
          ...mockShare,
          permissions: [
            {
              id: 'perm-1',
              userId,
              email: 'user@example.com',
              role: 'viewer',
              grantedAt: '2023-01-01T00:00:00Z',
              grantedBy: 'owner-123'
            }
          ]
        };
      });

      await act(async () => {
        await result.current.removeUser(shareId, userId);
      });

      expect(mockSharingService.removeUserFromShare).toHaveBeenCalledWith(shareId, userId);
      expect(onSuccess).toHaveBeenCalledWith('User removed from share');
      expect(result.current.currentShare?.permissions).toHaveLength(0);
    });

    it('should revoke sharing successfully', async () => {
      const onSuccess = jest.fn();
      const shareId = 'share-123';

      mockSharingService.deleteShare.mockResolvedValue();

      const { result } = renderHook(() => useSharing({ onSuccess }));

      await act(async () => {
        await result.current.revokeSharing(shareId);
      });

      expect(mockSharingService.deleteShare).toHaveBeenCalledWith(shareId);
      expect(onSuccess).toHaveBeenCalledWith('Sharing revoked successfully');
      expect(result.current.currentShare).toBeNull();
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk share multiple files', async () => {
      const onSuccess = jest.fn();
      const files = [mockFile, { ...mockFile, id: 'file-456', name: 'File 2.pdf' }];
      const emails = ['user1@example.com', 'user2@example.com'];

      mockSharingService.bulkShare.mockResolvedValue([mockShare]);

      const { result } = renderHook(() => useSharing({ onSuccess }));

      await act(async () => {
        await result.current.bulkShare(files, emails, 'editor');
      });

      expect(mockSharingService.bulkShare).toHaveBeenCalledWith(
        files.map(f => f.id),
        emails.map(email => ({ email, role: 'editor' }))
      );
      expect(onSuccess).toHaveBeenCalledWith(
        `Shared ${files.length} files with ${emails.length} user(s)`
      );
    });
  });

  describe('Utility Functions', () => {
    it('should validate email addresses', async () => {
      const emails = ['valid@example.com', 'invalid-email'];
      const validationResult = [
        { email: 'valid@example.com', isValid: true, isRegistered: false },
        { email: 'invalid-email', isValid: false, isRegistered: false }
      ];

      mockSharingService.validateEmails.mockResolvedValue(validationResult);

      const { result } = renderHook(() => useSharing());

      let validation: typeof validationResult;
      await act(async () => {
        validation = await result.current.validateEmails(emails);
      });

      expect(mockSharingService.validateEmails).toHaveBeenCalledWith(emails);
      expect(validation!).toEqual(validationResult);
    });

    it('should search users', async () => {
      const query = 'john';
      const searchResults = [
        {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg'
        }
      ];

      mockSharingService.searchUsers.mockResolvedValue(searchResults);

      const { result } = renderHook(() => useSharing());

      let users: typeof searchResults;
      await act(async () => {
        users = await result.current.searchUsers(query);
      });

      expect(mockSharingService.searchUsers).toHaveBeenCalledWith(query);
      expect(users!).toEqual(searchResults);
    });
  });

  describe('Loading States', () => {
    it('should manage loading state during operations', async () => {
      mockSharingService.shareWithUsers.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockShare), 100))
      );

      const { result } = renderHook(() => useSharing());

      expect(result.current.isLoading).toBe(false);

      const sharePromise = act(async () => {
        await result.current.shareFile(mockFile, ['user@example.com']);
      });

      // Check loading state during operation
      expect(result.current.isLoading).toBe(true);

      await sharePromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should reset loading state on error', async () => {
      const onError = jest.fn();
      mockSharingService.shareWithUsers.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSharing({ onError }));

      await act(async () => {
        try {
          await result.current.shareFile(mockFile, ['user@example.com']);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Callback Integration', () => {
    it('should call onUpdate callback after successful operations', async () => {
      const onUpdate = jest.fn();
      mockSharingService.shareWithUsers.mockResolvedValue(mockShare);

      const { result } = renderHook(() => useSharing({ onUpdate }));

      await act(async () => {
        await result.current.shareFile(mockFile, ['user@example.com']);
      });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should not call onUpdate on error', async () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();
      mockSharingService.shareWithUsers.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useSharing({ onUpdate, onError }));

      await act(async () => {
        try {
          await result.current.shareFile(mockFile, ['user@example.com']);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(onUpdate).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });
});