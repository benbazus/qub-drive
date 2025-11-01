import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { OfflineFilesScreen } from '../src/components/offline'
import { OfflineFileWithMetadata } from '../src/services/storage/offlineStorage'

export default function OfflineScreen() {
  const handleFilePress = (file: OfflineFileWithMetadata) => {
    // Handle file press - could navigate to file viewer or open file
    console.log('File pressed:', file.originalName)
    // TODO: Implement file opening logic
  }

  const handleFileSelect = (file: OfflineFileWithMetadata) => {
    // Handle file selection in selection mode
    
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Offline Files',
          headerBackTitle: 'Back',
        }} 
      />
      
      <OfflineFilesScreen
        onFilePress={handleFilePress}
        onFileSelect={handleFileSelect}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
})