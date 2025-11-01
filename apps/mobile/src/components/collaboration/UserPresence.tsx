import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CollaborationUser } from '../../types/collaboration';

interface UserPresenceProps {
  users: CollaborationUser[];
  currentUserId: string;
  maxVisible?: number;
  onUserPress?: (user: CollaborationUser) => void;
  style?: any;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  users,
  currentUserId,
  maxVisible = 3,
  onUserPress,
  style,
}) => {
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Filter out current user and sort by online status
  const otherUsers = users
    .filter(user => user.id !== currentUserId)
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.name.localeCompare(b.name);
    });

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenUsers = otherUsers.slice(maxVisible);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [users]);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUserAvatar = (user: CollaborationUser, size: number = 32) => {
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: user.color,
          },
          !user.isOnline && styles.offlineAvatar,
        ]}
      >
        {user.avatar ? (
          <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
            {initials}
          </Text>
        ) : (
          <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
            {initials}
          </Text>
        )}
        
        {/* Online indicator */}
        <View
          style={[
            styles.onlineIndicator,
            {
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              right: -2,
              bottom: -2,
            },
            user.isOnline ? styles.online : styles.offline,
          ]}
        />
      </View>
    );
  };

  const renderUserInfo = (user: CollaborationUser) => {
    const isExpanded = expandedUsers.includes(user.id);
    
    return (
      <TouchableOpacity
        key={user.id}
        style={styles.userInfo}
        onPress={() => {
          toggleUserExpanded(user.id);
          onUserPress?.(user);
        }}
        activeOpacity={0.7}
      >
        {renderUserAvatar(user)}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          
          <View style={styles.userStatus}>
            <View
              style={[
                styles.statusDot,
                user.isOnline ? styles.online : styles.offline,
              ]}
            />
            <Text style={styles.statusText}>
              {user.isOnline ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
            </Text>
          </View>
          
          {isExpanded && (
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          )}
        </View>
        
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#666"
        />
      </TouchableOpacity>
    );
  };

  const renderCompactView = () => (
    <View style={styles.compactContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarList}
      >
        {visibleUsers.map(user => (
          <TouchableOpacity
            key={user.id}
            onPress={() => onUserPress?.(user)}
            style={styles.compactAvatar}
          >
            {renderUserAvatar(user, 28)}
          </TouchableOpacity>
        ))}
        
        {hiddenUsers.length > 0 && (
          <TouchableOpacity style={styles.moreUsersButton}>
            <View style={styles.moreUsersAvatar}>
              <Text style={styles.moreUsersText}>
                +{hiddenUsers.length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      <Text style={styles.collaboratorCount}>
        {otherUsers.length} {otherUsers.length === 1 ? 'collaborator' : 'collaborators'}
      </Text>
    </View>
  );

  const renderExpandedView = () => (
    <View style={styles.expandedContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collaborators</Text>
        <Text style={styles.headerCount}>
          {otherUsers.filter(u => u.isOnline).length} online
        </Text>
      </View>
      
      <ScrollView style={styles.userList}>
        {otherUsers.map(renderUserInfo)}
      </ScrollView>
    </View>
  );

  const formatLastSeen = (lastSeen: Date): string => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
      {renderCompactView()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  compactAvatar: {
    marginRight: 4,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  offlineAvatar: {
    opacity: 0.6,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#9E9E9E',
  },
  moreUsersButton: {
    marginLeft: 4,
  },
  moreUsersAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreUsersText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  collaboratorCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  expandedContainer: {
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerCount: {
    fontSize: 12,
    color: '#666',
  },
  userList: {
    maxHeight: 200,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default UserPresence;