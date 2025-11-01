import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  useEffect as useReanimatedEffect,
} from 'react-native-reanimated';
import { SpreadsheetCollaborationUser } from '@/types/spreadsheetCollaboration';

interface CollaborativeCursorProps {
  user: SpreadsheetCollaborationUser;
  cellRef: string;
  position: { x: number; y: number };
  cellSize: { width: number; height: number };
  showUserName?: boolean;
  isCurrentUser?: boolean;
}

const CURSOR_WIDTH = 2;
const CURSOR_HEIGHT = 20;
const LABEL_HEIGHT = 24;
const LABEL_PADDING = 8;

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  user,
  cellRef,
  position,
  cellSize,
  showUserName = true,
  isCurrentUser = false,
}) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Animate cursor blinking for current user
  useReanimatedEffect(() => {
    if (isCurrentUser) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 500 }),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [isCurrentUser]);

  // Animate cursor appearance
  useReanimatedEffect(() => {
    scale.value = withTiming(1, { duration: 200 });
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Calculate label position to avoid overflow
  const labelWidth = (user.name.length * 8) + (LABEL_PADDING * 2);
  const labelX = Math.max(0, Math.min(position.x, 300 - labelWidth)); // Assuming max screen width
  const labelY = position.y - LABEL_HEIGHT - 4;

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]}>
      {/* Cursor line */}
      <Animated.View
        style={[
          styles.cursor,
          {
            backgroundColor: user.activeCellColor,
            width: CURSOR_WIDTH,
            height: Math.min(CURSOR_HEIGHT, cellSize.height),
          },
          cursorStyle,
        ]}
      />
      
      {/* Cell highlight */}
      <View
        style={[
          styles.cellHighlight,
          {
            borderColor: user.activeCellColor,
            width: cellSize.width,
            height: cellSize.height,
            left: -1,
            top: -1,
          },
        ]}
      />

      {/* User name label */}
      {showUserName && !isCurrentUser && (
        <Animated.View
          style={[
            styles.userLabel,
            {
              backgroundColor: user.activeCellColor,
              left: labelX - position.x,
              top: labelY - position.y,
            },
            labelStyle,
          ]}
        >
          <Text style={styles.userLabelText} numberOfLines={1}>
            {user.name}
          </Text>
          {user.isEditing && (
            <View style={styles.editingIndicator}>
              <Text style={styles.editingText}>✏️</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Editing indicator */}
      {user.isEditing && (
        <View
          style={[
            styles.editingBorder,
            {
              borderColor: user.activeCellColor,
              width: cellSize.width + 4,
              height: cellSize.height + 4,
              left: -3,
              top: -3,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  cursor: {
    position: 'absolute',
    borderRadius: 1,
  },
  cellHighlight: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  userLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LABEL_PADDING / 2,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
    zIndex: 11,
  },
  userLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  editingIndicator: {
    marginLeft: 4,
  },
  editingText: {
    fontSize: 8,
  },
  editingBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});

export default CollaborativeCursor;