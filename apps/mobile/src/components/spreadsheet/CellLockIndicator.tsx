import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpreadsheetCellLock } from '@/types/spreadsheetCollaboration';

interface CellLockIndicatorProps {
  lock: SpreadsheetCellLock;
  userName: string;
  userColor: string;
  cellSize: { width: number; height: number };
  position: { x: number; y: number };
}

export const CellLockIndicator: React.FC<CellLockIndicatorProps> = ({
  lock,
  userName,
  userColor,
  cellSize,
  position,
}) => {
  const getLockIcon = () => {
    switch (lock.lockType) {
      case 'editing':
        return '✏️';
      case 'formatting':
        return '🎨';
      case 'formula':
        return '📊';
      default:
        return '🔒';
    }
  };

  const getLockDescription = () => {
    switch (lock.lockType) {
      case 'editing':
        return 'Editing';
      case 'formatting':
        return 'Formatting';
      case 'formula':
        return 'Formula';
      default:
        return 'Locked';
    }
  };

  const timeRemaining = lock.expiresAt ? Math.max(0, lock.expiresAt.getTime() - Date.now()) : 0;
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]}>
      {/* Lock overlay */}
      <View
        style={[
          styles.lockOverlay,
          {
            width: cellSize.width,
            height: cellSize.height,
            backgroundColor: `${userColor}20`, // 20% opacity
            borderColor: userColor,
          },
        ]}
      >
        {/* Lock icon */}
        <View style={[styles.lockIcon, { backgroundColor: userColor }]}>
          <Text style={styles.lockIconText}>{getLockIcon()}</Text>
        </View>

        {/* Lock info */}
        <View style={[styles.lockInfo, { backgroundColor: userColor }]}>
          <Text style={styles.lockInfoText} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.lockTypeText} numberOfLines={1}>
            {getLockDescription()}
          </Text>
          {secondsRemaining > 0 && secondsRemaining < 60 && (
            <Text style={styles.timeRemainingText}>
              {secondsRemaining}s
            </Text>
          )}
        </View>
      </View>

      {/* Lock border */}
      <View
        style={[
          styles.lockBorder,
          {
            width: cellSize.width + 2,
            height: cellSize.height + 2,
            borderColor: userColor,
            left: -1,
            top: -1,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 8,
  },
  lockOverlay: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 3,
    borderStyle: 'solid',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9,
  },
  lockIconText: {
    fontSize: 8,
    color: 'white',
  },
  lockInfo: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 9,
  },
  lockInfoText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockTypeText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  timeRemainingText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 1,
  },
});

export default CellLockIndicator;