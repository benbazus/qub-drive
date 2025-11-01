import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { 
  FormManagementDashboard,
  FormSharingManager,
  FormAnalytics,
  FormResponseCollector,
} from '@/components/forms'
import type { Form } from '@/types/forms'

// Mock form data for demonstration
const mockForm: Form = {
  id: 'demo-form-1',
  documentId: 'doc-1',
  title: 'Customer Feedback Survey',
  description: 'Help us improve our services by sharing your feedback',
  sections: [
    {
      id: 'section-1',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      fields: [
        {
          id: 'field-1',
          fieldType: 'ShortText' as any,
          label: 'Full Name',
          required: true,
          order: 0,
          options: [],
          properties: {
            width: 'Full' as any,
            alignment: 'Left' as any,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
          conditions: [],
        },
        {
          id: 'field-2',
          fieldType: 'Email' as any,
          label: 'Email Address',
          required: true,
          order: 1,
          options: [],
          properties: {
            width: 'Full' as any,
            alignment: 'Left' as any,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
          },
          conditions: [],
        },
      ],
      order: 0,
      isRepeatable: false,
      conditions: [],
    },
    {
      id: 'section-2',
      title: 'Feedback',
      description: 'Rate your experience',
      fields: [
        {
          id: 'field-3',
          fieldType: 'LinearScale' as any,
          label: 'Overall Satisfaction',
          required: true,
          order: 0,
          options: [],
          properties: {
            width: 'Full' as any,
            alignment: 'Left' as any,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
            scaleMin: 1,
            scaleMax: 5,
            scaleMinLabel: 'Very Dissatisfied',
            scaleMaxLabel: 'Very Satisfied',
          },
          conditions: [],
        },
        {
          id: 'field-4',
          fieldType: 'LongText' as any,
          label: 'Additional Comments',
          required: false,
          order: 1,
          options: [],
          properties: {
            width: 'Full' as any,
            alignment: 'Left' as any,
            showTime: false,
            shuffleOptions: false,
            allowOther: false,
            rows: 4,
          },
          conditions: [],
        },
      ],
      order: 1,
      isRepeatable: false,
      conditions: [],
    },
  ],
  settings: {
    collectEmails: true,
    requireSignIn: false,
    allowMultipleResponses: false,
    allowResponseEditing: true,
    showProgressBar: true,
    showLinkToSubmitAnother: false,
    confirmationMessage: 'Thank you for your feedback!',
    notificationSettings: {
      notifyOnResponse: true,
      notificationEmails: ['admin@example.com'],
    },
    privacySettings: {
      collectIpAddresses: false,
      collectUserAgent: false,
      collectLocation: false,
      gdprCompliant: true,
    },
  },
  branding: {
    theme: 'Default' as any,
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#1a73e8',
    backgroundColor: '#ffffff',
  },
  status: 'Published' as any,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
}

export default function FormManagementDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const demos = [
    {
      id: 'dashboard',
      title: 'Form Management Dashboard',
      description: 'Complete form management with sharing, analytics, and responses',
      icon: 'grid' as const,
      color: '#1a73e8',
    },
    {
      id: 'sharing',
      title: 'Form Sharing Manager',
      description: 'Share forms with public links, permissions, and settings',
      icon: 'share' as const,
      color: '#10b981',
    },
    {
      id: 'analytics',
      title: 'Form Analytics',
      description: 'View response analytics, export data, and track performance',
      icon: 'analytics' as const,
      color: '#f59e0b',
    },
    {
      id: 'responses',
      title: 'Response Collection',
      description: 'Collect and manage form responses with validation',
      icon: 'document-text' as const,
      color: '#ef4444',
    },
  ]

  const handleDemoSelect = (demoId: string) => {
    setActiveDemo(demoId)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setActiveDemo(null)
  }

  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'dashboard':
        return (
          <FormManagementDashboard
            onFormSelect={(form) => {
              Alert.alert('Form Selected', `Selected: ${form.title}`)
            }}
            onFormEdit={(form) => {
              Alert.alert('Edit Form', `Editing: ${form.title}`)
            }}
            onFormCreate={() => {
              Alert.alert('Create Form', 'Create new form functionality')
            }}
          />
        )
      case 'sharing':
        return (
          <FormSharingManager
            form={mockForm}
            onClose={handleCloseModal}
            onFormUpdate={(form) => {
              Alert.alert('Form Updated', `Updated: ${form.title}`)
            }}
          />
        )
      case 'analytics':
        return (
          <FormAnalytics
            form={mockForm}
            onClose={handleCloseModal}
          />
        )
      case 'responses':
        return (
          <FormResponseCollector
            form={mockForm}
            onCancel={handleCloseModal}
            onSubmit={(response) => {
              Alert.alert('Response Submitted', `Response ID: ${response.id}`)
              handleCloseModal()
            }}
            onSaveDraft={(response) => {
              Alert.alert('Draft Saved', `Draft ID: ${response.id}`)
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Form Management Demo',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Form Management Features</Text>
        <Text style={styles.subtitle}>
          Explore form sharing, response collection, and analytics
        </Text>
      </View>

      <View style={styles.content}>
        {demos.map((demo) => (
          <TouchableOpacity
            key={demo.id}
            style={[styles.demoCard, { borderLeftColor: demo.color }]}
            onPress={() => handleDemoSelect(demo.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: demo.color + '20' }]}>
              <Ionicons name={demo.icon} size={24} color={demo.color} />
            </View>
            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>{demo.title}</Text>
              <Text style={styles.demoDescription}>{demo.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          These demos showcase the form management capabilities implemented for task 9.2
        </Text>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {demos.find(d => d.id === activeDemo)?.title}
            </Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {renderDemoContent()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  demoInfo: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  demoDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault + '20',
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
})