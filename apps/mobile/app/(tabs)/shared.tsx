import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SharedFilesList, ShareManagement } from '@/components/sharing';
import { FileShare } from '@/types/sharing';

export default function SharedScreen() {
  const colorScheme = useColorScheme();
  const [selectedShare, setSelectedShare] = useState<FileShare | null>(null);
  const [showManagement, setShowManagement] = useState(false);
  const [viewType, setViewType] = useState<'shared-with-me' | 'shared-by-me'>('shared-with-me');

  const handleFilePress = (share: FileShare) => {
    setSelectedShare(share);
    setShowManagement(true);
  };

  const handleError = (error: string) => {
    Alert.alert('Error', error);
  };

  const handleCloseManagement = () => {
    setShowManagement(false);
    setSelectedShare(null);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Shared Files',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }} 
      />
      <ThemedView style={styles.container}>
        {/* View Type Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              viewType === 'shared-with-me' && styles.activeTab,
              { borderBottomColor: Colors[colorScheme ?? 'light'].tint }
            ]}
            onPress={() => setViewType('shared-with-me')}
          >
            <ThemedText style={[
              styles.tabText,
              viewType === 'shared-with-me' && styles.activeTabText
            ]}>
              Shared with Me
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              viewType === 'shared-by-me' && styles.activeTab,
              { borderBottomColor: Colors[colorScheme ?? 'light'].tint }
            ]}
            onPress={() => setViewType('shared-by-me')}
          >
            <ThemedText style={[
              styles.tabText,
              viewType === 'shared-by-me' && styles.activeTabText
            ]}>
              Shared by Me
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Shared Files List */}
        <SharedFilesList
          type={viewType}
          onFilePress={handleFilePress}
          onError={handleError}
        />

        {/* Share Management Modal */}
        <ShareManagement
          visible={showManagement}
          file={selectedShare ? {
            id: selectedShare.fileId,
            name: selectedShare.fileName,
            type: selectedShare.fileType,
            createdAt: selectedShare.createdAt,
            updatedAt: selectedShare.updatedAt,
          } : null}
          onClose={handleCloseManagement}
          onError={handleError}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000033',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
});