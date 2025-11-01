/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CollaborativeDocumentEditor from '../documents/CollaborativeDocumentEditor';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Document } from '../../types/document';
import { CollaborationUser } from '../../types/collaboration';

const CollaborationDemo: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [collaborationEnabled, setCollaborationEnabled] = useState(true);
  const [simulateUsers, setSimulateUsers] = useState(false);

  // Mock document for demo
  const mockDocument: Document = {
    id: 'demo-doc-1',
    title: 'Real-time Collaboration Demo',
    content: '<h1>Welcome to Real-time Collaboration</h1><p>This document demonstrates real-time collaborative editing features including:</p><ul><li>Live cursor tracking</li><li>User presence indicators</li><li>Conflict resolution</li><li>Operational transformation</li></ul><p>Start typing to see collaboration in action!</p>',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: 'user-1',
    version: 1,
    autoSaveEnabled: true,
    permissions: {
      canEdit: true,
      canShare: true,
      canDelete: true,
      canComment: true,
      canExport: true
    }
  };

  // Mock users for simulation
  const mockUsers: CollaborationUser[] = [
    {
      id: 'user-2',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      color: '#FF6B6B',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: 'user-3',
      name: 'Bob Smith',
      email: 'bob@example.com',
      color: '#4ECDC4',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: 'user-4',
      name: 'Carol Davis',
      email: 'carol@example.com',
      color: '#45B7D1',
      isOnline: false,
      lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
    }
  ];

  const collaboration = useCollaboration({
    documentId: mockDocument.id,
    enableRealTimeEditing: collaborationEnabled,
    enableCursors: collaborationEnabled,
    enableSelections: collaborationEnabled,
    onContentChange: (content) => {
      console.log('Content changed:', content.slice(0, 100) + '...');
    },
    onConflict: (conflicts) => {
      Alert.alert(
        'Collaboration Conflicts',
        `${conflicts.length} conflict(s) detected. Please resolve them to continue.`,
        [{ text: 'OK' }]
      );
    }
  });

  useEffect(() => {
    // Simulate user activity when enabled
    if (simulateUsers && collaboration.isInitialized) {
      const interval = setInterval(() => {
        // Simulate cursor movements
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const randomPosition = Math.floor(Math.random() * 500);
        
        collaboration.updateCursor(randomPosition, {
          start: randomPosition,
          end: randomPosition + Math.floor(Math.random() * 20)
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [simulateUsers, collaboration.isInitialized]);

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: string,
    status: 'implemented' | 'demo' | 'testing'
  ) => {
    const statusColors = {
      implemented: '#4CAF50',
      demo: '#FF9500',
      testing: '#2196F3'
    };

    return (
      <View style={styles.featureCard}>
        <View style={styles.featureHeader}>
          <Ionicons name={icon as any} size={24} color={statusColors[status]} />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    );
  };

  const renderConnectionStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>WebSocket Connection:</Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              collaboration.isConnected ? styles.connected : styles.disconnected
            ]}
          />
          <Text style={styles.statusText}>
            {collaboration.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Collaboration:</Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              collaboration.isCollaborating ? styles.active : styles.inactive
            ]}
          />
          <Text style={styles.statusText}>
            {collaboration.isCollaborating ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Online Users:</Text>
        <Text style={styles.statusValue}>
          {collaboration.onlineUsers.length}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Pending Conflicts:</Text>
        <Text style={styles.statusValue}>
          {collaboration.conflicts.length}
        </Text>
      </View>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Enable Collaboration</Text>
        <Switch
          value={collaborationEnabled}
          onValueChange={setCollaborationEnabled}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor={collaborationEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.controlRow}>
        <Text style={styles.controlLabel}>Simulate Users</Text>
        <Switch
          value={simulateUsers}
          onValueChange={setSimulateUsers}
          trackColor={{ false: '#E0E0E0', true: '#FF9500' }}
          thumbColor={simulateUsers ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setSelectedDocument(mockDocument);
          setShowEditor(true);
        }}
      >
        <Ionicons name="document-text" size={20} color="#ffffff" />
        <Text style={styles.actionButtonText}>Open Collaborative Editor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => {
          Alert.alert(
            'Simulate Conflict',
            'This would simulate a document conflict for testing conflict resolution.',
            [{ text: 'OK' }]
          );
        }}
      >
        <Ionicons name="warning" size={20} color="#FF9500" />
        <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>
          Simulate Conflict
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (showEditor && selectedDocument) {
    return (
      <CollaborativeDocumentEditor
        document={selectedDocument}
        enableCollaboration={collaborationEnabled}
        onSave={async (content) => {
          console.log('Document saved:', content.slice(0, 100) + '...');
          Alert.alert('Success', 'Document saved successfully!');
        }}
        onTitleChange={(title) => {
          console.log('Title changed:', title);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Real-time Collaboration Demo</Text>
        <Text style={styles.subtitle}>
          Test and demonstrate collaborative document editing features
        </Text>
      </View>

      {renderConnectionStatus()}
      {renderControls()}

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Implemented Features</Text>
        
        {renderFeatureCard(
          'WebSocket Connection',
          'Real-time bidirectional communication with the server for instant updates',
          'wifi',
          'implemented'
        )}

        {renderFeatureCard(
          'Collaborative Cursors',
          'See other users\' cursor positions and text selections in real-time',
          'locate',
          'implemented'
        )}

        {renderFeatureCard(
          'User Presence',
          'Display online users and their activity status with visual indicators',
          'people',
          'implemented'
        )}

        {renderFeatureCard(
          'Operational Transform',
          'Automatic conflict resolution for simultaneous edits using OT algorithms',
          'git-merge',
          'implemented'
        )}

        {renderFeatureCard(
          'Conflict Resolution',
          'Manual conflict resolution interface for complex editing conflicts',
          'warning',
          'demo'
        )}

        {renderFeatureCard(
          'Document Synchronization',
          'Automatic document sync and version management across all clients',
          'sync',
          'testing'
        )}
      </View>

      <View style={styles.mockUsersContainer}>
        <Text style={styles.sectionTitle}>Mock Collaborators</Text>
        {mockUsers.map(user => (
          <View key={user.id} style={styles.mockUser}>
            <View
              style={[
                styles.userAvatar,
                { backgroundColor: user.color }
              ]}
            >
              <Text style={styles.userInitials}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View
              style={[
                styles.onlineStatus,
                user.isOnline ? styles.online : styles.offline
              ]}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statusContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#FF3B30',
  },
  active: {
    backgroundColor: '#2196F3',
  },
  inactive: {
    backgroundColor: '#9E9E9E',
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  controlsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  featuresContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mockUsersContainer: {
    margin: 16,
    marginBottom: 32,
  },
  mockUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  onlineStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default CollaborationDemo;