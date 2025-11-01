import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import {
  CellValue,
  CellEditingState,
  Cell,
} from '@/types/spreadsheet';
import { SpreadsheetService } from '@/services/spreadsheetService';

interface CellEditorProps {
  isVisible: boolean;
  cellRef?: string;
  cell?: Cell;
  onSave: (value: CellValue, formula?: string) => void;
  onCancel: () => void;
  onFormulaMode: () => void;
  readOnly?: boolean;
}

export const CellEditor: React.FC<CellEditorProps> = ({
  isVisible,
  cellRef,
  cell,
  onSave,
  onCancel,
  onFormulaMode,
  readOnly = false,
}) => {
  const [editingState, setEditingState] = useState<CellEditingState>({
    isEditing: false,
    value: '',
    keyboardType: 'default',
  });
  
  const inputRef = useRef<TextInput>(null);

  // Initialize editing state when cell changes
  useEffect(() => {
    if (isVisible && cell) {
      const displayValue = cell.formula || SpreadsheetService.formatCellValue(cell);
      const keyboardType = determineKeyboardType(cell.value);
      
      setEditingState({
        isEditing: true,
        cellRef: cellRef || '',
        value: displayValue,
        formula: cell.formula || undefined,
        keyboardType,
      });
    } else {
      setEditingState({
        isEditing: false,
        value: '',
        keyboardType: 'default',
      });
    }
  }, [isVisible, cell, cellRef, determineKeyboardType]);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  // Parse input value to CellValue
  const parseValue = useCallback((input: string): CellValue => {
    if (!input || input.trim() === '') {
      return { type: 'empty' };
    }

    // Check for formula
    if (input.startsWith('=')) {
      return { type: 'string', value: input }; // Will be handled as formula
    }

    // Check for boolean
    const lowerInput = input.toLowerCase();
    if (lowerInput === 'true' || lowerInput === 'false') {
      return { type: 'boolean', value: lowerInput === 'true' };
    }

    // Check for number
    const numericValue = parseFloat(input);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      return { type: 'number', value: numericValue };
    }

    // Check for date
    const dateValue = new Date(input);
    if (!isNaN(dateValue.getTime()) && input.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)) {
      return { type: 'date', value: dateValue };
    }

    // Default to string
    return { type: 'string', value: input };
  }, []);

  // Determine appropriate keyboard type based on cell value
  const determineKeyboardType = useCallback((value: CellValue): 'default' | 'numeric' | 'decimal-pad' | 'number-pad' => {
    switch (value.type) {
      case 'number':
        return 'numeric';
      case 'string':
        // Check if it looks like a number
        if (/^\d*\.?\d*$/.test(editingState.value)) {
          return 'decimal-pad';
        }
        return 'default';
      default:
        return 'default';
    }
  }, [editingState.value]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    const parsedValue = parseValue(text);
    setEditingState(prev => ({
      ...prev,
      value: text,
      keyboardType: text.startsWith('=') ? 'default' : determineKeyboardType(parsedValue),
    }));
  }, [determineKeyboardType, parseValue]);

  // Handle save
  const handleSave = useCallback(() => {
    const trimmedValue = editingState.value.trim();
    
    if (trimmedValue.startsWith('=')) {
      // Formula
      const validation = SpreadsheetService.validateFormula(trimmedValue);
      if (!validation.isValid) {
        // Show error - for now just return error value
        onSave({ type: 'error', value: 'INVALID_VALUE' }, trimmedValue);
        return;
      }
      onSave({ type: 'string', value: '' }, trimmedValue); // Formula will be calculated by backend
    } else {
      // Regular value
      const cellValue = parseValue(trimmedValue);
      onSave(cellValue);
    }
  }, [editingState.value, onSave, parseValue]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle formula mode
  const handleFormulaMode = useCallback(() => {
    onFormulaMode();
  }, [onFormulaMode]);

  // Render keyboard toolbar
  const renderKeyboardToolbar = () => (
    <View style={styles.keyboardToolbar}>
      <View style={styles.toolbarLeft}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}=`)}
        >
          <Text style={styles.toolbarButtonText}>=</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}+`)}
        >
          <Text style={styles.toolbarButtonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}-`)}
        >
          <Text style={styles.toolbarButtonText}>-</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}*`)}
        >
          <Text style={styles.toolbarButtonText}>×</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}/`)}
        >
          <Text style={styles.toolbarButtonText}>÷</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value}(`)}
        >
          <Text style={styles.toolbarButtonText}>(</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => handleTextChange(`${editingState.value})`)}
        >
          <Text style={styles.toolbarButtonText}>)</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toolbarRight}>
        <TouchableOpacity
          style={styles.formulaButton}
          onPress={handleFormulaMode}
        >
          <Ionicons name="calculator" size={16} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.cellReference}>{cellRef}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={20} color={Colors.light.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.headerButton, styles.saveButton]}
                onPress={handleSave}
                disabled={readOnly}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={editingState.value}
              onChangeText={handleTextChange}
              placeholder="Enter value or formula"
              placeholderTextColor={Colors.light.tabIconDefault}
              keyboardType={editingState.keyboardType}
              multiline
              textAlignVertical="top"
              editable={!readOnly}
              selectTextOnFocus
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>

          {/* Keyboard Toolbar */}
          {Platform.OS === 'ios' && renderKeyboardToolbar()}

          {/* Value Type Indicator */}
          <View style={styles.footer}>
            <Text style={styles.valueTypeText}>
              {editingState.value.startsWith('=') 
                ? 'Formula' 
                : parseValue(editingState.value).type.toUpperCase()
              }
            </Text>
            
            {editingState.value.startsWith('=') && (
              <View style={styles.formulaIndicator}>
                <Ionicons name="calculator" size={12} color={Colors.light.tint} />
                <Text style={styles.formulaText}>Formula Mode</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cellReference: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  inputContainer: {
    padding: 16,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    color: Colors.light.text,
    textAlignVertical: 'top',
    minHeight: 80,
    maxHeight: 200,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  formulaButton: {
    width: 36,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  valueTypeText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: 'capitalize',
  },
  formulaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  formulaText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
});