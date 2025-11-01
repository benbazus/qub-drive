import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigationStore } from '@/stores/navigation/navigationStore';

export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (item: BreadcrumbItem) => void;
  maxItems?: number;
  showHomeIcon?: boolean;
  animated?: boolean;
}

export function Breadcrumb({ 
  items, 
  onNavigate, 
  maxItems = 4, 
  showHomeIcon = true, 
  animated = true 
}: BreadcrumbProps) {
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { navigateToFolder, navigateToRoot } = useNavigationStore();
  const screenWidth = Dimensions.get('window').width;

  // Auto-scroll to end when items change
  useEffect(() => {
    if (scrollViewRef.current && items.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [items]);

  // Animate breadcrumb changes
  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [items, animated, fadeAnim]);

  const handleItemPress = (item: BreadcrumbItem, index: number) => {
    if (index === items.length - 1) {
      // Don't navigate if it's the current item
      return;
    }

    if (onNavigate) {
      onNavigate(item);
    } else {
      // Enhanced navigation behavior with store integration
      if (item.id === 'root' || item.id === '') {
        navigateToRoot();
        router.push('/(tabs)/files');
      } else if (item.isFolder) {
        navigateToFolder(item);
        router.push(`/folder/${item.id}`);
      } else {
        router.push(`/file/${item.id}`);
      }
    }
  };

  const renderBreadcrumbItems = () => {
    let displayItems = items;

    // Smart truncation based on screen width
    const maxItemsForScreen = Math.floor(screenWidth / 120); // Approximate item width
    const effectiveMaxItems = Math.min(maxItems, maxItemsForScreen);

    // If we have too many items, show ellipsis with smart truncation
    if (items.length > effectiveMaxItems && items.length > 2) {
      const firstItem = items[0];
      const lastItems = items.slice(-(effectiveMaxItems - 2));
      if (firstItem) {
        displayItems = [
          firstItem, 
          { id: 'ellipsis', name: '•••', path: '', isFolder: true }, 
          ...lastItems
        ];
      }
    }

    return displayItems.map((item, index) => {
      const isLast = index === displayItems.length - 1;
      const isFirst = index === 0;
      const isEllipsis = item.id === 'ellipsis';
      const isClickable = !isLast && !isEllipsis;

      return (
        <View key={`${item.id}-${index}`} style={styles.breadcrumbItem}>
          {isEllipsis ? (
            <TouchableOpacity
              style={styles.ellipsisContainer}
              onPress={() => {
                // Show a modal or dropdown with all intermediate items
                // For now, just navigate to the parent of the last visible item
                if (items.length > 2) {
                  const middleIndex = Math.floor(items.length / 2);
                  const middleItem = items[middleIndex];
                  if (middleItem) {
                    handleItemPress(middleItem, middleIndex);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.ellipsis, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {item.name}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleItemPress(item, index)}
              disabled={!isClickable}
              activeOpacity={isClickable ? 0.7 : 1}
              style={[
                styles.breadcrumbButton,
                isFirst && styles.firstBreadcrumbButton,
                isLast && styles.lastBreadcrumbButton,
              ]}
            >
              <View style={styles.breadcrumbContent}>
                {isFirst && showHomeIcon && (
                  <IconSymbol
                    name="house.fill"
                    size={16}
                    color={isClickable ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].text}
                    style={styles.homeIcon}
                  />
                )}
                <ThemedText
                  style={[
                    styles.breadcrumbText,
                    isLast && styles.currentItem,
                    isClickable && { color: Colors[colorScheme ?? 'light'].tint },
                    !isClickable && { color: Colors[colorScheme ?? 'light'].text },
                    isFirst && showHomeIcon && styles.homeText,
                  ]}
                  numberOfLines={1}
                >
                  {isFirst && showHomeIcon ? (item.name === 'My Files' ? '' : item.name) : item.name}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}

          {!isLast && (
            <IconSymbol
              name="chevron.right"
              size={12}
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
              style={styles.separator}
            />
          )}
        </View>
      );
    });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          opacity: fadeAnim,
        }
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        decelerationRate="fast"
      >
        <View style={styles.breadcrumbContainer} testID="breadcrumb-container">
          {renderBreadcrumbItems()}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingRight: 16, // Extra padding for better scrolling
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 140,
  },
  breadcrumbButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
    justifyContent: 'center',
  },
  firstBreadcrumbButton: {
    paddingLeft: 4,
  },
  lastBreadcrumbButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentItem: {
    fontWeight: '600',
  },
  homeIcon: {
    marginRight: 4,
  },
  homeText: {
    marginLeft: 0,
  },
  ellipsisContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  ellipsis: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 24,
  },
  separator: {
    marginHorizontal: 6,
    opacity: 0.6,
  },
});