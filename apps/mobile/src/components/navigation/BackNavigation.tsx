import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigationStore } from '@/stores/navigation/navigationStore';

interface BackNavigationProps {
  title?: string;
  showBreadcrumb?: boolean;
  showParentName?: boolean;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}

export function BackNavigation({ 
  title, 
  showBreadcrumb = true, 
  showParentName = true,
  onBack, 
  rightActions,
}: BackNavigationProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { currentPath, navigateBack } = useNavigationStore();
  const [isPressed, setIsPressed] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (currentPath.length > 1) {
      navigateBack();
      // Navigate to the parent folder with enhanced logic
      const parentFolder = currentPath[currentPath.length - 2];
      if (parentFolder && (parentFolder.id === 'root' || parentFolder.id === '')) {
        router.push('/(tabs)/files');
      } else if (parentFolder) {
        router.push(`/folder/${parentFolder.id}`);
      }
    } else {
      // If no parent in current path, try to go back in navigation stack
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to files tab
        router.push('/(tabs)/files');
      }
    }
  };

  const getCurrentTitle = () => {
    if (title) return title;
    if (currentPath.length > 0) {
      const currentItem = currentPath[currentPath.length - 1];
      return currentItem ? currentItem.name : 'Files';
    }
    return 'Files';
  };

  const getParentName = () => {
    if (currentPath.length > 1) {
      const parentItem = currentPath[currentPath.length - 2];
      if (parentItem) {
        const parentName = parentItem.name;
        // Truncate long parent names for mobile
        return parentName.length > 12 ? `${parentName.substring(0, 12)}...` : parentName;
      }
    }
    return null;
  };

  const canGoBack = () => {
    return currentPath.length > 1 || router.canGoBack();
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.navigationRow}>
        {canGoBack() && (
          <TouchableOpacity 
            style={[
              styles.backButton,
              isPressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="chevron.left" 
              size={22} 
              color={Colors[colorScheme ?? 'light'].tint} 
            />
            {showParentName && getParentName() && (
              <ThemedText 
                style={[styles.backText, { color: Colors[colorScheme ?? 'light'].tint }]}
                numberOfLines={1}
              >
                {getParentName()}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}

        <View style={[
          styles.titleContainer,
          !canGoBack() && styles.titleContainerNoBack,
        ]}>
          <ThemedText 
            type="defaultSemiBold" 
            style={[
              styles.title,
              { maxWidth: screenWidth - (canGoBack() ? 200 : 100) }
            ]}
            numberOfLines={1}
          >
            {getCurrentTitle()}
          </ThemedText>
          
          {showBreadcrumb && currentPath.length > 1 && (
            <ThemedText 
              style={[
                styles.breadcrumb, 
                { 
                  color: Colors[colorScheme ?? 'light'].tabIconDefault,
                  maxWidth: screenWidth - (canGoBack() ? 200 : 100)
                }
              ]}
              numberOfLines={1}
            >
              {currentPath.map(item => item.name).join(' › ')}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          {rightActions}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    marginRight: 8,
    maxWidth: 140,
    borderRadius: 8,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  backText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  titleContainerNoBack: {
    alignItems: 'flex-start',
    marginHorizontal: 0,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  breadcrumb: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
});