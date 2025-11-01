import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { Form, FormStatus } from '@/types/forms'
import { Button } from '@/components/ui/Button'

interface FormBuilderToolbarProps {
  form: Form | null
  previewMode: boolean
  unsavedChanges: boolean
  loading: boolean
  onSave: () => void
  onPublish: () => void
  onPreview: () => void
  onShare: () => void
  onToggleFieldPalette: () => void
  onTogglePropertiesPanel: () => void
  showFieldPalette: boolean
  showPropertiesPanel: boolean
}

export const FormBuilderToolbar: React.FC<FormBuilderToolbarProps> = ({
  form,
  previewMode,
  unsavedChanges,
  loading,
  onSave,
  onPublish,
  onPreview,
  onShare,
  onToggleFieldPalette,
  onTogglePropertiesPanel,
  showFieldPalette,
  showPropertiesPanel,
}) => {
  const canPublish = form?.status === FormStatus.Draft || form?.status === FormStatus.Paused
  const isPublished = form?.status === FormStatus.Published

  return (
    <View style={styles.container}>
      {/* Left Section - Form Info */}
      <View style={styles.leftSection}>
        <View style={styles.formInfo}>
          <Text style={styles.formTitle} numberOfLines={1}>
            {form?.title || 'Untitled Form'}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles[`status${form?.status || 'Draft'}`]]} />
            <Text style={styles.statusText}>{form?.status || 'Draft'}</Text>
            {unsavedChanges && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.unsavedText}>Unsaved changes</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Center Section - View Controls */}
      <View style={styles.centerSection}>
        <TouchableOpacity
          style={[styles.viewButton, showFieldPalette && styles.activeViewButton]}
          onPress={onToggleFieldPalette}
          accessibilityLabel="Toggle field palette"
        >
          <Ionicons
            name="library-outline"
            size={20}
            color={showFieldPalette ? Colors.light.background : Colors.light.tabIconDefault}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, previewMode && styles.activeViewButton]}
          onPress={onPreview}
          accessibilityLabel={previewMode ? 'Exit preview' : 'Preview form'}
        >
          <Ionicons
            name={previewMode ? 'create-outline' : 'eye-outline'}
            size={20}
            color={previewMode ? Colors.light.background : Colors.light.tabIconDefault}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, showPropertiesPanel && styles.activeViewButton]}
          onPress={onTogglePropertiesPanel}
          accessibilityLabel="Toggle properties panel"
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={showPropertiesPanel ? Colors.light.background : Colors.light.tabIconDefault}
          />
        </TouchableOpacity>
      </View>

      {/* Right Section - Actions */}
      <View style={styles.rightSection}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.light.tint}
            style={styles.loadingIndicator}
          />
        )}

        <Button
          title="Save"
          onPress={onSave}
          variant="outline"
          size="small"
          disabled={loading || !unsavedChanges}
          style={styles.actionButton}
        />

        {isPublished && (
          <Button
            title="Share"
            onPress={onShare}
            variant="outline"
            size="small"
            disabled={loading}
            style={styles.actionButton}
          />
        )}

        <Button
          title={canPublish ? 'Publish' : 'Update'}
          onPress={onPublish}
          variant="primary"
          size="small"
          disabled={loading || !form}
          style={styles.actionButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
    minHeight: 64,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDraft: {
    backgroundColor: Colors.light.tabIconDefault,
  },
  statusPublished: {
    backgroundColor: '#10b981',
  },
  statusPaused: {
    backgroundColor: '#f59e0b',
  },
  statusClosed: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginHorizontal: 6,
  },
  unsavedText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: Colors.light.tabIconDefault + '10',
  },
  activeViewButton: {
    backgroundColor: Colors.light.tint,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginRight: 12,
  },
  actionButton: {
    marginLeft: 8,
    minWidth: 80,
  },
})