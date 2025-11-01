import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileShare } from '@/types/sharing';
 

interface CollaborationIndicatorProps {
  share?: FileShare | null;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onPress?: () => void;
}

export const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
  share,
  size = 'medium',
  showText = false,
  onPress,
}) => {

  if (!share || !share.isActive) {
    return null;
  }

  const getIndicatorInfo = () => {
    const hasActiveUsers = share.permissions.length > 1;
    const hasActiveLink = share.shareLink?.isActive;
    const totalCollaborators = share.permissions.length - 1; // Exclude owner

    if (hasActiveLink && hasActiveUsers) {
      return {
        icon: 'people' as const,
        color: '#FF9500',
        text: `${totalCollaborators}+ people`,
        status: 'Public & Shared',
      };
    } else if (hasActiveLink) {
      return {
        icon: 'link' as const,
        color: '#FF9500',
        text: 'Public link',
        status: 'Public Link',
      };
    } else if (hasActiveUsers) {
      return {
        icon: 'people' as const,
        color: '#4CAF50',
        text: `${totalCollaborators} ${totalCollaborators === 1 ? 'person' : 'people'}`,
        status: 'Shared',
      };
    }

    return null;
  };

  const indicatorInfo = getIndicatorInfo();
  if (!indicatorInfo) return null;

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      icon: 12,
      text: styles.smallText,
    },
    medium: {
      container: styles.mediumContainer,
      icon: 16,
      text: styles.mediumText,
    },
    large: {
      container: styles.largeContainer,
      icon: 20,
      text: styles.largeText,
    },
  };

  const currentSize = sizeStyles[size];

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: `${indicatorInfo.color}26` },
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons
        name={indicatorInfo.icon}
        size={currentSize.icon}
        color={indicatorInfo.color}
      />
      {showText && (
        <Text
          style={[
            currentSize.text,
            { color: indicatorInfo.color, marginLeft: 4 },
          ]}
          numberOfLines={1}
        >
          {indicatorInfo.text}
        </Text>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pressable: {
    // Add subtle shadow for pressable indicators
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallText: {
    fontSize: 10,
    fontWeight: '600',
  },
  mediumText: {
    fontSize: 12,
    fontWeight: '600',
  },
  largeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});