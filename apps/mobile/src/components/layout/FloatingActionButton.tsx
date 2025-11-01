import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FloatingActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}

function FloatingAction({ icon, label, onPress, color }: FloatingActionProps) {
  const colorScheme = useColorScheme();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.floatingAction, isSmallScreen && styles.floatingActionSmall]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.actionRow}>
        <View style={[styles.actionIcon, { backgroundColor: color }, isSmallScreen && styles.actionIconSmall]}>
          <IconSymbol name={icon as any} size={isSmallScreen ? 18 : 20} color="white" />
        </View>
        <ThemedText style={[
          styles.actionLabel, 
          { color: Colors[colorScheme ?? 'light'].text },
          isSmallScreen && styles.actionLabelSmall
        ]}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export function FloatingActionButton() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  const actions = [
    {
      icon: 'plus',
      label: 'Upload Files',
      onPress: () => {
        setIsExpanded(false);
        router.push('/upload');
      },
      color: '#007AFF',
    },
    {
      icon: 'doc.text',
      label: 'New Document',
      onPress: () => {
        setIsExpanded(false);
        // TODO: Create new document
      },
      color: '#34C759',
    },
    {
      icon: 'tablecells',
      label: 'New Spreadsheet',
      onPress: () => {
        setIsExpanded(false);
        // TODO: Create new spreadsheet
      },
      color: '#FF9500',
    },
    {
      icon: 'list.clipboard',
      label: 'New Form',
      onPress: () => {
        setIsExpanded(false);
        // TODO: Create new form
      },
      color: '#AF52DE',
    },
  ];

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const actionTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const actionOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const mainButtonRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[
      styles.container,
      { bottom: insets.bottom + 16 }
    ]}>
      {/* Floating Actions */}
      {actions.map((action, index) => (
        <Animated.View
          key={index}
          style={[
            styles.floatingActionContainer,
            {
              transform: [
                { 
                  translateY: Animated.multiply(
                    actionTranslateY, 
                    new Animated.Value(actions.length - index)
                  ) 
                }
              ],
              opacity: actionOpacity,
            }
          ]}
        >
          <FloatingAction
            icon={action.icon}
            label={action.label}
            onPress={action.onPress}
            color={action.color}
          />
        </Animated.View>
      ))}

      {/* Main FAB */}
      <TouchableOpacity
        style={[
          styles.mainButton,
          { backgroundColor: Colors[colorScheme ?? 'light'].tint },
          isSmallScreen && styles.mainButtonSmall
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: mainButtonRotation }] }}>
          <IconSymbol name="plus" size={isSmallScreen ? 20 : 24} color="white" />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setIsExpanded(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  floatingActionContainer: {
    marginBottom: 12,
  },
  floatingAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingActionSmall: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 100,
  },
  actionLabelSmall: {
    fontSize: 12,
    minWidth: 80,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});