import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Sheet } from '@/types/spreadsheet';

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onSheetAdd?: (title: string) => void;
  onSheetRename?: (sheetId: string, title: string) => void;
  onSheetDelete?: (sheetId: string) => void;
  onSheetDuplicate?: (sheetId: string) => void;
  readOnly?: boolean;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  onSheetChange,
  onSheetAdd,
  onSheetRename,
  onSheetDelete,
  onSheetDuplicate,
  readOnly = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [renamingSheetId, setRenamingSheetId] = useState<string | null>(null);

  // Handle sheet tab press
  const handleSheetPress = useCallback((sheetId: string) => {
    onSheetChange(sheetId);
  }, [onSheetChange]);

  // Handle sheet tab long press (context menu)
  const handleSheetLongPress = useCallback((sheet: Sheet) => {
    if (readOnly) return;

    const options = [
      { text: 'Rename', onPress: () => handleRenameSheet(sheet) },
      { text: 'Duplicate', onPress: () => handleDuplicateSheet(sheet) },
    ];

    // Only allow deletion if there's more than one sheet
    if (sheets.length > 1) {
      options.push({ text: 'Delete', onPress: () => handleDeleteSheet(sheet), style: 'destructive' as const });
    }

    options.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert(
      `Sheet: ${sheet.title}`,
      'Choose an action',
      options
    );
  }, [sheets.length, readOnly]);

  // Handle add new sheet
  const handleAddSheet = useCallback(() => {
    if (readOnly) return;
    setNewSheetTitle(`Sheet ${sheets.length + 1}`);
    setShowAddModal(true);
  }, [sheets.length, readOnly]);

  // Handle rename sheet
  const handleRenameSheet = useCallback((sheet: Sheet) => {
    setRenamingSheetId(sheet.id);
    setNewSheetTitle(sheet.title);
    setShowRenameModal(true);
  }, []);

  // Handle duplicate sheet
  const handleDuplicateSheet = useCallback((sheet: Sheet) => {
    onSheetDuplicate?.(sheet.id);
  }, [onSheetDuplicate]);

  // Handle delete sheet
  const handleDeleteSheet = useCallback((sheet: Sheet) => {
    Alert.alert(
      'Delete Sheet',
      `Are you sure you want to delete "${sheet.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onSheetDelete?.(sheet.id),
        },
      ]
    );
  }, [onSheetDelete]);

  // Confirm add sheet
  const confirmAddSheet = useCallback(() => {
    if (newSheetTitle.trim()) {
      onSheetAdd?.(newSheetTitle.trim());
      setShowAddModal(false);
      setNewSheetTitle('');
    }
  }, [newSheetTitle, onSheetAdd]);

  // Confirm rename sheet
  const confirmRenameSheet = useCallback(() => {
    if (newSheetTitle.trim() && renamingSheetId) {
      onSheetRename?.(renamingSheetId, newSheetTitle.trim());
      setShowRenameModal(false);
      setNewSheetTitle('');
      setRenamingSheetId(null);
    }
  }, [newSheetTitle, renamingSheetId, onSheetRename]);

  // Cancel modal
  const cancelModal = useCallback(() => {
    setShowAddModal(false);
    setShowRenameModal(false);
    setNewSheetTitle('');
    setRenamingSheetId(null);
  }, []);

  // Render sheet tab
  const renderSheetTab = useCallback((sheet: Sheet) => {
    const isActive = sheet.id === activeSheetId;
    
    return (
      <TouchableOpacity
        key={sheet.id}
        style={[
          styles.sheetTab,
          isActive && styles.activeSheetTab,
          sheet.isHidden && styles.hiddenSheetTab,
        ]}
        onPress={() => handleSheetPress(sheet.id)}
        onLongPress={() => handleSheetLongPress(sheet)}
        activeOpacity={0.7}
      >
        {/* Tab Color Indicator */}
        {sheet.tabColor && (
          <View
            style={[
              styles.tabColorIndicator,
              {
                backgroundColor: `rgba(${sheet.tabColor.red * 255}, ${sheet.tabColor.green * 255}, ${sheet.tabColor.blue * 255}, ${sheet.tabColor.alpha})`,
              },
            ]}
          />
        )}
        
        {/* Sheet Title */}
        <Text
          style={[
            styles.sheetTabText,
            isActive && styles.activeSheetTabText,
            sheet.isHidden && styles.hiddenSheetTabText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {sheet.title}
        </Text>
        
        {/* Sheet Index */}
        <Text
          style={[
            styles.sheetIndex,
            isActive && styles.activeSheetIndex,
          ]}
        >
          {sheet.index + 1}
        </Text>
      </TouchableOpacity>
    );
  }, [activeSheetId, handleSheetPress, handleSheetLongPress]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {/* Sheet Tabs */}
        {sheets
          .sort((a, b) => a.index - b.index)
          .map(renderSheetTab)}
        
        {/* Add Sheet Button */}
        {!readOnly && (
          <TouchableOpacity
            style={styles.addSheetButton}
            onPress={handleAddSheet}
          >
            <Ionicons name="add" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Sheet Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={cancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Sheet</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newSheetTitle}
              onChangeText={setNewSheetTitle}
              placeholder="Sheet name"
              placeholderTextColor={Colors.light.tabIconDefault}
              autoFocus
              selectTextOnFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAddSheet}
                disabled={!newSheetTitle.trim()}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Sheet Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={cancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rename Sheet</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newSheetTitle}
              onChangeText={setNewSheetTitle}
              placeholder="Sheet name"
              placeholderTextColor={Colors.light.tabIconDefault}
              autoFocus
              selectTextOnFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmRenameSheet}
                disabled={!newSheetTitle.trim()}
              >
                <Text style={styles.confirmButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  sheetTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    maxWidth: 120,
    position: 'relative',
  },
  activeSheetTab: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  hiddenSheetTab: {
    opacity: 0.6,
  },
  tabColorIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  sheetTabText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  activeSheetTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  hiddenSheetTabText: {
    fontStyle: 'italic',
  },
  sheetIndex: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
    marginLeft: 4,
    minWidth: 12,
    textAlign: 'center',
  },
  activeSheetIndex: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addSheetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: Colors.light.tint,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});