import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DocumentTemplateSelector } from '../../src/components/documents';
import { DocumentTemplate } from '../../src/types/document';
import { useDocumentTemplates } from '../../src/hooks/useDocuments';

export default function CreateDocumentScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { createFromTemplate } = useDocumentTemplates();
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = async (template: DocumentTemplate, title: string) => {
    setIsCreating(true);
    
    try {
      let document;
      
      if (template.id === 'blank') {
        // Create blank document
        document = await createFromTemplate('blank', title, folderId);
      } else {
        // Create from template
        document = await createFromTemplate(template.id, title, folderId);
      }
      
      // Navigate to the new document
      router.replace({
        pathname: '/document/[id]',
        params: { id: document.id }
      });
    } catch (error) {
      console.error('Error creating document:', error);
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <DocumentTemplateSelector
        visible={true}
        onClose={handleClose}
        onSelectTemplate={handleSelectTemplate}
        folderId={folderId || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});