import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ResponsiveGrid } from './ResponsiveGrid';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  const colorScheme = useColorScheme();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.card,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
        isSmallScreen && styles.cardSmall
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <IconSymbol name={icon as unknown} size={isSmallScreen ? 20 : 24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.cardValue, isSmallScreen && styles.cardValueSmall]}>
            {value}
          </ThemedText>
          <ThemedText style={[styles.cardTitle, isSmallScreen && styles.cardTitleSmall]}>
            {title}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function StatCards() {
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  const stats = [
    {
      title: 'Total Files',
      value: '0', // TODO: Get from file store
      icon: 'doc.fill',
      color: '#007AFF',
      onPress: () => router.push('/(tabs)/files'),
    },
    {
      title: 'Shared Files',
      value: '0', // TODO: Get from sharing store
      icon: 'person.2.fill',
      color: '#34C759',
      onPress: () => router.push('/(tabs)/shared'),
    },
    {
      title: 'Storage Used',
      value: '0 GB', // TODO: Get from storage info
      icon: 'internaldrive.fill',
      color: '#FF9500',
      onPress: () => {}, // TODO: Navigate to storage settings
    },
    {
      title: 'Recent Activity',
      value: '0', // TODO: Get from activity store
      icon: 'clock.fill',
      color: '#AF52DE',
      onPress: () => router.push('/(tabs)/recent'),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Overview
      </ThemedText>
      
      <ResponsiveGrid columns={2} spacing={isSmallScreen ? 8 : 12} minItemWidth={140}>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            onPress={stat.onPress}
          />
        ))}
      </ResponsiveGrid>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardSmall: {
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardValueSmall: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  cardTitleSmall: {
    fontSize: 11,
  },
});