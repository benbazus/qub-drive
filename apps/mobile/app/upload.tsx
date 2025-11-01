import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FilePicker } from '@/components/files/FilePicker';
import { UploadProgressModal } from '@/components/upload/UploadProgressModal';
import { UploadFloatingIndicator } from '@/components/upload/UploadFloatingIndicator';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function UploadScreen() {
  const colorScheme = useColorScheme();
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  const {
    uploadStats,
    isInitialized,
    addToQueue,
    networkStatus
  } = useFileUpload({
    onComplete: (item) => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (item, error) => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        'Upload Failed',
        `Failed to upload ${item.fileName}: ${error}`,
        [{ text: 'OK' }]
      );
    }
  });

  // Auto-show progress modal when uploads start
  useEffect(() => {
    if (uploadStats.isActive && !showProgressModal) {
      setShowProgressModal(true);
    }
  }, [uploadStats.isActive, showProgressModal]);

  const handleFilesSelected = async (files: Array<{
    uri: string;
    fileName: string;
    size: number;
    parentId?: string;
  }>) => {
    try {
      if (!networkStatus.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      await addToQueue(files);
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Show success feedback
      Alert.alert(
        'Files Added to Queue',
        `${files.length} file${files.length > 1 ? 's' : ''} added to upload queue.`,
        [
          {
            text: 'View Progress',
            onPress: () => setShowProgressModal(true)
          },
          {
            text: 'Continue',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Failed to add files to queue:', error);
      Alert.alert(
        'Upload Error',
        'Failed to add files to upload queue. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCloseModal = () => {
    setShowProgressModal(false);
    
    // If no active uploads, close the upload screen
    if (!uploadStats.isActive) {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Upload Files',
          presentation: 'modal',
          headerBackTitle: 'Cancel',
        }} 
      />
      <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Upload Files
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Select files from your device to upload to your drive
            </ThemedText>
          </View>

          {/* Network Status */}
          {!networkStatus.isConnected && (
            <View style={[styles.networkWarning, { backgroundColor: '#FFF3CD' }]}>
              <ThemedText style={[styles.networkWarningText, { color: '#856404' }]}>
                ⚠️ No internet connection. Files will be queued for upload when connection is restored.
              </ThemedText>
            </View>
          )}

          {/* Upload Statistics */}
          {uploadStats.total > 0 && (
            <View style={[
              styles.statsContainer,
              { backgroundColor: Colors[colorScheme ?? 'light'].background }
            ]}>
              <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
                Upload Status
              </ThemedText>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                    {uploadStats.uploading}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Uploading</ThemedText>
                </View>
                
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: '#FF9800' }]}>
                    {uploadStats.pending}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Pending</ThemedText>
                </View>
                
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: '#4CAF50' }]}>
                    {uploadStats.completed}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Completed</ThemedText>
                </View>
                
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: '#F44336' }]}>
                    {uploadStats.failed}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Failed</ThemedText>
                </View>
              </View>

              {uploadStats.totalProgress > 0 && (
                <View style={styles.overallProgress}>
                  <View style={styles.progressHeader}>
                    <ThemedText style={styles.progressLabel}>
                      Overall Progress
                    </ThemedText>
                    <ThemedText style={styles.progressPercentage}>
                      {uploadStats.totalProgress}%
                    </ThemedText>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${uploadStats.totalProgress}%`,
                          backgroundColor: Colors[colorScheme ?? 'light'].tint
                        }
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* File Picker */}
          <FilePicker
            onFilesSelected={handleFilesSelected}
            disabled={!isInitialized}
          />
        </ScrollView>

        {/* Upload Progress Modal */}
        <UploadProgressModal
          visible={showProgressModal}
          onClose={handleCloseModal}
        />

        {/* Floating Upload Indicator */}
        <UploadFloatingIndicator
          onPress={() => setShowProgressModal(true)}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for floating indicator
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    lineHeight: 20,
  },
  networkWarning: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  networkWarningText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  overallProgress: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});