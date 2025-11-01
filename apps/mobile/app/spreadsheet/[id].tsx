import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { SpreadsheetInterface } from '@/components/spreadsheet';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';

export default function SpreadsheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    spreadsheet,
    loading,
    error,
    saving,
    updateCell,
    addSheet,
    renameSheet,
    deleteSheet,
    duplicateSheet,
    exportSpreadsheet,
    saveSpreadsheet,
  } = useSpreadsheet({
    spreadsheetId: id,
    autoSave: true,
    autoSaveInterval: 30000, // Auto-save every 30 seconds
  });

  // Handle cell edit
  const handleCellEdit = async (sheetId: string, cellRef: string, value: any, formula?: string) => {
    try {
      await updateCell(sheetId, cellRef, value, formula);
    } catch (error) {
      console.error('Error updating cell:', error);
      Alert.alert('Error', 'Failed to update cell');
    }
  };

  // Handle sheet change
  const handleSheetChange = (sheetId: string) => {
    console.log('Active sheet changed to:', sheetId);
  };

  // Handle zoom
  const handleZoom = (scale: number) => {
    console.log('Zoom changed to:', scale);
  };

  // Handle save
  const handleSave = async () => {
    try {
      await saveSpreadsheet();
      Alert.alert('Success', 'Spreadsheet saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save spreadsheet');
    }
  };

  // Handle export
  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      const blob = await exportSpreadsheet(format);
      if (blob) {
        Alert.alert('Success', `Spreadsheet exported as ${format.toUpperCase()}`);
        // In a real app, you would handle the blob (save to device, share, etc.)
      }
    } catch (error) {
      Alert.alert('Error', `Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Handle share
  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would open sharing options');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading spreadsheet...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!spreadsheet) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Spreadsheet not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SpreadsheetInterface
        spreadsheet={spreadsheet}
        onCellEdit={handleCellEdit}
        onSheetChange={handleSheetChange}
        onZoom={handleZoom}
        onSave={handleSave}
        onExport={handleExport}
        onShare={handleShare}
        loading={saving}
        error={error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});