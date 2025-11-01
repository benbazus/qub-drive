import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Share',
          presentation: 'modal',
          headerBackTitle: 'Cancel',
        }} 
      />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Share File</ThemedText>
        <ThemedText>File ID: {id}</ThemedText>
        <ThemedText style={styles.note}>
          This screen will provide sharing options including link generation and user invitations.
          Implementation will be completed in the sharing task.
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