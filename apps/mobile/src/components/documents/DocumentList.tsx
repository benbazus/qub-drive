import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Document } from '../../types/document';
import { useDocuments } from '../../hooks/useDocuments';

interface DocumentListProps {
  folderId?: string;
  onDocumentPress?: (document: Document) => void;
  showCreateButton?: boolean;
  emptyMessage?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({
  folderId,
  onDocumentPress,
  showCreateButton = true,
  emptyMessage = 'No documents found'
}) => {
  const router = useRouter();
  const { documents, isLoading, error, refetch, deleteDocument, isDeleting } = useDocuments(folderId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDocumentPress = (document: Document) => {
    if (onDocumentPress) {
      onDocumentPress(document);
    } else {
      router.push({
        pathname: '/document/[id]',
        params: { id: document.id }
      });
    }
  };

  const handleCreateDocument = () => {
    router.push({
      pathname: '/document/create',
      params: folderId ? { folderId } : {}
    });
  };

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(document.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderDocumentItem = ({ item: document }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleDocumentPress(document)}
    >
      <View style={styles.documentIcon}>
        <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.documentDate}>
          Modified {formatDate(document.updatedAt)}
        </Text>
        {document.collaborators && document.collaborators.length > 0 && (
          <View style={styles.collaboratorsInfo}>
            <Ionicons name="people-outline" size={12} color="#666" />
            <Text style={styles.collaboratorsText}>
              {document.collaborators.length} collaborator{document.collaborators.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleDeleteDocument(document)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc3545" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      {showCreateButton && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateDocument}>
          <Text style={styles.createButtonText}>Create Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => {
    if (!showCreateButton) return null;
    
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.createDocumentButton} onPress={handleCreateDocument}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createDocumentButtonText}>New Document</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
        <Text style={styles.errorTitle}>Error Loading Documents</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90E2']}
          />
        }
        contentContainerStyle={documents.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
      
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.deletingText}>Deleting document...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  createDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createDocumentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  collaboratorsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collaboratorsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  moreButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
});

export default DocumentList;