import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DocumentEditor } from '../../src/components/documents';

export default function DocumentScreen() {
  const { id, isNew, title, content, folderId } = useLocalSearchParams<{ 
    id: string;
    isNew?: string;
    title?: string;
    content?: string;
    folderId?: string;
  }>();

  const isNewDocument = isNew === 'true';

  return (
    <DocumentEditor
      documentId={isNewDocument ? undefined : id}
      isNew={isNewDocument}
      initialTitle={title}
      initialContent={content}
      folderId={folderId}
      autoSaveInterval={30000}
      showToolbar={true}
      showCollaborators={false}
      onSave={async (content: string) => {
        // Default save handler - will be handled by DocumentEditor internally
        console.log('Document saved with content length:', content.length);
      }}
      onTitleChange={(newTitle: string) => {
        // Default title change handler
        
      }}
    />
  );
}