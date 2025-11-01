import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native'
import { Colors } from '@/constants/theme'
import { FormBuilder } from './FormBuilder'
import { FormPreview } from './FormPreview'
import { Button } from '@/components/ui/Button'
import { useFormBuilder } from '@/hooks/useFormBuilder'
import { CreateFormRequest } from '@/types/forms'

export const FormBuilderDemo: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false)
  const [currentFormId, setCurrentFormId] = useState<string | undefined>()

  const {
    form,
    createForm,
    loading,
    error,
  } = useFormBuilder(currentFormId)

  const handleCreateNewForm = async () => {
    try {
      const formData: CreateFormRequest = {
        title: 'New Form',
        description: 'A new form created with the mobile form builder',
      }
      
      const newForm = await createForm(formData)
      setCurrentFormId(newForm.id)
      Alert.alert('Success', 'New form created successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to create form. Please try again.')
    }
  }

  const handleSave = () => {
    Alert.alert('Success', 'Form saved successfully!')
  }

  const handlePublish = () => {
    Alert.alert('Success', 'Form published successfully!')
  }

  const handlePreview = () => {
    if (form) {
      setShowPreview(true)
    } else {
      Alert.alert('No Form', 'Please create a form first.')
    }
  }

  const handleFormSubmit = (responses: any) => {
    console.log('Form responses:', responses)
    Alert.alert(
      'Form Submitted',
      `Thank you for your submission!\n\nResponses: ${Object.keys(responses).length} fields completed`,
      [
        { text: 'OK', onPress: () => setShowPreview(false) }
      ]
    )
  }

  if (!currentFormId) {
    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Form Builder Demo</Text>
        <Text style={styles.welcomeDescription}>
          Create interactive forms with drag-and-drop functionality, 
          various field types, and real-time preview.
        </Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.featureItem}>• Drag-and-drop form fields</Text>
          <Text style={styles.featureItem}>• Multiple input types (text, number, date, etc.)</Text>
          <Text style={styles.featureItem}>• Form validation and settings</Text>
          <Text style={styles.featureItem}>• Real-time preview</Text>
          <Text style={styles.featureItem}>• Mobile-optimized interface</Text>
        </View>

        <Button
          title="Create New Form"
          onPress={handleCreateNewForm}
          loading={loading}
          style={styles.createButton}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormBuilder
        formId={currentFormId}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={handlePreview}
      />

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {form && (
          <FormPreview
            form={form}
            onSubmit={handleFormSubmit}
            onClose={() => setShowPreview(false)}
          />
        )}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  welcomeContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
    lineHeight: 22,
  },
  createButton: {
    minWidth: 200,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
})