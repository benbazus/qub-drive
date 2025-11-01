import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RecentScreen() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Recent Files',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }} 
      />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Recent Files
          </ThemedText>
          <ThemedText style={styles.description}>
            Recently accessed files and documents
          </ThemedText>
          
          {/* Recent files will be implemented in task 4 */}
          <View style={styles.placeholder}>
            <ThemedText style={styles.placeholderText}>
              Recent files tracking will be implemented with file management
            </ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 32,
  },
  placeholderText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});