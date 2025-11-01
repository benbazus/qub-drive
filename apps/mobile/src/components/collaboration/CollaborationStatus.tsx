import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileShare, SharePermission } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CollaborationStatusProps {
  share?: FileShare | null;
  compact?: boolean;
}

interface ActiveCollaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  share,
  compact = false,
}) => {
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  if (!share || !share.isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.statusRow}>
          <Ionicons name="lock-closed" size={16} color={iconColor} />
          <Text style={[styles.statusText, { color: iconColor }]}>
            Private
          </Text>
        </View>
      </View>
    );
  }

  const getCollaborators = (): ActiveCollaborator[] => {
    return share.permissions
      .filter(permission => permission.role !== 'owner')
      .map(permission => ({
        id: permission.userId,
        name: permission.name || permission.email.split('@')[0],
        email: permission.email,
        role: permission.role,
        isOnline: Math.random() > 0.5, // Mock online status
        lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      }));
  };

  const collaborators = getCollaborators();
  const hasLink = share.shareLink?.isActive;
  const linkAccess = share.shareLink?.accessLevel;

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
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

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {hasLink && (
          <View style={[styles.compactBadge, { backgroundColor: '#FF950026' }]}>
            <Ionicons name="link" size={12} color="#FF9500" />
            <Text style={[styles.compactBadgeText, { color: '#FF9500' }]}>
              {linkAccess}
            </Text>
          </View>
        )}
        {collaborators.length > 0 && (
          <View style={[styles.compactBadge, { backgroundColor: '#4CAF5026' }]}>
            <Ionicons name="people" size={12} color="#4CAF50" />
            <Text style={[styles.compactBadgeText, { color: '#4CAF50' }]}>
              {collaborators.length}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Link Status */}
      {hasLink && (
        <View style={styles.statusRow}>
          <Ionicons name="link" size={16} color="#FF9500" />
          <Text style={[styles.statusText, { color: textColor }]}>
            Public link ({linkAccess} access)
          </Text>
          <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
        </View>
      )}

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <View style={styles.collaboratorsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={16} color={tintColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {collaborators.length} {collaborators.length === 1 ? 'Collaborator' : 'Collaborators'}
            </Text>
          </View>
          
          {collaborators.slice(0, 3).map((collaborator) => (
            <View key={collaborator.id} style={styles.collaboratorRow}>
              <View style={styles.collaboratorInfo}>
                <View style={[styles.avatar, { backgroundColor: getRoleColor(collaborator.role) }]}>
                  <Text style={styles.avatarText}>
                    {collaborator.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.collaboratorDetails}>
                  <Text style={[styles.collaboratorName, { color: textColor }]} numberOfLines={1}>
                    {collaborator.name}
                  </Text>
                  <View style={styles.collaboratorMeta}>
                    <Text style={[styles.roleText, { color: getRoleColor(collaborator.role) }]}>
                      {collaborator.role}
                    </Text>
                    <Text style={[styles.separator, { color: iconColor }]}>•</Text>
                    <Text style={[styles.lastSeenText, { color: iconColor }]}>
                      {collaborator.isOnline ? 'Online' : formatLastSeen(collaborator.lastSeen!)}
                    </Text>
                  </View>
                </View>
              </View>
              {collaborator.isOnline && (
                <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
              )}
            </View>
          ))}
          
          {collaborators.length > 3 && (
            <Text style={[styles.moreText, { color: iconColor }]}>
              +{collaborators.length - 3} more collaborators
            </Text>
          )}
        </View>
      )}

      {/* No Collaboration */}
      {!hasLink && collaborators.length === 0 && (
        <View style={styles.statusRow}>
          <Ionicons name="lock-closed" size={16} color={iconColor} />
          <Text style={[styles.statusText, { color: iconColor }]}>
            Private - Only you have access
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  collaboratorsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  collaboratorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  lastSeenText: {
    fontSize: 12,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});