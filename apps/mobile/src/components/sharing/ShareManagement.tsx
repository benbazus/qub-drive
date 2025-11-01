import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { FileShare, SharePermission } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sharingService } from '@/services/sharingService';

interface ShareManagementProps {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
  onUpdate?: (share: FileShare) => void;
  onError?: (error: string) => void;
}

export const ShareManagement: React.FC<ShareManagementProps> = ({
  visible,
  file,
  onClose,
  onUpdate,
  onError,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  // State
  const [share, setShare] = useState<FileShare | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load share data
  useEffect(() => {
    if (visible && file) {
      loadShareData();
    }
  }, [visible, file]);

  const loadShareData = async () => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      const shareData = await sharingService.getFileSharing(file.id);
      setShare(shareData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load share data';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!share?.shareLink) return;
    
    try {
      await Clipboard.setStringAsync(share.shareLink.url);
      Alert.alert('Success', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShareLink = async () => {
    if (!share?.shareLink || !file) return;
    
    try {
      await Share.share({
        message: `Check out this ${file.type}: ${file.name}`,
        url: share.shareLink.url,
        title: `Share ${file.name}`,
      });
    } catch (error) {
      console.error('Failed to share link:', error);
    }
  };

  const handleToggleLinkActive = async () => {
    if (!share?.shareLink || !file) return;
    
    setIsUpdating(true);
    try {
      if (share.shareLink.isActive) {
        await sharingService.revokeSharingLink(file.id);
      } else {
        await sharingService.createSharingLink(file.id, {
          accessLevel: share.shareLink.accessLevel,
        });
      }
      
      // Reload share data
      await loadShareData();
      onUpdate?.(share);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update link';
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'viewer' | 'editor' | 'owner') => {
    if (!share) return;
    
    setIsUpdating(true);
    try {
      await sharingService.updateUserPermission(share.id, userId, newRole);
      
      // Update local state
      const updatedPermissions = share.permissions.map(permission =>
        permission.userId === userId ? { ...permission, role: newRole } : permission
      );
      const updatedShare = { ...share, permissions: updatedPermissions };
      setShare(updatedShare);
      onUpdate?.(updatedShare);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permission';
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!share) return;
    
    Alert.alert(
      'Remove User',
      `Remove ${userEmail} from this share?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await sharingService.removeUserFromShare(share.id, userId);
              
              // Update local state
              const updatedPermissions = share.permissions.filter(
                permission => permission.userId !== userId
              );
              const updatedShare = { ...share, permissions: updatedPermissions };
              setShare(updatedShare);
              onUpdate?.(updatedShare);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to remove user';
              onError?.(errorMessage);
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleRevokeAllSharing = async () => {
    if (!share) return;
    
    Alert.alert(
      'Revoke All Sharing',
      'This will remove all users and disable the sharing link. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await sharingService.deleteShare(share.id);
              onClose();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to revoke sharing';
              onError?.(errorMessage);
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#FF9500';
      case 'editor':
        return '#34C759';
      case 'viewer':
        return '#007AFF';
      default:
        return iconColor;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!visible || !file) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Manage Sharing</Text>
          <View style={styles.placeholder} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Loading share information...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* File Info */}
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
                  {file.type === 'folder' ? 'Folder' : 'File'}
                </Text>
              </View>
            </View>

            {share ? (
              <>
                {/* Sharing Link */}
                {share.shareLink && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: textColor }]}>
                        Sharing Link
                      </Text>
                      <Switch
                        value={share.shareLink.isActive}
                        onValueChange={handleToggleLinkActive}
                        disabled={isUpdating}
                        trackColor={{ false: `${iconColor}33`, true: `${tintColor}66` }}
                        thumbColor={share.shareLink.isActive ? tintColor : `${iconColor}99`}
                      />
                    </View>

                    {share.shareLink.isActive && (
                      <View style={[styles.linkContainer, { backgroundColor: `${backgroundColor}99` }]}>
                        <View style={styles.linkInfo}>
                          <Text style={[styles.linkUrl, { color: textColor }]} numberOfLines={1}>
                            {share.shareLink.url}
                          </Text>
                          <View style={styles.linkDetails}>
                            <Text style={[styles.linkDetail, { color: iconColor }]}>
                              Access: {share.shareLink.accessLevel}
                            </Text>
                            {share.shareLink.hasPassword && (
                              <Text style={[styles.linkDetail, { color: iconColor }]}>
                                • Password protected
                              </Text>
                            )}
                            {share.shareLink.expiresAt && (
                              <Text style={[styles.linkDetail, { color: iconColor }]}>
                                • Expires {formatDate(share.shareLink.expiresAt)}
                              </Text>
                            )}
                          </View>
                          <Text style={[styles.linkStats, { color: iconColor }]}>
                            {share.shareLink.downloadCount} downloads
                            {share.shareLink.maxDownloads && ` of ${share.shareLink.maxDownloads}`}
                          </Text>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            onPress={handleCopyLink}
                            style={[styles.linkActionButton, { backgroundColor: `${tintColor}26` }]}
                          >
                            <Ionicons name="copy" size={16} color={tintColor} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleShareLink}
                            style={[styles.linkActionButton, { backgroundColor: `${tintColor}26` }]}
                          >
                            <Ionicons name="share" size={16} color={tintColor} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Shared Users */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    People with Access ({share.permissions.length})
                  </Text>

                  {share.permissions.map((permission) => (
                    <View key={permission.id} style={[styles.userItem, { borderBottomColor: `${iconColor}33` }]}>
                      <View style={styles.userInfo}>
                        <View style={[styles.userAvatar, { backgroundColor: getRoleColor(permission.role) }]}>
                          <Text style={styles.userInitial}>
                            {permission.name ? permission.name.charAt(0).toUpperCase() : permission.email.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={[styles.userName, { color: textColor }]}>
                            {permission.name || permission.email}
                          </Text>
                          {permission.name && (
                            <Text style={[styles.userEmail, { color: iconColor }]}>
                              {permission.email}
                            </Text>
                          )}
                          <Text style={[styles.userGranted, { color: iconColor }]}>
                            Added {formatDate(permission.grantedAt)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.userActions}>
                        {/* Role Selector */}
                        <View style={styles.roleSelector}>
                          {(['viewer', 'editor', 'owner'] as const).map((role) => (
                            <TouchableOpacity
                              key={role}
                              style={[
                                styles.roleOption,
                                permission.role === role && { backgroundColor: getRoleColor(role) + '33' }
                              ]}
                              onPress={() => handleUpdateUserRole(permission.userId, role)}
                              disabled={isUpdating || permission.role === 'owner'}
                            >
                              <Text style={[
                                styles.roleOptionText,
                                { color: permission.role === role ? getRoleColor(role) : textColor }
                              ]}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        
                        {/* Remove User */}
                        {permission.role !== 'owner' && (
                          <TouchableOpacity
                            onPress={() => handleRemoveUser(permission.userId, permission.email)}
                            style={styles.removeUserButton}
                            disabled={isUpdating}
                          >
                            <Ionicons name="close-circle" size={20} color="#F44336" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: '#F44336' }]}>
                    Danger Zone
                  </Text>
                  <TouchableOpacity
                    onPress={handleRevokeAllSharing}
                    style={[styles.dangerButton, { borderColor: '#F44336' }]}
                    disabled={isUpdating}
                  >
                    <Ionicons name="warning" size={20} color="#F44336" />
                    <Text style={[styles.dangerButtonText, { color: '#F44336' }]}>
                      Revoke All Sharing
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noShareContainer}>
                <Ionicons name="share-outline" size={48} color={`${iconColor}66`} />
                <Text style={[styles.noShareText, { color: textColor }]}>
                  This file is not shared
                </Text>
                <Text style={[styles.noShareSubtext, { color: iconColor }]}>
                  Use the share button to start sharing this file
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Loading Overlay */}
        {isUpdating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={tintColor} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  linkDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  linkDetail: {
    fontSize: 12,
    marginRight: 8,
  },
  linkStats: {
    fontSize: 12,
  },
  linkActions: {
    flexDirection: 'row',
  },
  linkActionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userGranted: {
    fontSize: 12,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roleOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeUserButton: {
    padding: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  noShareContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  noShareText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noShareSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});