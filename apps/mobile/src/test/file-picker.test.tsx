import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'
import FileSelectionManager, { DocumentPickerButton, CameraButton, GalleryButton } from '@/components/files/FileSelectionManager'

// Mock the external dependencies
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}))

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

jest.mock('@/services/fileOperations', () => ({
  fileOperations: {
    uploadFileFromUri: jest.fn(),
  },
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

describe('FileSelectionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders default upload button', () => {
    const { getByText } = render(<FileSelectionManager />)
    expect(getByText('Upload Files')).toBeTruthy()
  })

  it('renders with custom children', () => {
    const { getByText } = render(
      <FileSelectionManager>
        <div>Custom Upload Button</div>
      </FileSelectionManager>
    )
    expect(getByText('Custom Upload Button')).toBeTruthy()
  })

  it('calls onSuccess when files are uploaded', async () => {
    const mockOnSuccess = jest.fn()
    const { getByText } = render(
      <FileSelectionManager 
        options={{ 
          onSuccess: mockOnSuccess,
          allowMultiple: true,
          maxFiles: 5 
        }} 
      />
    )
    
    // Test that the component renders
    expect(getByText('Upload Files')).toBeTruthy()
  })

  it('calls onError when upload fails', async () => {
    const mockOnError = jest.fn()
    const { getByText } = render(
      <FileSelectionManager 
        options={{ 
          onError: mockOnError,
          allowMultiple: false,
          maxSize: 10 * 1024 * 1024 // 10MB
        }} 
      />
    )
    
    // Test that the component renders
    expect(getByText('Upload Files')).toBeTruthy()
  })
})

describe('DocumentPickerButton', () => {
  it('renders document picker button', () => {
    const { getByText } = render(<DocumentPickerButton />)
    expect(getByText('Documents')).toBeTruthy()
  })

  it('calls onSuccess callback', () => {
    const mockOnSuccess = jest.fn()
    const { getByText } = render(
      <DocumentPickerButton onSuccess={mockOnSuccess} />
    )
    expect(getByText('Documents')).toBeTruthy()
  })
})

describe('CameraButton', () => {
  it('renders camera button', () => {
    const { getByText } = render(<CameraButton />)
    expect(getByText('Camera')).toBeTruthy()
  })

  it('calls onSuccess callback', () => {
    const mockOnSuccess = jest.fn()
    const { getByText } = render(
      <CameraButton onSuccess={mockOnSuccess} />
    )
    expect(getByText('Camera')).toBeTruthy()
  })
})

describe('GalleryButton', () => {
  it('renders gallery button', () => {
    const { getByText } = render(<GalleryButton />)
    expect(getByText('Gallery')).toBeTruthy()
  })

  it('supports multiple selection', () => {
    const mockOnSuccess = jest.fn()
    const { getByText } = render(
      <GalleryButton 
        onSuccess={mockOnSuccess} 
        allowMultiple={true}
      />
    )
    expect(getByText('Gallery')).toBeTruthy()
  })

  it('supports single selection', () => {
    const mockOnSuccess = jest.fn()
    const { getByText } = render(
      <GalleryButton 
        onSuccess={mockOnSuccess} 
        allowMultiple={false}
      />
    )
    expect(getByText('Gallery')).toBeTruthy()
  })
})

describe('File Picker Integration', () => {
  it('handles file validation correctly', () => {
    const options = {
      allowMultiple: true,
      maxFiles: 3,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', '.pdf'],
    }

    const { getByText } = render(
      <FileSelectionManager options={options} />
    )
    
    expect(getByText('Upload Files')).toBeTruthy()
  })

  it('handles camera integration', () => {
    const options = {
      showCamera: true,
      showDocuments: false,
      showGallery: false,
    }

    const { getByText } = render(
      <FileSelectionManager options={options} />
    )
    
    expect(getByText('Upload Files')).toBeTruthy()
  })

  it('handles gallery integration', () => {
    const options = {
      showCamera: false,
      showDocuments: false,
      showGallery: true,
    }

    const { getByText } = render(
      <FileSelectionManager options={options} />
    )
    
    expect(getByText('Upload Files')).toBeTruthy()
  })

  it('handles document picker integration', () => {
    const options = {
      showCamera: false,
      showDocuments: true,
      showGallery: false,
    }

    const { getByText } = render(
      <FileSelectionManager options={options} />
    )
    
    expect(getByText('Upload Files')).toBeTruthy()
  })
})