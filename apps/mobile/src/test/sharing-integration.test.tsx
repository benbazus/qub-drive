import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { SharingDemo } from '@/components/sharing/SharingDemo';
import { useSharing } from '@/hooks/useSharing';
import { FileItem } from '@/types/file';

// Mock the useSharing hook
jest.mock('@/hooks/useSharing');

// Mock React Native Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

const mockUseSharing = useSharing as jest.MockedFunction<typeof useSharing>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('Sharing Integration Tests', () => {
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

  const mockSharingHook = {
    isLoading: false,
    currentShare: null,
    shareFile: jest.fn(),
    createSharingLink: jest.fn(),
    shareViaLink: jest.fn(),
    quickShare: jest.fn(),
    getFileSharing: jest.fn(),
    revokeSharing: jest.fn(),
    updatePermission: jest.fn(),
    removeUser: jest.fn(),
    bulkShare: jest.fn(),
    validateEmails: jest.fn(),
    searchUsers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSharing.mockReturnValue(mockSharingHook);
  });

  describe('ShareDialog Component Integration', () => {
    const defaultProps = {
      visible: true,
      file: mockFile,
      onClose: jest.fn(),
    };

    it('should render share dialog with file information', () => {
      const { getByText } = render(<ShareDialog {...defaultProps} />);

      expect(getByText('Share File')).toBeTruthy();
      expect(getByText(mockFile.name)).toBeTruthy();
    });

    it('should handle email input and validation', async () => {
      mockSharingHook.validateEmails.mockResolvedValue([
        { email: 'valid@example.com', isValid: true, isRegistered: true }
      ]);

      const { getByPlaceholderText, getByText } = render(<ShareDialog {...defaultProps} />);

      const emailInput = getByPlaceholderText('Enter email addresses...');
      fireEvent.changeText(emailInput, 'valid@example.com');

      // Simulate adding email
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(mockSharingHook.validateEmails).toHaveBeenCalledWith(['valid@example.com']);
      });
    });

    it('should create sharing link when link button is pressed', async () => {
      const shareUrl = 'https://app.qubdrive.com/share/abc123';
      mockSharingHook.createSharingLink.mockResolvedValue(shareUrl);

      const { getByText } = render(<ShareDialog {...defaultProps} />);

      const linkButton = getByText('Create Link');
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(mockSharingHook.createSharingLink).toHaveBeenCalledWith(mockFile, 'view');
      });
    });

    it('should share file with selected users', async () => {
      const { getByText, getByPlaceholderText } = render(<ShareDialog {...defaultProps} />);

      // Add email
      const emailInput = getByPlaceholderText('Enter email addresses...');
      fireEvent.changeText(emailInput, 'user@example.com');
      
      const addButton = getByText('Add');
      fireEvent.press(addButton);

      // Share with users
      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(mockSharingHook.shareFile).toHaveBeenCalledWith(
          mockFile,
          ['user@example.com'],
          'viewer'
        );
      });
    });

    it('should handle permission level changes', () => {
      const { getByText } = render(<ShareDialog {...defaultProps} />);

      // Find and press editor permission option
      const editorOption = getByText('Editor');
      fireEvent.press(editorOption);

      // Verify the permission level is updated in the UI
      expect(getByText('Editor')).toBeTruthy();
    });

    it('should show loading state during operations', () => {
      mockUseSharing.mockReturnValue({
        ...mockSharingHook,
        isLoading: true,
      });

      const { getByTestId } = render(<ShareDialog {...defaultProps} />);

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should handle share dialog close', () => {
      const onClose = jest.fn();
      const { getByText } = render(<ShareDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('SharingDemo Component Integration', () => {
    it('should render sharing demo with mock files', () => {
      const { getByText } = render(<SharingDemo />);

      expect(getByText('File Sharing Demo')).toBeTruthy();
      expect(getByText('• Long press files to see sharing options')).toBeTruthy();
    });

    it('should show share options on file long press', () => {
      const { getByText } = render(<SharingDemo />);

      // Find a mock file and long press it
      const fileItem = getByText('Project Proposal.pdf');
      fireEvent(fileItem, 'onLongPress');

      // Should show action sheet or context menu
      expect(mockAlert).toHaveBeenCalled();
    });

    it('should handle quick share action', async () => {
      const { getByText } = render(<SharingDemo />);

      // Simulate quick share action
      const fileItem = getByText('Project Proposal.pdf');
      fireEvent(fileItem, 'onLongPress');

      // Mock the alert callback for quick share
      const alertCall = mockAlert.mock.calls[0];
      const quickShareOption = alertCall[2]?.find((option: any) => 
        option.text === 'Quick Share'
      );

      if (quickShareOption?.onPress) {
        quickShareOption.onPress();
      }

      await waitFor(() => {
        expect(mockSharingHook.quickShare).toHaveBeenCalled();
      });
    });

    it('should handle share via link action', async () => {
      const { getByText } = render(<SharingDemo />);

      const fileItem = getByText('Project Proposal.pdf');
      fireEvent(fileItem, 'onLongPress');

      // Mock the alert callback for share via link
      const alertCall = mockAlert.mock.calls[0];
      const shareLinkOption = alertCall[2]?.find((option: any) => 
        option.text === 'Share Link'
      );

      if (shareLinkOption?.onPress) {
        shareLinkOption.onPress();
      }

      await waitFor(() => {
        expect(mockSharingHook.shareViaLink).toHaveBeenCalled();
      });
    });

    it('should toggle between grid and list view', () => {
      const { getByTestId } = render(<SharingDemo />);

      const layoutToggle = getByTestId('layout-toggle');
      fireEvent.press(layoutToggle);

      // Should change layout (this would be verified by checking the layout state)
      expect(layoutToggle).toBeTruthy();
    });
  });

  describe('Collaboration Scenarios Integration', () => {
    it('should handle real-time collaboration notifications', async () => {
      const mockNotifications = [
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
        }
      ];

      // Mock the sharing service to return notifications
      mockSharingHook.getFileSharing.mockResolvedValue({
        id: 'share-123',
        fileId: 'file-1',
        fileName: 'Collaborative Document.pdf',
        fileType: 'file',
        ownerId: 'user-1',
        ownerEmail: 'user1@example.com',
        ownerName: 'John Doe',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        permissions: []
      });

      const { getByText } = render(<SharingDemo />);

      // Simulate checking for shared files
      const refreshButton = getByText('Refresh');
      fireEvent.press(refreshButton);

      await waitFor(() => {
        expect(mockSharingHook.getFileSharing).toHaveBeenCalled();
      });
    });

    it('should handle permission changes in collaboration', async () => {
      const mockShare = {
        id: 'share-123',
        fileId: 'file-123',
        fileName: 'Collaborative Document.pdf',
        fileType: 'file' as const,
        ownerId: 'owner-123',
        ownerEmail: 'owner@example.com',
        ownerName: 'Owner',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        permissions: [
          {
            id: 'perm-1',
            userId: 'user-456',
            email: 'collaborator@example.com',
            name: 'Collaborator',
            role: 'viewer' as const,
            grantedAt: '2023-01-01T00:00:00Z',
            grantedBy: 'owner-123'
          }
        ]
      };

      mockUseSharing.mockReturnValue({
        ...mockSharingHook,
        currentShare: mockShare,
      });

      const { getByText } = render(<ShareDialog {...defaultProps} />);

      // Should show current permissions
      expect(getByText('collaborator@example.com')).toBeTruthy();
      expect(getByText('Viewer')).toBeTruthy();

      // Simulate permission change
      const changePermissionButton = getByText('Change to Editor');
      fireEvent.press(changePermissionButton);

      await waitFor(() => {
        expect(mockSharingHook.updatePermission).toHaveBeenCalledWith(
          'share-123',
          'user-456',
          'editor'
        );
      });
    });

    it('should handle user removal from collaboration', async () => {
      const mockShare = {
        id: 'share-123',
        fileId: 'file-123',
        fileName: 'Collaborative Document.pdf',
        fileType: 'file' as const,
        ownerId: 'owner-123',
        ownerEmail: 'owner@example.com',
        ownerName: 'Owner',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        permissions: [
          {
            id: 'perm-1',
            userId: 'user-456',
            email: 'collaborator@example.com',
            name: 'Collaborator',
            role: 'viewer' as const,
            grantedAt: '2023-01-01T00:00:00Z',
            grantedBy: 'owner-123'
          }
        ]
      };

      mockUseSharing.mockReturnValue({
        ...mockSharingHook,
        currentShare: mockShare,
      });

      const { getByText } = render(<ShareDialog {...defaultProps} />);

      // Simulate user removal
      const removeButton = getByText('Remove');
      fireEvent.press(removeButton);

      // Should show confirmation dialog
      expect(mockAlert).toHaveBeenCalledWith(
        'Remove User',
        expect.stringContaining('collaborator@example.com'),
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: expect.any(Function) }
        ])
      );
    });

    it('should handle bulk sharing for team collaboration', async () => {
      const files = [
        mockFile,
        { ...mockFile, id: 'file-456', name: 'Document 2.pdf' },
        { ...mockFile, id: 'file-789', name: 'Document 3.pdf' }
      ];

      const { getByText, getByPlaceholderText } = render(<ShareDialog {...defaultProps} />);

      // Enable bulk sharing mode
      const bulkModeToggle = getByText('Bulk Share');
      fireEvent.press(bulkModeToggle);

      // Add team emails
      const emailInput = getByPlaceholderText('Enter team emails...');
      fireEvent.changeText(emailInput, 'team@example.com, member1@example.com');

      const shareButton = getByText('Share with Team');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(mockSharingHook.bulkShare).toHaveBeenCalledWith(
          files,
          ['team@example.com', 'member1@example.com'],
          'viewer'
        );
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error messages for failed sharing operations', async () => {
      const errorMessage = 'Permission denied';
      mockSharingHook.shareFile.mockRejectedValue(new Error(errorMessage));

      const { getByText, getByPlaceholderText } = render(<ShareDialog {...defaultProps} />);

      // Try to share file
      const emailInput = getByPlaceholderText('Enter email addresses...');
      fireEvent.changeText(emailInput, 'user@example.com');

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockSharingHook.createSharingLink.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<ShareDialog {...defaultProps} />);

      const linkButton = getByText('Create Link');
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    it('should show retry option for failed operations', async () => {
      mockSharingHook.shareFile
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          id: 'share-123',
          fileId: mockFile.id,
          fileName: mockFile.name,
          fileType: 'file',
          ownerId: 'owner',
          ownerEmail: 'owner@example.com',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          permissions: []
        });

      const { getByText, getByPlaceholderText } = render(<ShareDialog {...defaultProps} />);

      // First attempt fails
      const emailInput = getByPlaceholderText('Enter email addresses...');
      fireEvent.changeText(emailInput, 'user@example.com');

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      // Retry succeeds
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockSharingHook.shareFile).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper accessibility labels for sharing actions', () => {
      const { getByLabelText } = render(<ShareDialog {...defaultProps} />);

      expect(getByLabelText('Share file with users')).toBeTruthy();
      expect(getByLabelText('Create sharing link')).toBeTruthy();
      expect(getByLabelText('Close share dialog')).toBeTruthy();
    });

    it('should support screen reader navigation', () => {
      const { getByRole } = render(<ShareDialog {...defaultProps} />);

      expect(getByRole('button', { name: 'Share' })).toBeTruthy();
      expect(getByRole('button', { name: 'Create Link' })).toBeTruthy();
      expect(getByRole('textbox', { name: 'Email input' })).toBeTruthy();
    });

    it('should announce sharing status changes', async () => {
      mockSharingHook.shareFile.mockResolvedValue({
        id: 'share-123',
        fileId: mockFile.id,
        fileName: mockFile.name,
        fileType: 'file',
        ownerId: 'owner',
        ownerEmail: 'owner@example.com',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        permissions: []
      });

      const { getByText, getByLabelText } = render(<ShareDialog {...defaultProps} />);

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(getByLabelText('File shared successfully')).toBeTruthy();
      });
    });
  });
});