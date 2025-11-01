import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Breadcrumb, BreadcrumbItem } from '@/components/navigation/Breadcrumb';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock navigation store
jest.mock('@/stores/navigation/navigationStore', () => ({
  useNavigationStore: () => ({
    currentPath: [
      { id: 'root', name: 'My Files', path: '/', isFolder: true },
      { id: 'folder1', name: 'Documents', path: '/documents', isFolder: true },
    ],
    navigateToFolder: jest.fn(),
    navigateToRoot: jest.fn(),
    navigateBack: jest.fn(),
    getRecentFolders: jest.fn(() => []),
    getFavorites: jest.fn(() => []),
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
    isFavorite: jest.fn(() => false),
  }),
}));

describe('Breadcrumb Navigation', () => {
  const mockBreadcrumbItems: BreadcrumbItem[] = [
    { id: 'root', name: 'My Files', path: '/', isFolder: true },
    { id: 'folder1', name: 'Documents', path: '/documents', isFolder: true },
    { id: 'folder2', name: 'Projects', path: '/documents/projects', isFolder: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Breadcrumb Component', () => {
    it('renders breadcrumb items correctly', () => {
      const { getByText } = render(
        <Breadcrumb items={mockBreadcrumbItems} />
      );

      expect(getByText('Documents')).toBeTruthy();
      expect(getByText('Projects')).toBeTruthy();
    });

    it('shows breadcrumb container', () => {
      const { getByTestId } = render(
        <Breadcrumb items={mockBreadcrumbItems} showHomeIcon={true} />
      );

      // The breadcrumb container should be present
      const breadcrumbContainer = getByTestId('breadcrumb-container');
      expect(breadcrumbContainer).toBeTruthy();
    });

    it('handles navigation when breadcrumb item is pressed', () => {
      const mockOnNavigate = jest.fn();
      const { getByText } = render(
        <Breadcrumb items={mockBreadcrumbItems} onNavigate={mockOnNavigate} />
      );

      fireEvent.press(getByText('Documents'));
      expect(mockOnNavigate).toHaveBeenCalledWith(mockBreadcrumbItems[1]);
    });

    it('handles empty breadcrumb items', () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container.children).toHaveLength(0);
    });
  });

  describe('Basic Navigation Features', () => {
    it('breadcrumb navigation works correctly', () => {
      const mockOnNavigate = jest.fn();
      const { getByText } = render(
        <Breadcrumb items={mockBreadcrumbItems} onNavigate={mockOnNavigate} />
      );

      // Test that we can navigate to a folder
      fireEvent.press(getByText('Documents'));
      expect(mockOnNavigate).toHaveBeenCalledWith(mockBreadcrumbItems[1]);
    });

    it('handles mobile-friendly interactions', () => {
      const { getByText } = render(
        <Breadcrumb items={mockBreadcrumbItems} />
      );

      const documentsItem = getByText('Documents');
      expect(documentsItem).toBeTruthy();
      
      // Test touch interaction
      fireEvent.press(documentsItem);
    });
  });


});