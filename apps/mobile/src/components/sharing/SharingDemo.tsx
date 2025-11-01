import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { FileShare } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSharing } from '@/hooks/useSharing';
import { ShareDialog } from './ShareDialog';
import { ShareManagement } from './ShareManagement';

export const SharingDemo: React.FC = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  // Demo state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Demo files
  const demoFiles: FileItem[] = [
    {
      id: '1',
      name: 'Project Proposal.pdf',
      type: 'file',
      size: 2048576,
      mimeType: 'application/pdf',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isShared: false,
      isStarred: false,
      canShare: true,
    },
    {
      id: '2',
      name: 'Team Photos',
      type: 'folder',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      isShared: true,
      isStarred: true,
      canShare: true,
    },
    {
      id: '3',
      name: 'Budget Spreadsheet.xlsx',
      type: 'file',
      size: 1024000,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      createdAt: '2024-01-12T14:20:00Z',
      updatedAt: '2024-01-18T11:45:00Z',
      isShared: true,
      isStarred: false,
      canShare: true,
    },
  ];

  const sharing = useSharing({
    onSuccess: (message) => Alert.alert('Success', message),
    onError: (error) => Alert.alert('Error', error),
  });

  const handleShareFile = (file: FileItem) => {
    setSelectedFile(file);
    setShowShareDialog(true);
  };

  const handleManageSharing = (file: FileItem) => {
    setSelectedFile(file);
    setShowManagement(true);
  };

  const handleQuickShare = async (file: FileItem) => {
    try {
      await sharing.shareViaLink(file);
    } catch (error) {
      console.error('Quick share failed:', error);
    }
  };

  const handleShareSuccess = (share: FileShare) => {
    Alert.alert('Success', `Successfully shared "${selectedFile?.name}"`);
    setShowShareDialog(false);
  };

  const handleShareError = (error: string) => {
    Alert.alert('Error', error);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            File Sharing Demo
          </Text>
          <Text style={[styles.subtitle, { color: iconColor }]}>
            Demonstrate sharing functionality with sample files
          </Text>
        </View>

        {/* Demo Files */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Sample Files
          </Text>
          
          {demoFiles.map((file) => (
            <View key={file.id} style={[styles.fileItem, { borderColor: `${iconColor}33` }]}>
              <View style={styles.fileInfo}>
                <View style={[styles.fileIcon, { backgroundColor: `${tintColor}26` }]}>
                  <Ionicons
                    name={file.type === 'folder' ? 'folder' : 'document'}
                    size={24}
                    color={tintColor}
                  />
                </View>
                
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <View style={styles.fileMetadata}>
                    <Text style={[styles.fileSize, { color: iconColor }]}>
                      {file.type === 'file' && file.size ? formatFileSize(file.size) : 'Folder'}
                    </Text>
                    {file.isShared && (
                      <>
                        <Text style={[styles.separator, { color: iconColor }]}>•</Text>
                        <Text style={[styles.sharedIndicator, { color: '#4CAF50' }]}>
                          Shared
                        </Text>
                      </>
                    )}
                    {file.isStarred && (
                      <>
                        <Text style={[styles.separator, { color: iconColor }]}>•</Text>
                        <Ionicons name="star" size={12} color="#FFD700" />
                      </>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${tintColor}26` }]}
                  onPress={() => handleQuickShare(file)}
                >
                  <Ionicons name="share" size={16} color={tintColor} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${tintColor}26` }]}
                  onPress={() => handleShareFile(file)}
                >
                  <Ionicons name="people" size={16} color={tintColor} />
                </TouchableOpacity>
                
                {file.isShared && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${iconColor}26` }]}
                    onPress={() => handleManageSharing(file)}
                  >
                    <Ionicons name="settings" size={16} color={iconColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Sharing Actions
          </Text>
          
          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: tintColor }]}
            onPress={() => handleShareFile(demoFiles[0])}
          >
            <Ionicons name="share" size={20} color="white" />
            <Text style={styles.demoButtonText}>Open Share Dialog</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleManageSharing(demoFiles[1])}
          >
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.demoButtonText}>Manage Sharing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: '#FF9500' }]}
            onPress={() => handleQuickShare(demoFiles[2])}
          >
            <Ionicons name="link" size={20} color="white" />
            <Text style={styles.demoButtonText}>Quick Share Link</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Implemented Features
          </Text>
          
          {[
            'Share dialog with permission settings',
            'Link generation and sharing',
            'User invitation and email sharing',
            'Share management interface',
            'Permission management (viewer/editor/owner)',
            'Link access control and security',
            'Share analytics and activity tracking',
            'Bulk sharing operations',
            'Native share integration',
            'Email validation and user search',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={[styles.featureText, { color: textColor }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Share Dialog */}
      <ShareDialog
        visible={showShareDialog}
        file={selectedFile}
        onClose={() => setShowShareDialog(false)}
        onSuccess={handleShareSuccess}
        onError={handleShareError}
      />

      {/* Share Management */}
      <ShareManagement
        visible={showManagement}
        file={selectedFile}
        onClose={() => setShowManagement(false)}
        onError={handleShareError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 14,
  },
  separator: {
    fontSize: 14,
    marginHorizontal: 6,
  },
  sharedIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});