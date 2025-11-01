import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { SpreadsheetToolbarAction } from '@/types/spreadsheet';

interface SpreadsheetToolbarProps {
  selectedCell?: string;
  onAction: (action: string) => void;
  readOnly?: boolean;
  showFormulas?: boolean;
  loading?: boolean;
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  selectedCell,
  onAction,
  readOnly = false,
  showFormulas = false,
  loading = false,
}) => {
  const [activeGroup, setActiveGroup] = useState<string>('main');

  // Define toolbar actions
  const toolbarActions: SpreadsheetToolbarAction[] = [
    // Main actions
    {
      id: 'save',
      label: 'Save',
      icon: 'save-outline',
      action: () => onAction('save'),
      group: 'main',
      isDisabled: readOnly || loading,
    },
    {
      id: 'export',
      label: 'Export',
      icon: 'download-outline',
      action: () => onAction('export'),
      group: 'main',
    },
    {
      id: 'share',
      label: 'Share',
      icon: 'share-outline',
      action: () => onAction('share'),
      group: 'main',
    },
    {
      id: 'formula',
      label: 'Formula',
      icon: 'function',
      action: () => onAction('formula'),
      group: 'edit',
      isDisabled: readOnly,
    },
    
    // Edit actions
    {
      id: 'cut',
      label: 'Cut',
      icon: 'cut-outline',
      action: () => onAction('cut'),
      group: 'edit',
      isDisabled: readOnly,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'copy-outline',
      action: () => onAction('copy'),
      group: 'edit',
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: 'clipboard-outline',
      action: () => onAction('paste'),
      group: 'edit',
      isDisabled: readOnly,
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: 'arrow-undo-outline',
      action: () => onAction('undo'),
      group: 'edit',
      isDisabled: readOnly,
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: 'arrow-redo-outline',
      action: () => onAction('redo'),
      group: 'edit',
      isDisabled: readOnly,
    },
    
    // Format actions
    {
      id: 'bold',
      label: 'Bold',
      icon: 'text',
      action: () => onAction('bold'),
      group: 'format',
      isDisabled: readOnly,
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: 'text',
      action: () => onAction('italic'),
      group: 'format',
      isDisabled: readOnly,
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: 'text',
      action: () => onAction('underline'),
      group: 'format',
      isDisabled: readOnly,
    },
    {
      id: 'align-left',
      label: 'Align Left',
      icon: 'text-left',
      action: () => onAction('align-left'),
      group: 'format',
      isDisabled: readOnly,
    },
    {
      id: 'align-center',
      label: 'Center',
      icon: 'text-center',
      action: () => onAction('align-center'),
      group: 'format',
      isDisabled: readOnly,
    },
    {
      id: 'align-right',
      label: 'Align Right',
      icon: 'text-right',
      action: () => onAction('align-right'),
      group: 'format',
      isDisabled: readOnly,
    },
    
    // Insert actions
    {
      id: 'insert-row',
      label: 'Insert Row',
      icon: 'add-outline',
      action: () => onAction('insert-row'),
      group: 'insert',
      isDisabled: readOnly,
    },
    {
      id: 'insert-column',
      label: 'Insert Column',
      icon: 'add-outline',
      action: () => onAction('insert-column'),
      group: 'insert',
      isDisabled: readOnly,
    },
    {
      id: 'delete-row',
      label: 'Delete Row',
      icon: 'remove-outline',
      action: () => onAction('delete-row'),
      group: 'insert',
      isDisabled: readOnly,
    },
    {
      id: 'delete-column',
      label: 'Delete Column',
      icon: 'remove-outline',
      action: () => onAction('delete-column'),
      group: 'insert',
      isDisabled: readOnly,
    },
    
    // View actions
    {
      id: 'zoom-in',
      label: 'Zoom In',
      icon: 'add-circle-outline',
      action: () => onAction('zoom-in'),
      group: 'view',
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      icon: 'remove-circle-outline',
      action: () => onAction('zoom-out'),
      group: 'view',
    },
    {
      id: 'fit-to-screen',
      label: 'Fit to Screen',
      icon: 'expand-outline',
      action: () => onAction('fit-to-screen'),
      group: 'view',
    },
    {
      id: 'toggle-formulas',
      label: showFormulas ? 'Hide Formulas' : 'Show Formulas',
      icon: 'eye-outline',
      action: () => onAction('toggle-formulas'),
      group: 'view',
      isActive: showFormulas,
    },
  ];

  // Get actions for current group
  const getCurrentGroupActions = useCallback(() => {
    return toolbarActions.filter(action => action.group === activeGroup);
  }, [activeGroup, toolbarActions]);

  // Render toolbar button
  const renderToolbarButton = useCallback((action: SpreadsheetToolbarAction) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.toolbarButton,
        action.isActive && styles.activeButton,
        action.isDisabled && styles.disabledButton,
      ]}
      onPress={action.action}
      disabled={action.isDisabled}
    >
      <Ionicons
        name={action.icon as any}
        size={20}
        color={
          action.isDisabled
            ? Colors.light.tabIconDefault
            : action.isActive
            ? '#fff'
            : Colors.light.text
        }
      />
      <Text
        style={[
          styles.toolbarButtonText,
          action.isActive && styles.activeButtonText,
          action.isDisabled && styles.disabledButtonText,
        ]}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  ), []);

  // Render group tab
  const renderGroupTab = useCallback((group: string, label: string) => (
    <TouchableOpacity
      key={group}
      style={[
        styles.groupTab,
        activeGroup === group && styles.activeGroupTab,
      ]}
      onPress={() => setActiveGroup(group)}
    >
      <Text
        style={[
          styles.groupTabText,
          activeGroup === group && styles.activeGroupTabText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  ), [activeGroup]);

  return (
    <View style={styles.container}>
      {/* Cell Reference and Loading */}
      <View style={styles.header}>
        <View style={styles.cellReference}>
          <Text style={styles.cellReferenceText}>{selectedCell || 'A1'}</Text>
          {loading && (
            <ActivityIndicator
              size="small"
              color={Colors.light.tint}
              style={styles.loadingIndicator}
            />
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, readOnly && styles.disabledButton]}
            onPress={() => onAction('save')}
            disabled={readOnly || loading}
          >
            <Ionicons
              name="save-outline"
              size={18}
              color={readOnly ? Colors.light.tabIconDefault : Colors.light.tint}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => onAction('export')}
          >
            <Ionicons name="download-outline" size={18} color={Colors.light.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => onAction('share')}
          >
            <Ionicons name="share-outline" size={18} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Group Tabs */}
      <View style={styles.groupTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupTabsContent}
        >
          {renderGroupTab('main', 'Main')}
          {renderGroupTab('edit', 'Edit')}
          {renderGroupTab('format', 'Format')}
          {renderGroupTab('insert', 'Insert')}
          {renderGroupTab('view', 'View')}
        </ScrollView>
      </View>

      {/* Toolbar Actions */}
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {getCurrentGroupActions().map(renderToolbarButton)}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cellReference: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cellReferenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupTabsContent: {
    paddingHorizontal: 16,
  },
  groupTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
  },
  activeGroupTab: {
    backgroundColor: Colors.light.tint,
  },
  groupTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  activeGroupTabText: {
    color: '#fff',
  },
  toolbar: {
    paddingVertical: 8,
  },
  toolbarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
  },
  activeButton: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  disabledButton: {
    opacity: 0.5,
  },
  toolbarButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.text,
    marginTop: 2,
    textAlign: 'center',
  },
  activeButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: Colors.light.tabIconDefault,
  },
});