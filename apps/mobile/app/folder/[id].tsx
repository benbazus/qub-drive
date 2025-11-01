import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { BackNavigation } from '@/components/navigation/BackNavigation';
import { QuickNavigationButton, useQuickNavigation } from '@/components/navigation/QuickNavigation';
import { useNavigationStore } from '@/stores/navigation/navigationStore';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentPath, navigateToFolder } = useNavigationStore();
  const { show: showQuickNav, QuickNavigationModal } = useQuickNavigation();

  // TODO: In file management task, fetch actual folder data
  const mockFolder = useMemo(() => ({
    id: id as string,
    name: `Folder ${id}`,
    path: `/folder/${id}`,
    isFolder: true,
  }), [id]);

  useEffect(() => {
    // Update navigation path when entering folder
    navigateToFolder(mockFolder);
  }, [mockFolder, navigateToFolder]);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false, // We'll use custom navigation
        }} 
      />
      <ThemedView style={styles.container}>
        <BackNavigation 
          title={mockFolder.name}
          showBreadcrumb={false}
        />
        
        <View style={styles.breadcrumbContainer}>
          <Breadcrumb items={currentPath} />
          <QuickNavigationButton onPress={showQuickNav} />
        </View>
        
        <ThemedView style={styles.content}>
          <ThemedText type="title">Folder Contents</ThemedText>
          <ThemedText>Folder ID: {id}</ThemedText>
          <ThemedText style={styles.note}>
            This screen will show folder contents and allow navigation into subfolders.
            Implementation will be completed in the file management task.
          </ThemedText>
          
          <View style={styles.pathInfo}>
            <ThemedText type="subtitle" style={styles.pathTitle}>
              Current Path:
            </ThemedText>
            {currentPath.map((item, index) => (
              <ThemedText key={item.id} style={styles.pathItem}>
                {index + 1}. {item.name} ({item.isFolder ? 'Folder' : 'File'})
              </ThemedText>
            ))}
          </View>
        </ThemedView>
        
        <QuickNavigationModal />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  note: {
    marginTop: 16,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  pathInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  pathTitle: {
    marginBottom: 8,
  },
  pathItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
});