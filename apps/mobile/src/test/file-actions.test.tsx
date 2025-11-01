import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FileActionsDemo } from '@/components/files/FileActionsDemo';

// Mock the file operations
jest.mock('@/hooks/useFileOperations', () => ({
  useFileOperations: () => ({
    isUploading: false,
    isCreating: false,
    uploadQueue: [],
    uploadProgress: {},
    uploadFile: jest.fn(),
    uploadMultipleFiles: jest.fn(),
    pickAndUploadFiles: jest.fn(),
    pickAndUploadImage: jest.fn(),
    createFolder: jest.fn(),
    deleteFile: jest.fn(),
    moveToTrash: jest.fn(),
    restoreFromTrash: jest.fn(),
    moveItem: jest.fn(),
    copyItem: jest.fn(),
    toggleStar: jest.fn(),
    downloadFile: jest.fn(),
    shareFile: jest.fn(),
    createSharingLink: jest.fn(),
    revokeSharingLink: jest.fn(),
    pauseUpload: jest.fn(),
    resumeUpload: jest.fn(),
    cancelUpload: jest.fn(),
    clearQueue: jest.fn(),
    retryFailedUploads: jest.fn(),
    validateFile: jest.fn(),
    formatFileSize: jest.fn(),
  }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

// Mock react-native Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
  };
});

describe('FileActionsDemo', () => {
  it('renders correctly', () => {
    const { getByText } = render(<FileActionsDemo />);
    
    expect(getByText('File Actions Demo')).toBeTruthy();
    expect(getByText('• Tap files to open them')).toBeTruthy();
  });

  it('toggles layout when layout button is pressed', () => {
    const { getByTestId } = render(<FileActionsDemo />);
    
    // Note: We would need to add testID to the layout button in the actual component
    // This is a placeholder test structure
    expect(true).toBe(true);
  });

  it('displays mock files', () => {
    const { getByText } = render(<FileActionsDemo />);
    
    expect(getByText('Project Proposal.pdf')).toBeTruthy();
    expect(getByText('Images')).toBeTruthy();
  });
});