import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCards } from '../components/layout/StatCards';
import { QuickActions } from '../components/layout/QuickActions';
import { ResponsiveGrid } from '../components/layout/ResponsiveGrid';
import { ThemedText } from '../components/themed-text';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}));

jest.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { name: 'Test User' },
  }),
}));

describe('Dashboard Layout Components', () => {
  it('renders DashboardLayout with children', () => {
    const { getByText } = render(
      <DashboardLayout>
        <ThemedText>Test Content</ThemedText>
      </DashboardLayout>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders StatCards component', () => {
    const { getByText } = render(<StatCards />);
    
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Total Files')).toBeTruthy();
    expect(getByText('Shared Files')).toBeTruthy();
    expect(getByText('Storage Used')).toBeTruthy();
    expect(getByText('Recent Activity')).toBeTruthy();
  });

  it('renders QuickActions component', () => {
    const { getByText } = render(<QuickActions />);
    
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Upload Files')).toBeTruthy();
    expect(getByText('Create Document')).toBeTruthy();
    expect(getByText('Create Spreadsheet')).toBeTruthy();
    expect(getByText('Create Form')).toBeTruthy();
  });

  it('renders ResponsiveGrid with children', () => {
    const { getByText } = render(
      <ResponsiveGrid columns={2}>
        <ThemedText>Item 1</ThemedText>
        <ThemedText>Item 2</ThemedText>
      </ResponsiveGrid>
    );
    
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });
});