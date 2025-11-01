import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,

  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentTemplate, DocumentTemplateType } from '../../types/document';
import { TEMPLATE_CATEGORIES, getTemplatesByCategory } from '../../constants/documentTemplates';

interface DocumentTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocumentTemplate, title: string) => void;
  folderId?: string;
}

const DocumentTemplateSelector: React.FC<DocumentTemplateSelectorProps> = ({
  visible,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  // Removed unused dimensions

  useEffect(() => {
    if (visible) {
      setSelectedCategory('General');
      setSelectedTemplate(null);
      setDocumentTitle('');
      setShowTitleInput(false);
    }
  }, [visible]);

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDocumentTitle(template.name === 'Blank Document' ? 'Untitled Document' : template.name);
    setShowTitleInput(true);
  };

  const handleCreateDocument = () => {
    if (!selectedTemplate) return;
    
    if (!documentTitle.trim()) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    onSelectTemplate(selectedTemplate, documentTitle.trim());
    onClose();
  };

  const handleCancel = () => {
    if (showTitleInput) {
      setShowTitleInput(false);
      setSelectedTemplate(null);
      setDocumentTitle('');
    } else {
      onClose();
    }
  };

  const renderTemplateGrid = () => {
    const templates = getTemplatesByCategory(selectedCategory);
    
    return (
      <ScrollView style={styles.templateGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.templatesContainer}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate?.id === template.id && styles.selectedTemplateCard
              ]}
              onPress={() => handleTemplateSelect(template)}
            >
              <View style={styles.templateIcon}>
                <Ionicons 
                  name={getTemplateIcon(template.type)} 
                  size={32} 
                  color="#4A90E2" 
                />
              </View>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {template.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTitleInput = () => (
    <View style={styles.titleInputContainer}>
      <View style={styles.selectedTemplateInfo}>
        <Ionicons 
          name={getTemplateIcon(selectedTemplate!.type)} 
          size={24} 
          color="#4A90E2" 
        />
        <Text style={styles.selectedTemplateName}>{selectedTemplate!.name}</Text>
      </View>
      
      <Text style={styles.titleLabel}>Document Title</Text>
      <TextInput
        style={styles.titleInput}
        value={documentTitle}
        onChangeText={setDocumentTitle}
        placeholder="Enter document title"
        autoFocus
        selectTextOnFocus
      />
      
      <View style={styles.titleInputActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateDocument}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {showTitleInput ? 'Create Document' : 'Choose Template'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {showTitleInput ? (
          renderTitleInput()
        ) : (
          <>
            {/* Category Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabs}
              contentContainerStyle={styles.categoryTabsContent}
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.selectedCategoryTab
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === category && styles.selectedCategoryTabText
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Template Grid */}
            {renderTemplateGrid()}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const getTemplateIcon = (type: DocumentTemplateType): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<DocumentTemplateType, keyof typeof Ionicons.glyphMap> = {
    'blank': 'document-outline',
    'meeting-notes': 'people-outline',
    'project-plan': 'calendar-outline',
    'report': 'bar-chart-outline',
    'memo': 'mail-outline',
    'letter': 'mail-open-outline',
    'proposal': 'briefcase-outline',
    'checklist': 'checkmark-circle-outline',
    'article': 'newspaper-outline',
    'resume': 'person-outline'
  };
  
  return iconMap[type] || 'document-outline';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  categoryTabs: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  selectedCategoryTab: {
    backgroundColor: '#4A90E2',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCategoryTabText: {
    color: '#ffffff',
  },
  templateGrid: {
    flex: 1,
    padding: 16,
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  selectedTemplateCard: {
    borderColor: '#4A90E2',
    backgroundColor: '#f8fcff',
  },
  templateIcon: {
    marginBottom: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  titleInputContainer: {
    flex: 1,
    padding: 24,
  },
  selectedTemplateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fcff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  selectedTemplateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  titleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  titleInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DocumentTemplateSelector;