import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: number;
  spacing?: number;
  minItemWidth?: number;
}

export function ResponsiveGrid({
  children,
  columns,
  spacing = 12,
  minItemWidth = 150,
}: ResponsiveGridProps) {
  const { width } = Dimensions.get('window');
  
  // Calculate optimal number of columns based on screen width and minimum item width
  const calculateColumns = () => {
    if (columns) return columns;
    
    const availableWidth = width - (spacing * 2); // Account for container padding
    const itemsPerRow = Math.floor(availableWidth / (minItemWidth + spacing));
    return Math.max(1, itemsPerRow);
  };

  const numColumns = calculateColumns();
  const itemWidth = (width - (spacing * (numColumns + 1))) / numColumns;

  const childrenArray = React.Children.toArray(children);
  const rows: ReactNode[][] = [];

  // Group children into rows
  for (let i = 0; i < childrenArray.length; i += numColumns) {
    rows.push(childrenArray.slice(i, i + numColumns));
  }

  return (
    <View style={[styles.container, { gap: spacing }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap: spacing }]}>
          {row.map((child, childIndex) => (
            <View
              key={childIndex}
              style={[
                styles.item,
                {
                  width: itemWidth,
                  minWidth: itemWidth,
                }
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill remaining space if row is not complete */}
          {row.length < numColumns &&
            Array.from({ length: numColumns - row.length }).map((_, index) => (
              <View
                key={`spacer-${index}`}
                style={[styles.item, { width: itemWidth, minWidth: itemWidth }]}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 0,
  },
});