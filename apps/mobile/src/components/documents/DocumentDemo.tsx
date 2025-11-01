import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DocumentList from './DocumentList';
import DocumentTemplateSelector from './DocumentTemplateSelector';
import { DocumentTemplate } from '../../types/document';
import { useDocuments, useDocumentTemplates, useRecentDocuments } from '../../hooks/useDocuments';

const DocumentDemo: React.FC = () => {
  const router = useRouter();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  
  const { documents } = useDocuments();
  const { recentDocuments } = useRecentDocuments(5);
  const { createFromTemplate } = useDocumentTemplates();

  const handleCreateFromTemplate = async (template: DocumentTemplate, title: string) => {
    try {
      const document = await createFromTemplate(template.id, title);
      
      Alert.alert(
        'Document Created',
        `"${document.title}" has been created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/document/[id]',
                params: { id: document.id }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating document:', error);
      Alert.alert('Error', 'Failed to create document from template');
    }
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
        <Text style={styles.statNumber}>{documents.length}</Text>
        <Text style={styles.statLabel}>Documents</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={24} color="#28a745" />
        <Text style={styles.statNumber}>{recentDocuments.length}</Text>
        <Text style={styles.statLabel}>Recent</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="create-outline" size={24} color="#ffc107" />
        <Text style={styles.statNumber}>10</Text>
        <Text style={styles.statLabel}>Templates</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowTemplateSelector(true)}
        >
          <Ionicons name="add-circle-outline" size={32} color="#4A90E2" />
          <Text style={styles.quickActionText}>New Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            router.push({
              pathname: '/document/[id]',
              params: { 
                id: 'new',
                isNew: 'true',
                title: 'Untitled Document',
                content: ''
              }
            });
          }}
        >
          <Ionicons name="document-outline" size={32} color="#28a745" />
          <Text style={styles.quickActionText}>Blank Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            // Navigate to templates screen
            Alert.alert('Templates', 'Template gallery coming soon!');
          }}
        >
          <Ionicons name="library-outline" size={32} color="#ffc107" />
          <Text style={styles.quickActionText}>Templates</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          All Documents
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
        onPress={() => setActiveTab('recent')}
      >
        <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
          Recent
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowTemplateSelector(true)}
        >
          <Ionicons name="add" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStats()}
        {renderQuickActions()}
        {renderTabBar()}
        
        <View style={styles.documentsContainer}>
          {activeTab === 'all' ? (
            <DocumentList
              showCreateButton={false}
              emptyMessage="No documents found. Create your first document!"
            />
          ) : (
            <DocumentList
              showCreateButton={false}
              emptyMessage="No recent documents"
            />
          )}
        </View>
      </ScrollView>

      <DocumentTemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleCreateFromTemplate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#ffffff',
  },
  documentsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 300,
  },
});

export default DocumentDemo;