import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNavigationStore, NavigationItem } from '@/stores/navigation/navigationStore';

interface QuickNavigationProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickNavigation({ visible, onClose }: QuickNavigationProps) {
  const colorScheme = useColorScheme();
  const { getRecentFolders, getFavorites, navigateToFolder, navigateToRoot } = useNavigationStore();
  
  const recentFolders = getRecentFolders();
  const favoriteFolders = getFavorites();

  const handleFolderPress = (folder: NavigationItem) => {
    navigateToFolder(folder);
    router.push(`/folder/${folder.id}`);
    onClose();
  };

  const handleRootPress = () => {
    navigateToRoot();
    router.push('/(tabs)/files');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Quick Navigation
              </ThemedText>
              <TouchableOpacity onPress={onClose}>
                <IconSymbol 
                  name="xmark.circle.fill" 
                  size={24} 
                  color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Root Folder */}
              <TouchableOpacity 
                style={[
                  styles.folderItem,
                  { borderBottomColor: `${Colors[colorScheme ?? 'light'].tabIconDefault  }20` }
                ]}
                onPress={handleRootPress}
              >
                <View style={[styles.folderIcon, { backgroundColor: '#007AFF20' }]}>
                  <IconSymbol name="house.fill" size={20} color="#007AFF" />
                </View>
                <View style={styles.folderInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.folderName}>
                    My Files
                  </ThemedText>
                  <ThemedText style={styles.folderPath}>
                    Root folder
                  </ThemedText>
                </View>
                <IconSymbol 
                  name="chevron.right" 
                  size={16} 
                  color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                />
              </TouchableOpacity>

              {/* Favorite Folders */}
              {favoriteFolders.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                      Favorites
                    </ThemedText>
                  </View>
                  
                  {favoriteFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder.id}
                      style={[
                        styles.folderItem,
                        { borderBottomColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}20` }
                      ]}
                      onPress={() => handleFolderPress(folder)}
                    >
                      <View style={[styles.folderIcon, { backgroundColor: '#FFD60020' }]}>
                        <IconSymbol name="star.fill" size={20} color="#FFD600" />
                      </View>
                      <View style={styles.folderInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.folderName}>
                          {folder.name}
                        </ThemedText>
                        <ThemedText style={styles.folderPath}>
                          {folder.path}
                        </ThemedText>
                      </View>
                      <IconSymbol 
                        name="chevron.right" 
                        size={16} 
                        color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                      />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Recent Folders */}
              {recentFolders.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                      Recent Folders
                    </ThemedText>
                  </View>
                  
                  {recentFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder.id}
                      style={[
                        styles.folderItem,
                        { borderBottomColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}20` }
                      ]}
                      onPress={() => handleFolderPress(folder)}
                    >
                      <View style={[styles.folderIcon, { backgroundColor: '#34C75920' }]}>
                        <IconSymbol name="folder.fill" size={20} color="#34C759" />
                      </View>
                      <View style={styles.folderInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.folderName}>
                          {folder.name}
                        </ThemedText>
                        <ThemedText style={styles.folderPath}>
                          {folder.path}
                        </ThemedText>
                      </View>
                      <IconSymbol 
                        name="chevron.right" 
                        size={16} 
                        color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                      />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {recentFolders.length === 0 && favoriteFolders.length === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol 
                    name="folder.fill" 
                    size={48} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                    style={styles.emptyIcon}
                  />
                  <ThemedText style={styles.emptyText}>
                    No recent folders
                  </ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    Folders you visit will appear here for quick access
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface QuickNavigationButtonProps {
  onPress: () => void;
}

export function QuickNavigationButton({ onPress }: QuickNavigationButtonProps) {
  const colorScheme = useColorScheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.quickButton,
        { backgroundColor: `${Colors[colorScheme ?? 'light'].tabIconDefault}20` }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol 
        name="chevron.right" 
        size={16} 
        color={Colors[colorScheme ?? 'light'].text} 
      />
    </TouchableOpacity>
  );
}

export function useQuickNavigation() {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return {
    visible,
    show,
    hide,
    QuickNavigationModal: (props: Omit<QuickNavigationProps, 'visible' | 'onClose'>) => (
      <QuickNavigation {...props} visible={visible} onClose={hide} />
    ),
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    marginBottom: 2,
  },
  folderPath: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});