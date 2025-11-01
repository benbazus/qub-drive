import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { QuickNavigationButton, useQuickNavigation } from '@/components/navigation/QuickNavigation';
import { EnhancedFileGrid } from '@/components/files/EnhancedFileGrid';
import { useNavigationStore } from '@/stores/navigation/navigationStore';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FileItem } from '@/types/file';

// Mock data for demonstration
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'file',
    size: 2048576,
    mimeType: 'application/pdf',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isStarred: true,
    isShared: false,
  },
  {
    id: '2',
    name: 'Images',
    type: 'folder',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    isStarred: false,
    isShared: true,
  },
  {
    id: '3',
    name: 'Meeting Notes.docx',
    type: 'file',
    size: 524288,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    createdAt: '2024-01-18T14:20:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    isStarred: false,
    isShared: false,
  },
  {
    id: '4',
    name: 'Budget Spreadsheet.xlsx',
    type: 'file',
    size: 1048576,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    createdAt: '2024-01-12T11:15:00Z',
    updatedAt: '2024-01-19T16:30:00Z',
    isStarred: true,
    isShared: true,
  },
  {
    id: '5',
    name: 'Documents',
    type: 'folder',
    createdAt: '2024-01-08T08:30:00Z',
    updatedAt: '2024-01-21T12:00:00Z',
    isStarred: false,
    isShared: false,
  },
];

export default function FilesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  
  const { currentPath, navigateToRoot } = useNavigationStore();
  const { show: showQuickNav, QuickNavigationModal } = useQuickNavigation();

  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Ensure we're at root when accessing files tab
    navigateToRoot();
  }, [navigateToRoot]);

  // Handle file press (navigation)
  const handleFilePress = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      router.push(`/folder/${file.id}`);
    } else {
      Alert.alert('Open File', `Would open file: ${file.name}`);
    }
  }, [router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setMessage('Files refreshed');
      setTimeout(() => setMessage(''), 2000);
    }, 1000);
  }, []);

  // Handle success messages
  const handleSuccess = useCallback((successMessage: string) => {
    setMessage(successMessage);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  // Handle error messages
  const handleError = useCallback((errorMessage: string) => {
    Alert.alert('Error', errorMessage);
  }, []);

  // Toggle layout
  const toggleLayout = useCallback(() => {
    setLayout(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false, // We'll use custom navigation
        }} 
      />
      <ThemedView style={styles.container}>
        {/* Custom Header with Breadcrumb */}
        <View style={[
          styles.header,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText type="title" style={styles.title}>
                My Files
              </ThemedText>
              <ThemedText style={styles.description}>
                Browse and manage your files and folders
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.layoutButton, { backgroundColor: tintColor + '20' }]}
              onPress={toggleLayout}
              activeOpacity={0.7}
            >
              <Ionicons
                name={layout === 'grid' ? 'list' : 'grid'}
                size={20}
                color={tintColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumbContainer}>
          <Breadcrumb items={currentPath} />
          <QuickNavigationButton onPress={showQuickNav} />
        </View>

        {/* Success Message */}
        {message ? (
          <View style={[styles.messageContainer, { backgroundColor: '#4CAF50' }]}>
            <ThemedText style={styles.messageText}>{message}</ThemedText>
          </View>
        ) : null}
        
        {/* Enhanced File Grid */}
        <EnhancedFileGrid
          files={files}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onFilePress={handleFilePress}
          layout={layout}
          numColumns={layout === 'grid' ? 2 : 1}
          showMetadata={true}
          showThumbnails={true}
          onSuccess={handleSuccess}
          onError={handleError}
        />
        
        <QuickNavigationModal />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60, // Account for status bar
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: 8,
  },
  description: {
    opacity: 0.7,
  },
  layoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});