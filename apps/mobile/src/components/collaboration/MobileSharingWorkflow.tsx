import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { FileShare } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSharing } from '@/hooks/useSharing';
import { ShareDialog } from '../sharing/ShareDialog';
import { ShareManagement } from '../sharing/ShareManagement';
import { PermissionManager } from './PermissionManager';
import { CollaborationStatus } from './CollaborationStatus';

interface MobileSharingWorkflowProps {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

type WorkflowStep = 'main' | 'share' | 'manage' | 'permissions';

export const MobileSharingWorkflow: React.FC<MobileSharingWorkflowProps> = ({
  visible,
  file,
  onClose,
  onSuccess,
  onError,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('main');
  const [currentShare, setCurrentShare] = useState<FileShare | null>(null);

  const {
    isLoading,
    shareViaLink,
    quickShare,
    getFileSharing,
  } = useSharing({
    onSuccess: onSuccess || (() => {}),
    onError: onError || (() => {}),
  });

  React.useEffect(() => {
    if (visible && file) {
      loadShareData();
    }
  }, [visible, file, loadShareData]);

  const loadShareData = async () => {
    if (!file) return;
    
    try {
      const share = await getFileSharing(file.id);
      setCurrentShare(share);
    } catch (error) {
      // File might not be shared yet
      setCurrentShare(null);
    }
  };

  const handleQuickActions = () => {
    if (!file) return;

    const options = [
      'Share Link',
      'Invite People',
      'Quick Share',
      'Cancel'
    ];

    const actions = [
      () => handleShareViaLink(),
      () => setCurrentStep('share'),
      () => quickShare(file),
      () => {},
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: `Share "${file.name}"`,
        },
        (buttonIndex) => {
          if (buttonIndex < actions.length - 1) {
            actions[buttonIndex]();
          }
        }
      );
    } else {
      // Android fallback - show alert
      Alert.alert(
        `Share "${file.name}"`,
        'Choose how you want to share this file:',
        [
          { text: 'Share Link', onPress: actions[0] },
          { text: 'Invite People', onPress: actions[1] },
          { text: 'Quick Share', onPress: actions[2] },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleShareViaLink = async () => {
    if (!file) return;
    
    try {
      await shareViaLink(file);
      await loadShareData(); // Refresh share data
    } catch (error) {
      // Error handled by useSharing hook
    }
  };

  const handleShareSuccess = async (share: FileShare) => {
    setCurrentShare(share);
    setCurrentStep('main');
    onSuccess?.('File shared successfully');
    await loadShareData(); // Refresh share data
  };

  const handleShareUpdate = async (share: FileShare) => {
    setCurrentShare(share);
    await loadShareData(); // Refresh share data
  };

  const renderMainWorkflow = () => (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Sharing</Text>
        <TouchableOpacity
          onPress={handleQuickActions}
          style={styles.quickActionButton}
        >
          <Ionicons name="flash" size={20} color={tintColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* File Info */}
        {file && (
          <View style={[styles.fileInfo, { backgroundColor: `${tintColor}1A` }]}>
            <Ionicons
              name={file.type === 'folder' ? 'folder' : 'document'}
              size={24}
              color={tintColor}
            />
            <View style={styles.fileDetails}>
              <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={[styles.fileType, { color: iconColor }]}>
                {file.type === 'folder' ? 'Folder' : 'File'} • {file.size || 'Unknown size'}
              </Text>
            </View>
          </View>
        )}

        {/* Collaboration Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Current Status
          </Text>
          <CollaborationStatus share={currentShare} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Actions
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${tintColor}1A` }]}
            onPress={() => setCurrentStep('share')}
          >
            <View style={[styles.actionIcon, { backgroundColor: tintColor }]}>
              <Ionicons name="person-add" size={20} color="white" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: textColor }]}>
                Invite People
              </Text>
              <Text style={[styles.actionDescription, { color: iconColor }]}>
                Share with specific users via email
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${tintColor}1A` }]}
            onPress={handleShareViaLink}
            disabled={isLoading}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="link" size={20} color="white" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: textColor }]}>
                Create Link
              </Text>
              <Text style={[styles.actionDescription, { color: iconColor }]}>
                Generate a shareable link
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${tintColor}1A` }]}
            onPress={() => {
          if (file) {
            quickShare(file);
          }
        }}
            disabled={isLoading}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="share" size={20} color="white" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: textColor }]}>
                Quick Share
              </Text>
              <Text style={[styles.actionDescription, { color: iconColor }]}>
                Share via system share sheet
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Management Actions */}
        {currentShare && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Manage Sharing
            </Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${iconColor}1A` }]}
              onPress={() => setCurrentStep('permissions')}
            >
              <View style={[styles.actionIcon, { backgroundColor: iconColor }]}>
                <Ionicons name="settings" size={20} color="white" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: textColor }]}>
                  Manage Permissions
                </Text>
                <Text style={[styles.actionDescription, { color: iconColor }]}>
                  Control who can access and edit
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${iconColor}1A` }]}
              onPress={() => setCurrentStep('manage')}
            >
              <View style={[styles.actionIcon, { backgroundColor: iconColor }]}>
                <Ionicons name="list" size={20} color="white" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: textColor }]}>
                  View Details
                </Text>
                <Text style={[styles.actionDescription, { color: iconColor }]}>
                  See sharing history and analytics
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={iconColor} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  if (!visible || !file) return null;

  return (
    <>
      {/* Main Workflow */}
      <Modal
        visible={currentStep === 'main'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        {renderMainWorkflow()}
      </Modal>

      {/* Share Dialog */}
      <ShareDialog
        visible={currentStep === 'share'}
        file={file}
        onClose={() => setCurrentStep('main')}
        onSuccess={handleShareSuccess}
        onError={onError || (() => {})}
      />

      {/* Share Management */}
      <ShareManagement
        visible={currentStep === 'manage'}
        file={file}
        onClose={() => setCurrentStep('main')}
        onUpdate={handleShareUpdate}
        onError={onError || (() => {})}
      />

      {/* Permission Manager */}
      <PermissionManager
        visible={currentStep === 'permissions'}
        share={currentShare}
        onClose={() => setCurrentStep('main')}
        onUpdate={handleShareUpdate}
        onError={onError || (() => {})}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
});