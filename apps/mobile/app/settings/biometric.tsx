import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import { BiometricSettings } from '@/components/BiometricSettings'
import { Colors } from '@/constants/theme'
import { IconSymbol } from '@/components/ui/icon-symbol'

export default function BiometricSettingsScreen() {
  const handleBack = () => {
    router.back()
  }

  const handleSettingsChange = (enabled: boolean) => {
    // Optional: Handle settings change callback
    console.log('Biometric settings changed:', enabled)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <BiometricSettings onSettingsChange={handleSettingsChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
})