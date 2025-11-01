import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import {
  FormulaInputState,
  FormulaSuggestion,
  CellValue,
} from "@/types/spreadsheet";
import { SpreadsheetService } from "@/services/spreadsheetService";
import { FormulaEngine, FunctionDefinition } from "@/services/formulaEngine";

interface FormulaInputProps {
  isVisible: boolean;
  cellRef?: string;
  initialFormula?: string;
  onSave: (formula: string) => void;
  onCancel: () => void;
  onPreview?: (formula: string) => Promise<CellValue>;
  readOnly?: boolean;
}

// Get functions from FormulaEngine
const getAllFunctions = (): FunctionDefinition[] => {
  return FormulaEngine.getFunctions();
};

const COMMON_FUNCTIONS = [
  "SUM", "AVERAGE", "COUNT", "MAX", "MIN", "IF", 
  "ROUND", "ABS", "CONCATENATE", "NOW", "TODAY"
];

export const FormulaInput: React.FC<FormulaInputProps> = ({
  isVisible,
  cellRef,
  initialFormula = "",
  onSave,
  onCancel,
  onPreview,
  readOnly = false,
}) => {
  const [formulaState, setFormulaState] = useState<FormulaInputState>({
    isVisible: false,
    formula: "",
    suggestions: [],
    cursorPosition: 0,
  });

  const [previewResult, setPreviewResult] = useState<CellValue | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Initialize formula state
  useEffect(() => {
    if (isVisible) {
      const formula = initialFormula.startsWith("=")
        ? initialFormula
        : `=${initialFormula}`;
      setFormulaState({
        isVisible: true,
        cellRef: cellRef || "",
        formula,
        suggestions: [],
        cursorPosition: formula.length,
      });
      setShowSuggestions(false);
    } else {
      setFormulaState({
        isVisible: false,
        formula: "",
        suggestions: [],
        cursorPosition: 0,
      });
      setPreviewResult(null);
    }
  }, [isVisible, initialFormula, cellRef]);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  // Get formula suggestions
  const getSuggestions = useCallback(
    async (
      formula: string,
      cursorPos: number
    ): Promise<FormulaSuggestion[]> => {
      const suggestions: FormulaSuggestion[] = [];

      // Get the current word being typed
      const beforeCursor = formula.substring(0, cursorPos);
      const wordMatch = beforeCursor.match(/([A-Z]+)$/);

      if (wordMatch && wordMatch[1]) {
        const currentWord = wordMatch[1];

        // Get all available functions from FormulaEngine
        const allFunctions = getAllFunctions();
        
        // Filter functions that match the current input
        const functionSuggestions = allFunctions
          .filter((func) => func.name.startsWith(currentWord))
          .slice(0, 8) // Limit to 8 function suggestions
          .map((func) => ({
            type: "function" as const,
            text: func.name,
            description: func.description,
            insertText: func.syntax,
          }));

        suggestions.push(...functionSuggestions);
      }

      // Add cell reference suggestions (A1, B2, etc.)
      const cellMatch = beforeCursor.match(/([A-Z]*)(\d*)$/);
      if (cellMatch) {
        const [, letters, numbers] = cellMatch;
        if (letters && numbers) {
          // Complete cell reference
          suggestions.push({
            type: "cell",
            text: `${letters}${numbers}`,
            description: `Cell reference ${letters}${numbers}`,
            insertText: `${letters}${numbers}`,
          });
        } else if (letters && letters.length > 0) {
          // Suggest column completions
          for (let i = 1; i <= 10; i++) {
            suggestions.push({
              type: "cell",
              text: `${letters}${i}`,
              description: `Cell reference ${letters}${i}`,
              insertText: `${letters}${i}`,
            });
          }
        }
      }

      // Add range suggestions (A1:B10, etc.)
      const rangeMatch = beforeCursor.match(/([A-Z]+\d+):([A-Z]*)(\d*)$/);
      if (rangeMatch) {
        const [, startRef, endLetters, endNumbers] = rangeMatch;
        if (endLetters && !endNumbers) {
          // Suggest range completions
          for (let i = 1; i <= 10; i++) {
            suggestions.push({
              type: "range",
              text: `${startRef}:${endLetters}${i}`,
              description: `Range ${startRef}:${endLetters}${i}`,
              insertText: `${endLetters}${i}`,
            });
          }
        }
      }

      return suggestions.slice(0, 10); // Limit to 10 suggestions total
    },
    []
  );

  // Handle formula change
  const handleFormulaChange = useCallback(
    async (text: string) => {
      // Ensure formula starts with =
      if (!text.startsWith("=")) {
        text = `=${text}`;
      }

      setFormulaState((prev) => ({
        ...prev,
        formula: text,
      }));

      // Get suggestions based on current input
      const suggestions = await getSuggestions(
        text,
        formulaState.cursorPosition
      );
      setFormulaState((prev) => ({
        ...prev,
        suggestions,
      }));

      setShowSuggestions(suggestions.length > 0);

      // Preview result if possible
      if (onPreview && text.length > 1) {
        try {
          const result = await onPreview(text);
          setPreviewResult(result);
        } catch {
          setPreviewResult({ type: "error", value: "INVALID_VALUE" });
        }
      }
    },
    [formulaState.cursorPosition, onPreview, getSuggestions]
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: FormulaSuggestion) => {
      const beforeCursor = formulaState.formula.substring(
        0,
        formulaState.cursorPosition
      );
      const afterCursor = formulaState.formula.substring(
        formulaState.cursorPosition
      );

      // Find the word to replace
      const wordMatch = beforeCursor.match(/([A-Z]*)$/);
      const wordStart = wordMatch
        ? beforeCursor.length - wordMatch[1].length
        : formulaState.cursorPosition;

      const newFormula = `${formulaState.formula.substring(0, wordStart)}${
        suggestion.insertText
      }${afterCursor}`;

      setFormulaState((prev) => ({
        ...prev,
        formula: newFormula,
        cursorPosition: wordStart + suggestion.insertText.length,
      }));

      setShowSuggestions(false);
      handleFormulaChange(newFormula);
    },
    [formulaState.formula, formulaState.cursorPosition, handleFormulaChange]
  );

  // Handle cursor position change
  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number } } }) => {
      setFormulaState((prev) => ({
        ...prev,
        cursorPosition: event.nativeEvent.selection.start,
      }));
    },
    []
  );

  // Handle save
  const handleSave = useCallback(() => {
    const validation = SpreadsheetService.validateFormula(formulaState.formula);
    if (validation.isValid) {
      onSave(formulaState.formula);
    } else {
      // Show validation error
      setPreviewResult({ type: "error", value: "INVALID_VALUE" });
    }
  }, [formulaState.formula, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Insert function at cursor
  const insertFunction = useCallback(
    (functionName: string) => {
      const beforeCursor = formulaState.formula.substring(
        0,
        formulaState.cursorPosition
      );
      const afterCursor = formulaState.formula.substring(
        formulaState.cursorPosition
      );
      const newFormula = `${beforeCursor}${functionName}()${afterCursor}`;

      setFormulaState((prev) => ({
        ...prev,
        formula: newFormula,
        cursorPosition: formulaState.cursorPosition + functionName.length + 1,
      }));

      handleFormulaChange(newFormula);
    },
    [formulaState.formula, formulaState.cursorPosition, handleFormulaChange]
  );

  // Render suggestion item
  const renderSuggestion = useCallback(
    ({ item }: { item: FormulaSuggestion }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionSelect(item)}
      >
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionText}>{item.text}</Text>
          <View
            style={[
              styles.suggestionType,
              { backgroundColor: getSuggestionTypeColor(item.type) },
            ]}
          >
            <Text style={styles.suggestionTypeText}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.suggestionDescription}>{item.description}</Text>
      </TouchableOpacity>
    ),
    [handleSuggestionSelect]
  );

  // Get suggestion type color
  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case "function":
        return "#4CAF50";
      case "cell":
        return "#2196F3";
      case "range":
        return "#FF9800";
      case "named-range":
        return "#9C27B0";
      default:
        return "#757575";
    }
  };

  // Render function buttons
  const renderFunctionButtons = () => (
    <View style={styles.functionButtons}>
      {COMMON_FUNCTIONS.map((funcName) => (
        <TouchableOpacity
          key={funcName}
          style={styles.functionButton}
          onPress={() => insertFunction(funcName)}
        >
          <Text style={styles.functionButtonText}>{funcName}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="calculator" size={20} color={Colors.light.tint} />
            <Text style={styles.headerTitle}>Formula Editor</Text>
            {cellRef && <Text style={styles.cellReference}>{cellRef}</Text>}
          </View>

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

        {/* Formula Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.formulaInput}
            value={formulaState.formula}
            onChangeText={handleFormulaChange}
            onSelectionChange={handleSelectionChange}
            placeholder="=SUM(A1:A10)"
            placeholderTextColor={Colors.light.tabIconDefault}
            multiline
            textAlignVertical="top"
            editable={!readOnly}
            autoCorrect={false}
            autoCapitalize="characters"
            spellCheck={false}
            selection={{
              start: formulaState.cursorPosition,
              end: formulaState.cursorPosition,
            }}
          />
        </View>

        {/* Preview Result */}
        {previewResult && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <Text
              style={[
                styles.previewValue,
                previewResult.type === "error" && styles.previewError,
              ]}
            >
              {previewResult.type === "error"
                ? `#${previewResult.value}`
                : SpreadsheetService.formatCellValue({
                    value: previewResult,
                    format: SpreadsheetService.createDefaultCellFormat(),
                  })}
            </Text>
          </View>
        )}

        {/* Function Buttons */}
        {renderFunctionButtons()}

        {/* Suggestions */}
        {showSuggestions && formulaState.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            <FlatList
              data={formulaState.suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) =>
                `${item.type}-${item.text}-${index}`
              }
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: Colors.light.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cellReference: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  formulaInput: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.tabIconDefault,
    marginRight: 8,
  },
  previewValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600",
  },
  previewError: {
    color: "#f44336",
  },
  functionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  functionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
  },
  functionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  suggestionType: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestionTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  suggestionDescription: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
});
