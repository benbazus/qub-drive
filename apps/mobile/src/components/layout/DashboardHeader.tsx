import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth';
import { useUnreadNotificationCount } from '@/stores/notification';
import { NotificationBadge } from '@/components/notifications';

export function DashboardHeader() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const user = useAuthStore(state => state.user);
  const unreadCount = useUnreadNotificationCount();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Implement search functionality in file management task
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleNotifications = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/notifications' as '/notifications');
  };

  const handleProfile = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/settings');
  };

  return (
    <ThemedView style={[
      styles.container,
      { 
        paddingTop: insets.top + 8,
        backgroundColor: Colors[colorScheme ?? 'light'].background,
      }
    ]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.welcomeSection, isSmallScreen && styles.welcomeSectionSmall]}>
          <ThemedText type="defaultSemiBold" style={[styles.greeting, isSmallScreen && styles.greetingSmall]}>
            Good {getTimeOfDay()}
          </ThemedText>
          <ThemedText type="title" style={[styles.userName, isSmallScreen && styles.userNameSmall]}>
            {user?.name || 'User'}
          </ThemedText>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}20` }]}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <View style={styles.notificationButtonContainer}>
              <IconSymbol 
                name="bell" 
                size={isSmallScreen ? 18 : 20} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <NotificationBadge size="small" maxCount={99} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}20` }]}
            onPress={handleProfile}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="person.circle" 
              size={isSmallScreen ? 18 : 20} 
              color={Colors[colorScheme ?? 'light'].text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}10`,
          borderColor: isSearchActive ? Colors[colorScheme ?? 'light'].tint : 'transparent',
        }
      ]}>
        <IconSymbol 
          name="magnifyingglass" 
          size={18} 
          color={Colors[colorScheme ?? 'light'].tabIconDefault} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: Colors[colorScheme ?? 'light'].text }
          ]}
          placeholder="Search files and folders..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchActive(true)}
          onBlur={() => setIsSearchActive(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <IconSymbol 
              name="xmark.circle.fill" 
              size={18} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault} 
            />
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeSection: {
    flex: 1,
    marginRight: 12,
  },
  welcomeSectionSmall: {
    marginRight: 8,
  },
  greeting: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  greetingSmall: {
    fontSize: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  userNameSmall: {
    fontSize: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
      android: {
        paddingVertical: 4,
      },
    }),
  },
  clearButton: {
    padding: 4,
  },
  notificationButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});