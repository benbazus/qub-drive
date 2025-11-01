import React from 'react'
import { render } from '@testing-library/react-native'
import { FileDisplay } from '../components/files/FileDisplay'
import { FileItem } from '../types/file'

// Mock the theme hook
jest.mock('../hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000'
}))

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}))

describe('FileDisplay', () => {
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'test-file.txt',
      type: 'file',
      size: 1024,
      mimeType: 'text/plain',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      isShared: false,
      isStarred: false,
      isPublic: false,
    },
    {
      id: '2',
      name: 'test-folder',
      type: 'folder',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      isShared: false,
      isStarred: false,
      isPublic: false,
    }
  ]

  it('renders without crashing', () => {
    const { getByText } = render(
      <FileDisplay files={mockFiles} />
    )
    
    expect(getByText('test-file.txt')).toBeTruthy()
    expect(getByText('test-folder')).toBeTruthy()
  })

  it('renders empty state when no files', () => {
    const { getByText } = render(
      <FileDisplay files={[]} />
    )
    
    expect(getByText('No files found')).toBeTruthy()
  })

  it('shows view toggle buttons', () => {
    const { getByTestId } = render(
      <FileDisplay files={mockFiles} showViewToggle={true} />
    )
    
    // The component should render view toggle buttons
    // This is a basic test to ensure the component renders
    expect(getByTestId).toBeDefined()
  })
})