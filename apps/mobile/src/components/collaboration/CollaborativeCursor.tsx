import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { CollaborativeCursor as CursorType, CollaborationUser } from '../../types/collaboration';

interface CollaborativeCursorProps {
  cursor: CursorType;
  user: CollaborationUser;
  editorRef: React.RefObject<any>;
  isVisible?: boolean;
}

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  cursor,
  user,
  editorRef,
  isVisible = true,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isVisible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim, pulseAnim]);

  useEffect(() => {
    // Calculate cursor position based on text position
    // This is a simplified implementation - in practice, you'd need to
    // measure the actual text layout in the editor
    calculateCursorPosition();
  }, [cursor.position, cursor.selection]);

  const calculateCursorPosition = () => {
    // This is a placeholder implementation
    // In a real app, you'd need to:
    // 1. Get the text layout from the rich text editor
    // 2. Calculate the actual pixel position of the cursor
    // 3. Handle line wrapping, font sizes, etc.
    
    const { width } = Dimensions.get('window');
    const lineHeight = 24; // Approximate line height
    const charWidth = 8; // Approximate character width
    
    // Simple calculation based on character position
    const line = Math.floor(cursor.position / 50); // Assume 50 chars per line
    const column = cursor.position % 50;
    
    setPosition({
      x: Math.min(column * charWidth, width - 100),
      y: line * lineHeight + 100, // Offset for header
    });
  };

  const renderCursor = () => (
    <Animated.View
      style={[
        styles.cursor,
        {
          backgroundColor: user.color,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale: pulseAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    />
  );

  const renderSelection = () => {
    if (!cursor.selection || cursor.selection.start === cursor.selection.end) {
      return null;
    }

    // Calculate selection rectangle
    const selectionLength = cursor.selection.end - cursor.selection.start;
    const selectionWidth = Math.min(selectionLength * 8, Dimensions.get('window').width - position.x - 20);

    return (
      <Animated.View
        style={[
          styles.selection,
          {
            backgroundColor: `${user.color}40`, // 25% opacity
            width: selectionWidth,
            transform: [
              { translateX: position.x },
              { translateY: position.y },
            ],
            opacity: fadeAnim,
          },
        ]}
      />
    );
  };

  const renderUserLabel = () => (
    <Animated.View
      style={[
        styles.userLabel,
        {
          backgroundColor: user.color,
          transform: [
            { translateX: position.x },
            { translateY: position.y - 30 },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.userLabelText} numberOfLines={1}>
        {user.name}
      </Text>
    </Animated.View>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {renderSelection()}
      {renderCursor()}
      {renderUserLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  selection: {
    position: 'absolute',
    height: 20,
    borderRadius: 2,
  },
  userLabel: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 100,
  },
  userLabelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default CollaborativeCursor;