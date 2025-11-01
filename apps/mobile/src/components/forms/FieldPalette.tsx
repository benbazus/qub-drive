import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import type { FormFieldTemplate, FormFieldType } from '@/types/forms'

interface FieldPaletteProps {
  fieldTemplates: FormFieldTemplate[]
  onFieldSelect: (fieldType: FormFieldType) => void
  onFieldDragStart?: (template: FormFieldTemplate) => void
  onFieldDragEnd?: () => void
}

export const FieldPalette: React.FC<FieldPaletteProps> = ({
  fieldTemplates,
  onFieldSelect,
  onFieldDragStart,
  onFieldDragEnd,
}) => {
  const fieldCategories = [
    {
      title: 'Text Fields',
      fields: fieldTemplates.filter(t => 
        [FormFieldType.ShortText, FormFieldType.LongText, FormFieldType.Email, FormFieldType.Phone].includes(t.fieldType)
      ),
    },
    {
      title: 'Numbers & Dates',
      fields: fieldTemplates.filter(t => 
        [FormFieldType.Number, FormFieldType.Date, FormFieldType.Time].includes(t.fieldType)
      ),
    },
    {
      title: 'Selection',
      fields: fieldTemplates.filter(t => 
        [FormFieldType.Dropdown, FormFieldType.MultipleChoice, FormFieldType.Checkboxes, FormFieldType.LinearScale].includes(t.fieldType)
      ),
    },
    {
      title: 'Media',
      fields: fieldTemplates.filter(t => 
        [FormFieldType.FileUpload, FormFieldType.ImageUpload].includes(t.fieldType)
      ),
    },
    {
      title: 'Layout',
      fields: fieldTemplates.filter(t => 
        [FormFieldType.SectionBreak].includes(t.fieldType)
      ),
    },
  ]

  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'text-fields': 'text',
      'subject': 'document-text',
      'email': 'mail',
      'phone': 'call',
      'looks-one': 'calculator',
      'event': 'calendar',
      'access-time': 'time',
      'arrow-drop-down': 'chevron-down',
      'radio-button-checked': 'radio-button-on',
      'check-box': 'checkbox',
      'linear-scale': 'stats-chart',
      'cloud-upload': 'cloud-upload',
      'image': 'image',
      'horizontal-rule': 'remove',
    }
    return iconMap[iconName] || 'help-circle'
  }

  const renderFieldTemplate = (template: FormFieldTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={styles.fieldTemplate}
      onPress={() => onFieldSelect(template.fieldType)}
      onLongPress={() => onFieldDragStart?.(template)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Add ${template.name} field`}
      accessibilityHint={template.description}
    >
      <View style={styles.fieldIcon}>
        <Ionicons
          name={getIconName(template.icon)}
          size={20}
          color={Colors.light.tint}
        />
      </View>
      <View style={styles.fieldInfo}>
        <Text style={styles.fieldName}>{template.name}</Text>
        <Text style={styles.fieldDescription} numberOfLines={2}>
          {template.description}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Fields</Text>
        <Text style={styles.subtitle}>Tap to add or long press to drag</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {fieldCategories.map(category => (
          <View key={category.title} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.categoryFields}>
              {category.fields.map(renderFieldTemplate)}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  scrollView: {
    flex: 1,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  categoryFields: {
    paddingHorizontal: 16,
  },
  fieldTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '20',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  fieldDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 18,
  },
})