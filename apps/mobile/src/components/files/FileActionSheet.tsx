import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
// import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FileAction } from './FileContextMenu';

interface FileActionSheetProps {
  visible: boolean;
  file: FileItem | null;
  selectedFiles?: FileItem[] | undefined;
  actions: FileAction[];
  onAction: (actionId: string, file: FileItem | FileItem[]) => void;
  onClose: () => void;
  title?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const FileActionSheet: React.FC<FileActionSheetProps> = ({
  visible,
  file,
  selectedFiles,
  actions,
  onAction,
  onClose,
  title,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const targetFiles = selectedFiles && selectedFiles.length > 0 ? selectedFiles : file ? [file] : [];
  const isMultipleSelection = targetFiles.length > 1;

  const handleAction = (actionId: string) => {
    if (targetFiles.length > 0) {
      onAction(actionId, isMultipleSelection ? targetFiles : targetFiles[0]);
    }
    onClose();
  };

  const getTitle = () => {
    if (title) return title;
    if (isMultipleSelection) {
      return `${targetFiles.length} items selected`;
    }
    return file?.name || 'File Actions';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <SafeAreaView>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: `${iconColor}66` }]} />
              </View>

              {/* Header */}
              <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
                {!isMultipleSelection && file && (
                  <View style={styles.fileInfo}>
                    <Ionicons
                      name={file.type === 'folder' ? 'folder' : 'document'}
                      size={24}
                      color={tintColor}
                    />
                    <View style={styles.fileDetails}>
                      <Text
                        style={[styles.fileName, { color: textColor }]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {file.name}
                      </Text>
                      {file.size && (
                        <Text style={[styles.fileSize, { color: iconColor }]}>
                          {formatFileSize(file.size)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {isMultipleSelection && (
                  <View style={styles.multipleSelection}>
                    <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                    <Text style={[styles.selectionTitle, { color: textColor }]}>
                      {getTitle()}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionItem,
                      action.disabled && styles.disabledAction,
                      index === actions.length - 1 && styles.lastAction,
                    ]}
                    onPress={() => handleAction(action.id)}
                    disabled={action.disabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionContent}>
                      <View
                        style={[
                          styles.actionIcon,
                          {
                            backgroundColor: action.destructive
                              ? '#FF3B3026'
                              : `${tintColor}26`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={action.icon}
                          size={20}
                          color={
                            action.disabled
                              ? iconColor + '50'
                              : action.destructive
                              ? '#FF3B30'
                              : action.color || tintColor
                          }
                        />
                      </View>
                      <View style={styles.actionText}>
                        <Text
                          style={[
                            styles.actionLabel,
                            {
                              color: action.disabled
                                ? iconColor + '50'
                                : action.destructive
                                ? '#FF3B30'
                                : textColor,
                            },
                          ]}
                        >
                          {action.label}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={`${iconColor}99`}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel button */}
              <View style={styles.cancelContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: `${iconColor}1A` }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: textColor }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 13,
  },
  multipleSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  actionItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000033',
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  disabledAction: {
    opacity: 0.5,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});