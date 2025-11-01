import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
// import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface FileAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface FileContextMenuProps {
  visible: boolean;
  file: FileItem | null;
  position?: { x: number; y: number } | undefined;
  actions: FileAction[];
  onAction: (actionId: string, file: FileItem) => void;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  visible,
  file,
  position,
  actions,
  onAction,
  onClose,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  if (!visible || !file) return null;

  const menuWidth = 250;
  const menuHeight = actions.length * 56 + 16;

  // Calculate menu position to keep it on screen
  let menuX = position?.x || screenWidth / 2 - menuWidth / 2;
  let menuY = position?.y || screenHeight / 2 - menuHeight / 2;

  // Adjust if menu would go off screen
  if (menuX + menuWidth > screenWidth - 16) {
    menuX = screenWidth - menuWidth - 16;
  }
  if (menuX < 16) {
    menuX = 16;
  }
  if (menuY + menuHeight > screenHeight - 100) {
    menuY = screenHeight - menuHeight - 100;
  }
  if (menuY < 100) {
    menuY = 100;
  }

  const handleAction = (actionId: string) => {
    onAction(actionId, file);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            {
              backgroundColor,
              left: menuX,
              top: menuY,
              shadowColor: textColor,
            },
          ]}
        >
          {/* File info header */}
          <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
            <Ionicons
              name={file.type === 'folder' ? 'folder' : 'document'}
              size={20}
              color={tintColor}
            />
            <Text
              style={[styles.fileName, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {file.name}
            </Text>
          </View>

          {/* Actions */}
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionItem,
                action.disabled && styles.disabledAction,
              ]}
              onPress={() => handleAction(action.id)}
              disabled={action.disabled}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={
                  action.disabled
                    ? `${iconColor}80`
                    : action.destructive
                    ? '#FF3B30'
                    : action.color || iconColor
                }
              />
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: action.disabled
                      ? `${iconColor}80`
                      : action.destructive
                      ? '#FF3B30'
                      : textColor,
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menu: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    maxWidth: 280,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  disabledAction: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});