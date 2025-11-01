import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationItem } from '@/stores/notification';
import { useCallback } from 'react';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const TOAST_MARGIN = 20;

interface NotificationToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onPress?: (notification: NotificationItem) => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onPress,
  duration = 5000,
}) => {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(-TOAST_HEIGHT - TOAST_MARGIN)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleDismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: -TOAST_HEIGHT - TOAST_MARGIN,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: TOAST_MARGIN,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      handleDismiss();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification, duration, handleDismiss]);

  const handlePress = () => {
    if (!notification) return;

    handleDismiss();

    if (onPress) {
      onPress(notification);
      return;
    }

    // Default navigation behavior
    switch (notification.type) {
      case 'file_shared':
        if (notification.data?.fileId) {
          router.push(`/file/${notification.data.fileId}` as '/file/[id]');
        }
        break;
      case 'document_updated':
        if (notification.data?.documentId) {
          router.push(`/document/${notification.data.documentId}` as '/document/[id]');
        }
        break;
      case 'collaboration_invite':
        if (notification.data?.inviteId) {
          router.push('/collaboration' as '/collaboration');
        }
        break;
      case 'upload_complete':
        router.push('/(tabs)/files');
        break;
      default:
        router.push('/(tabs)');
        break;
    }
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: { nativeEvent: { state: number; translationX: number; translationY: number; velocityX: number; velocityY: number } }) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      // Dismiss if swiped up or to the sides
      if (
        translationY < -50 || 
        Math.abs(translationX) > 100 || 
        velocityY < -500 || 
        Math.abs(velocityX) > 500
      ) {
        handleDismiss();
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: TOAST_MARGIN,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'file_shared':
        return 'share-outline';
      case 'document_updated':
        return 'document-text-outline';
      case 'collaboration_invite':
        return 'people-outline';
      case 'upload_complete':
        return 'cloud-upload-outline';
      case 'system_alert':
        return 'alert-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'file_shared':
        return '#4A90E2';
      case 'document_updated':
        return '#7ED321';
      case 'collaboration_invite':
        return '#9013FE';
      case 'upload_complete':
        return '#F5A623';
      case 'system_alert':
        return '#F44336';
      default:
        return '#666';
    }
  };

  if (!isVisible || !notification) {
    return null;
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateY },
              { translateX },
            ],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.toast}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getNotificationIcon(notification.type) as any}
                size={24}
                color={getNotificationColor(notification.type)}
              />
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          
          {/* Progress bar */}
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getNotificationColor(notification.type),
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: TOAST_MARGIN,
    right: TOAST_MARGIN,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
  progressBar: {
    height: 3,
    width: '100%',
  },
});

export default NotificationToast;