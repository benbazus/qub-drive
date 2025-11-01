import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface RecentFileProps {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'form' | 'image' | 'pdf' | 'other';
  modifiedAt: string;
  size?: string;
}

function RecentFileItem({ id, name, type, modifiedAt, size }: RecentFileProps) {
  const colorScheme = useColorScheme();
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'document':
        return { icon: 'doc.text.fill', color: '#007AFF' };
      case 'spreadsheet':
        return { icon: 'tablecells.fill', color: '#34C759' };
      case 'form':
        return { icon: 'list.clipboard.fill', color: '#AF52DE' };
      case 'image':
        return { icon: 'photo.fill', color: '#FF9500' };
      case 'pdf':
        return { icon: 'doc.fill', color: '#FF3B30' };
      default:
        return { icon: 'doc.fill', color: '#8E8E93' };
    }
  };

  const { icon, color } = getFileIcon(type);

  const handlePress = () => {
    // Navigate based on file type
    switch (type) {
      case 'document':
        router.push(`/document/${id}`);
        break;
      case 'spreadsheet':
        router.push(`/spreadsheet/${id}`);
        break;
      case 'form':
        router.push(`/form/${id}`);
        break;
      default:
        router.push(`/file/${id}`);
        break;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.fileItem,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.fileIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <View style={styles.fileInfo}>
        <ThemedText type="defaultSemiBold" style={styles.fileName} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText style={styles.fileDetails} numberOfLines={1}>
          {modifiedAt}{size ? ` • ${size}` : ''}
        </ThemedText>
      </View>
      <IconSymbol 
        name="ellipsis" 
        size={16} 
        color={Colors[colorScheme ?? 'light'].tabIconDefault} 
      />
    </TouchableOpacity>
  );
}

export function RecentFiles() {
  const colorScheme = useColorScheme();

  // TODO: Replace with actual recent files from store
  const recentFiles: RecentFileProps[] = [
    {
      id: '1',
      name: 'Project Proposal.docx',
      type: 'document',
      modifiedAt: '2 hours ago',
      size: '2.4 MB',
    },
    {
      id: '2',
      name: 'Budget Spreadsheet',
      type: 'spreadsheet',
      modifiedAt: '1 day ago',
      size: '1.2 MB',
    },
    {
      id: '3',
      name: 'Customer Survey',
      type: 'form',
      modifiedAt: '3 days ago',
    },
    {
      id: '4',
      name: 'Meeting Notes.pdf',
      type: 'pdf',
      modifiedAt: '1 week ago',
      size: '856 KB',
    },
  ];

  const handleViewAll = () => {
    router.push('/(tabs)/recent');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent Files
        </ThemedText>
        <TouchableOpacity onPress={handleViewAll}>
          <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].tint }]}>
            View All
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {recentFiles.length > 0 ? (
        <View style={styles.filesContainer}>
          {recentFiles.map((file) => (
            <RecentFileItem
              key={file.id}
              id={file.id}
              name={file.name}
              type={file.type}
              modifiedAt={file.modifiedAt}
              size={file.size}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol 
            name="doc.text" 
            size={48} 
            color={Colors[colorScheme ?? 'light'].tabIconDefault} 
            style={styles.emptyIcon}
          />
          <ThemedText style={styles.emptyText}>
            No recent files
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Files you work on will appear here
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filesContainer: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    marginBottom: 2,
  },
  fileDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});