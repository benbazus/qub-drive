import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnreadNotificationCount } from '@/stores/notification';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  maxCount?: number;
  showZero?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 'medium',
  color = '#FF3B30',
  textColor = '#FFFFFF',
  maxCount = 99,
  showZero = false,
}) => {
  const unreadCount = useUnreadNotificationCount();

  if (unreadCount === 0 && !showZero) {
    return null;
  }

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  const sizeStyle = styles[size];

  return (
    <View style={[styles.badge, sizeStyle, { backgroundColor: color }]}>
      <Text style={[styles.text, sizeStyle, { color: textColor }]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  small: {
    height: 16,
    minWidth: 16,
    borderRadius: 8,
    fontSize: 10,
    paddingHorizontal: 4,
  },
  medium: {
    height: 20,
    minWidth: 20,
    borderRadius: 10,
    fontSize: 12,
    paddingHorizontal: 6,
  },
  large: {
    height: 24,
    minWidth: 24,
    borderRadius: 12,
    fontSize: 14,
    paddingHorizontal: 8,
  },
});

export default NotificationBadge;