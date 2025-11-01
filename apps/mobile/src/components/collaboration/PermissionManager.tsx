import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FileShare, SharePermission } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sharingService } from '@/services/sharingService';

interface PermissionManagerProps {
  visible: boolean;
  share: FileShare | null;
  onClose: () => void;
  onUpdate?: (share: FileShare) => void;
  onError?: (error: string) => void;
}

interface PermissionItemProps {
  permission: SharePermission;
  isOwner: boolean;
  onRoleChange: (userId: string, role: 'viewer' | 'editor' | 'owner') => void;
  onRemove: (userId: string, email: string) => void;
  isUpdating: boolean;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  permission,
  isOwner: _isOwner,
  onRoleChange,
  onRemove,
  isUpdating,
}) => {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const handleRolePress = () => {
    if (permission.role === 'owner' || isUpdating) return;
    setShowRoleMenu(true);
  };

  const handleRoleSelect = (role: 'viewer' | 'editor' | 'owner') => {
    setShowRoleMenu(false);
    if (role !== permission.role) {
      onRoleChange(permission.userId, role);
    }
  };

  const handleRemove = () => {
    if (permission.role === 'owner') return;
    
    Alert.alert(
      'Remove User',
      `Remove ${permission.name || permission.email} from this share?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(permission.userId, permission.email),
        },
      ]
    );
  };

  return (
    <View style={styles.permissionItem}>
      <View style={styles.userInfo}>
        <View style={[styles.userAvatar, { backgroundColor: getRoleColor(permission.role) }]}>
          <Text style={styles.userInitial}>
            {permission.name ? permission.name.charAt(0).toUpperCase() : permission.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
            {permission.name || permission.email}
          </Text>
          {permission.name && (
            <Text style={[styles.userEmail, { color: iconColor }]} numberOfLines={1}>
              {permission.email}
            </Text>
          )}
          <Text style={[styles.userGranted, { color: iconColor }]}>
            Added {formatDate(permission.grantedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.permissionActions}>
        {/* Role Selector */}
        <TouchableOpacity
          style={[
            styles.roleButton,
            { backgroundColor: `${getRoleColor(permission.role)}26` },
            permission.role === 'owner' && styles.ownerRole,
          ]}
          onPress={handleRolePress}
          disabled={permission.role === 'owner' || isUpdating}
        >
          <Text style={[styles.roleButtonText, { color: getRoleColor(permission.role) }]}>
            {permission.role.charAt(0).toUpperCase() + permission.role.slice(1)}
          </Text>
          {permission.role !== 'owner' && !isUpdating && (
            <Ionicons name="chevron-down" size={14} color={getRoleColor(permission.role)} />
          )}
        </TouchableOpacity>

        {/* Remove Button */}
        {permission.role !== 'owner' && (
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            disabled={isUpdating}
          >
            <Ionicons name="close-circle" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleMenu(false)}
        >
          <View style={[styles.roleMenu, { backgroundColor: useThemeColor({}, 'background') }]}>
            <Text style={[styles.roleMenuTitle, { color: textColor }]}>
              Change Role
            </Text>
            
            {(['viewer', 'editor'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleMenuItem,
                  permission.role === role && { backgroundColor: `${getRoleColor(role)}26` }
                ]}
                onPress={() => handleRoleSelect(role)}
              >
                <View style={styles.roleMenuItemContent}>
                  <Text style={[styles.roleMenuItemTitle, { color: textColor }]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                  <Text style={[styles.roleMenuItemDesc, { color: iconColor }]}>
                    {role === 'viewer' ? 'Can view and download' : 'Can view, edit, and share'}
                  </Text>
                </View>
                {permission.role === role && (
                  <Ionicons name="checkmark" size={20} color={getRoleColor(role)} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  visible,
  share,
  onClose,
  onUpdate,
  onError,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [isUpdating, setIsUpdating] = useState(false);
  const [localShare, setLocalShare] = useState<FileShare | null>(share);

  React.useEffect(() => {
    setLocalShare(share);
  }, [share]);

  const handleRoleChange = async (userId: string, role: 'viewer' | 'editor' | 'owner') => {
    if (!localShare) return;

    setIsUpdating(true);
    try {
      await sharingService.updateUserPermission(localShare.id, userId, role);

      // Update local state
      const updatedPermissions = localShare.permissions.map(permission =>
        permission.userId === userId ? { ...permission, role } : permission
      );
      const updatedShare = { ...localShare, permissions: updatedPermissions };
      setLocalShare(updatedShare);
      onUpdate?.(updatedShare);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permission';
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (userId: string, _userEmail: string) => {
    if (!localShare) return;

    setIsUpdating(true);
    try {
      await sharingService.removeUserFromShare(localShare.id, userId);

      // Update local state
      const updatedPermissions = localShare.permissions.filter(
        permission => permission.userId !== userId
      );
      const updatedShare = { ...localShare, permissions: updatedPermissions };
      setLocalShare(updatedShare);
      onUpdate?.(updatedShare);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove user';
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleShareActive = async () => {
    if (!localShare) return;

    setIsUpdating(true);
    try {
      const updatedShare = await sharingService.updateShare(localShare.id, {
        isActive: !localShare.isActive,
      });
      setLocalShare(updatedShare);
      onUpdate?.(updatedShare);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update share status';
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!visible || !localShare) return null;

  const owner = localShare.permissions.find(p => p.role === 'owner');
  const collaborators = localShare.permissions.filter(p => p.role !== 'owner');

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
          <Text style={[styles.title, { color: textColor }]}>Manage Permissions</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Share Status */}
          <View style={styles.section}>
            <View style={styles.shareStatusHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Share Status
              </Text>
              <Switch
                value={localShare.isActive}
                onValueChange={handleToggleShareActive}
                disabled={isUpdating}
                trackColor={{ false: `${iconColor}33`, true: `${tintColor}66` }}
                thumbColor={localShare.isActive ? tintColor : `${iconColor}99`}
              />
            </View>
            <Text style={[styles.shareStatusDesc, { color: iconColor }]}>
              {localShare.isActive 
                ? 'This file is currently shared with others'
                : 'This file is private - sharing is disabled'
              }
            </Text>
          </View>

          {localShare.isActive && (
            <>
              {/* Owner */}
              {owner && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Owner
                  </Text>
                  <PermissionItem
                    permission={owner}
                    isOwner={true}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemoveUser}
                    isUpdating={isUpdating}
                  />
                </View>
              )}

              {/* Collaborators */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Collaborators ({collaborators.length})
                </Text>
                
                {collaborators.length > 0 ? (
                  collaborators.map((permission) => (
                    <PermissionItem
                      key={permission.id}
                      permission={permission}
                      isOwner={false}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemoveUser}
                      isUpdating={isUpdating}
                    />
                  ))
                ) : (
                  <View style={styles.emptyCollaborators}>
                    <Ionicons name="people-outline" size={32} color={`${iconColor}66`} />
                    <Text style={[styles.emptyText, { color: iconColor }]}>
                      No collaborators yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: iconColor }]}>
                      Share this file to add collaborators
                    </Text>
                  </View>
                )}
              </View>

              {/* Link Sharing Status */}
              {localShare.shareLink && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Public Link
                  </Text>
                  <View style={[styles.linkStatus, { backgroundColor: `${tintColor}1A` }]}>
                    <Ionicons name="link" size={20} color={tintColor} />
                    <View style={styles.linkInfo}>
                      <Text style={[styles.linkStatusText, { color: textColor }]}>
                        {localShare.shareLink.isActive ? 'Active' : 'Inactive'}
                      </Text>
                      <Text style={[styles.linkAccessText, { color: iconColor }]}>
                        {localShare.shareLink.accessLevel} access
                        {localShare.shareLink.hasPassword && ' • Password protected'}
                      </Text>
                    </View>
                    <View style={[
                      styles.linkStatusDot,
                      { backgroundColor: localShare.shareLink.isActive ? '#4CAF50' : '#F44336' }
                    ]} />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  shareStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shareStatusDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000033',
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
  permissionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  ownerRole: {
    opacity: 0.8,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleMenu: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  roleMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  roleMenuItemContent: {
    flex: 1,
  },
  roleMenuItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  roleMenuItemDesc: {
    fontSize: 12,
  },
  emptyCollaborators: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  linkInfo: {
    marginLeft: 12,
    flex: 1,
  },
  linkStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  linkAccessText: {
    fontSize: 12,
  },
  linkStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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