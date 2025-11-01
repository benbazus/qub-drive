import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `File Details`,
          headerBackTitle: 'Back',
        }} 
      />
      <ThemedView style={styles.container}>
        <ThemedText type="title">File Details</ThemedText>
        <ThemedText>File ID: {id}</ThemedText>
        <ThemedText style={styles.note}>
          This screen will show file details, preview, and actions like share, download, etc.
          Implementation will be completed in the file management task.
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  note: {
    marginTop: 16,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});