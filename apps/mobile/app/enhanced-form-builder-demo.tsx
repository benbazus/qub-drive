import React from 'react'
import { View, StyleSheet } from 'react-native'
import { EnhancedFormBuilder } from '@/components/forms'
import { Colors } from '@/constants/theme'

export default function EnhancedFormBuilderDemo() {
  const handleSave = () => {
    console.log('Form saved')
  }

  const handlePublish = () => {
    console.log('Form published')
  }

  const handlePreview = () => {
    console.log('Form preview toggled')
  }

  return (
    <View style={styles.container}>
      <EnhancedFormBuilder
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})