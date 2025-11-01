import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { FormBuilderDemo } from '@/components/forms/FormBuilderDemo'
import { Colors } from '@/constants/theme'

export default function FormBuilderDemoScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Form Builder',
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <FormBuilderDemo />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})