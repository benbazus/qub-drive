import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface QuickActionProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ title, subtitle, icon, color, onPress }: QuickActionProps) {
  const colorScheme = useColorScheme();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.actionCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
        isSmallScreen && styles.actionCardSmall
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }, isSmallScreen && styles.actionIconSmall]}>
        <IconSymbol name={icon as any} size={isSmallScreen ? 24 : 28} color={color} />
      </View>
      <View style={styles.actionText}>
        <ThemedText type="defaultSemiBold" style={[styles.actionTitle, isSmallScreen && styles.actionTitleSmall]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.actionSubtitle, isSmallScreen && styles.actionSubtitleSmall]}>
          {subtitle}
        </ThemedText>
      </View>
      <IconSymbol 
        name="chevron.right" 
        size={isSmallScreen ? 14 : 16} 
        color={Colors[colorScheme ?? 'light'].tabIconDefault} 
      />
    </TouchableOpacity>
  );
}

export function QuickActions() {
  const actions = [
    {
      title: 'Upload Files',
      subtitle: 'Add photos, documents, and more',
      icon: 'plus.circle.fill',
      color: '#007AFF',
      onPress: () => router.push('/upload'),
    },
    {
      title: 'Create Document',
      subtitle: 'Start a new text document',
      icon: 'doc.text.fill',
      color: '#34C759',
      onPress: () => {
        // TODO: Create new document and navigate to editor
      },
    },
    {
      title: 'Create Spreadsheet',
      subtitle: 'Start a new spreadsheet',
      icon: 'tablecells.fill',
      color: '#FF9500',
      onPress: () => {
        router.push('/spreadsheet-demo');
      },
    },
    {
      title: 'Create Form',
      subtitle: 'Build a custom form',
      icon: 'list.clipboard.fill',
      color: '#AF52DE',
      onPress: () => {
        // TODO: Create new form and navigate to builder
      },
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Quick Actions
      </ThemedText>
      
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <QuickAction
            key={index}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            color={action.color}
            onPress={action.onPress}
          />
        ))}
      </View>
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
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionCardSmall: {
    padding: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionTitleSmall: {
    fontSize: 14,
  },
  actionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionSubtitleSmall: {
    fontSize: 12,
  },
});