import { FormulaEngine, FunctionDefinition } from './formulaEngine';
import { FormulaSuggestion, CellReference } from '@/types/spreadsheet';

export interface AutocompleteContext {
  currentSheetId: string;
  availableSheets: string[];
  namedRanges: Record<string, string>;
  recentCells: string[];
}

export class FormulaAutocompleteService {
  private static functionCache: FunctionDefinition[] | null = null;

  /**
   * Get formula suggestions based on current input
   */
  static getSuggestions(
    formula: string,
    cursorPosition: number,
    context: AutocompleteContext
  ): FormulaSuggestion[] {
    const suggestions: FormulaSuggestion[] = [];
    
    // Get text before cursor
    const beforeCursor = formula.substring(0, cursorPosition);
    const afterCursor = formula.substring(cursorPosition);
    
    // Determine what type of suggestion to provide
    const suggestionType = this.determineSuggestionType(beforeCursor);
    
    switch (suggestionType.type) {
      case 'function':
        suggestions.push(...this.getFunctionSuggestions(suggestionType.partial));
        break;
        
      case 'cell':
        suggestions.push(...this.getCellSuggestions(suggestionType.partial, context));
        break;
        
      case 'range':
        suggestions.push(...this.getRangeSuggestions(suggestionType.partial, context));
        break;
        
      case 'sheet':
        suggestions.push(...this.getSheetSuggestions(suggestionType.partial, context));
        break;
        
      case 'named-range':
        suggestions.push(...this.getNamedRangeSuggestions(suggestionType.partial, context));
        break;
    }
    
    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }

  /**
   * Determine what type of suggestion to provide based on context
   */
  private static determineSuggestionType(beforeCursor: string): {
    type: 'function' | 'cell' | 'range' | 'sheet' | 'named-range';
    partial: string;
  } {
    // Check for function name (after = or operator)
    const functionMatch = beforeCursor.match(/[=+\-*/(),\s]([A-Z]+)$/);
    if (functionMatch) {
      return { type: 'function', partial: functionMatch[1] };
    }
    
    // Check for sheet reference (Sheet1!)
    const sheetMatch = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)!$/);
    if (sheetMatch) {
      return { type: 'cell', partial: '' };
    }
    
    // Check for partial sheet name
    const partialSheetMatch = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    if (partialSheetMatch && beforeCursor.includes('!')) {
      return { type: 'sheet', partial: partialSheetMatch[1] };
    }
    
    // Check for range (A1:)
    const rangeMatch = beforeCursor.match(/([A-Z]+\d+):([A-Z]*)(\d*)$/);
    if (rangeMatch) {
      return { type: 'range', partial: rangeMatch[2] + rangeMatch[3] };
    }
    
    // Check for cell reference
    const cellMatch = beforeCursor.match(/([A-Z]*)(\d*)$/);
    if (cellMatch) {
      return { type: 'cell', partial: cellMatch[1] + cellMatch[2] };
    }
    
    // Default to function
    return { type: 'function', partial: '' };
  }

  /**
   * Get function suggestions
   */
  private static getFunctionSuggestions(partial: string): FormulaSuggestion[] {
    if (!this.functionCache) {
      this.functionCache = FormulaEngine.getFunctions();
    }
    
    return this.functionCache
      .filter(func => func.name.startsWith(partial.toUpperCase()))
      .map(func => ({
        type: 'function',
        text: func.name,
        description: func.description,
        insertText: func.name + '(',
      }));
  }

  /**
   * Get cell reference suggestions
   */
  private static getCellSuggestions(
    partial: string,
    context: AutocompleteContext
  ): FormulaSuggestion[] {
    const suggestions: FormulaSuggestion[] = [];
    
    // Parse partial cell reference
    const match = partial.match(/^([A-Z]*)(\d*)$/);
    if (!match) return suggestions;
    
    const [, letters, numbers] = match;
    
    if (letters && numbers) {
      // Complete cell reference
      suggestions.push({
        type: 'cell',
        text: `${letters}${numbers}`,
        description: `Cell ${letters}${numbers}`,
        insertText: `${letters}${numbers}`,
      });
    } else if (letters) {
      // Suggest row numbers for the column
      for (let i = 1; i <= 20; i++) {
        suggestions.push({
          type: 'cell',
          text: `${letters}${i}`,
          description: `Cell ${letters}${i}`,
          insertText: `${letters}${i}`,
        });
      }
    } else {
      // Suggest common column letters
      const commonColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      for (const col of commonColumns) {
        suggestions.push({
          type: 'cell',
          text: col,
          description: `Column ${col}`,
          insertText: `${col}1`,
        });
      }
    }
    
    // Add recent cells
    for (const recentCell of context.recentCells.slice(0, 3)) {
      if (recentCell.startsWith(partial)) {
        suggestions.push({
          type: 'cell',
          text: recentCell,
          description: `Recent cell ${recentCell}`,
          insertText: recentCell,
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Get range suggestions
   */
  private static getRangeSuggestions(
    partial: string,
    context: AutocompleteContext
  ): FormulaSuggestion[] {
    const suggestions: FormulaSuggestion[] = [];
    
    // Common range patterns
    const patterns = [
      { pattern: 'A1:A10', description: 'Column A, rows 1-10' },
      { pattern: 'A1:J1', description: 'Row 1, columns A-J' },
      { pattern: 'A1:J10', description: 'Range A1 to J10' },
      { pattern: 'B2:E5', description: 'Range B2 to E5' },
    ];
    
    for (const { pattern, description } of patterns) {
      if (pattern.includes(partial) || partial === '') {
        suggestions.push({
          type: 'range',
          text: pattern,
          description,
          insertText: pattern,
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Get sheet name suggestions
   */
  private static getSheetSuggestions(
    partial: string,
    context: AutocompleteContext
  ): FormulaSuggestion[] {
    return context.availableSheets
      .filter(sheet => sheet.toLowerCase().startsWith(partial.toLowerCase()))
      .map(sheet => ({
        type: 'sheet' as const,
        text: sheet,
        description: `Sheet ${sheet}`,
        insertText: `${sheet}!`,
      }));
  }

  /**
   * Get named range suggestions
   */
  private static getNamedRangeSuggestions(
    partial: string,
    context: AutocompleteContext
  ): FormulaSuggestion[] {
    return Object.keys(context.namedRanges)
      .filter(name => name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(name => ({
        type: 'named-range',
        text: name,
        description: `Named range: ${context.namedRanges[name]}`,
        insertText: name,
      }));
  }

  /**
   * Validate formula syntax
   */
  static validateFormula(formula: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    if (!formula.startsWith('=')) {
      errors.push('Formula must start with =');
      return { isValid: false, errors, suggestions };
    }
    
    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses');
      if (openParens > closeParens) {
        suggestions.push('Add closing parenthesis');
      } else {
        suggestions.push('Remove extra closing parenthesis');
      }
    }
    
    // Check for valid function names
    const functionMatches = formula.match(/[A-Z]+\(/g);
    if (functionMatches) {
      const availableFunctions = FormulaEngine.getFunctions().map(f => f.name);
      
      for (const match of functionMatches) {
        const funcName = match.slice(0, -1); // Remove opening parenthesis
        if (!availableFunctions.includes(funcName)) {
          errors.push(`Unknown function: ${funcName}`);
          
          // Suggest similar function names
          const similar = availableFunctions.filter(f => 
            f.includes(funcName) || funcName.includes(f)
          );
          if (similar.length > 0) {
            suggestions.push(`Did you mean: ${similar[0]}?`);
          }
        }
      }
    }
    
    // Check for valid cell references
    const cellMatches = formula.match(/[A-Z]+\d+/g);
    if (cellMatches) {
      for (const cellRef of cellMatches) {
        if (!this.isValidCellReference(cellRef)) {
          errors.push(`Invalid cell reference: ${cellRef}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Check if cell reference is valid
   */
  private static isValidCellReference(cellRef: string): boolean {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/);
    if (!match) return false;
    
    const [, column, row] = match;
    
    // Check column (max ZZ = 702 columns)
    if (column.length > 2) return false;
    if (column.length === 2 && column > 'ZZ') return false;
    
    // Check row (max 1048576 in Excel)
    const rowNum = parseInt(row);
    if (rowNum < 1 || rowNum > 1048576) return false;
    
    return true;
  }

  /**
   * Format formula for display with syntax highlighting
   */
  static formatFormula(formula: string): Array<{
    text: string;
    type: 'function' | 'cell' | 'operator' | 'string' | 'number' | 'default';
  }> {
    const tokens: Array<{ text: string; type: string }> = [];
    let i = 0;
    
    while (i < formula.length) {
      const char = formula[i];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        tokens.push({ text: char, type: 'default' });
        i++;
        continue;
      }
      
      // Numbers
      if (/\d/.test(char) || char === '.') {
        let number = '';
        while (i < formula.length && /[\d.]/.test(formula[i])) {
          number += formula[i];
          i++;
        }
        tokens.push({ text: number, type: 'number' });
        continue;
      }
      
      // Strings
      if (char === '"') {
        let string = '"';
        i++; // Skip opening quote
        while (i < formula.length && formula[i] !== '"') {
          string += formula[i];
          i++;
        }
        if (i < formula.length) {
          string += '"';
          i++; // Skip closing quote
        }
        tokens.push({ text: string, type: 'string' });
        continue;
      }
      
      // Functions and cell references
      if (/[A-Za-z]/.test(char)) {
        let identifier = '';
        while (i < formula.length && /[A-Za-z0-9_]/.test(formula[i])) {
          identifier += formula[i];
          i++;
        }
        
        // Check if it's a function (followed by opening parenthesis)
        if (i < formula.length && formula[i] === '(') {
          tokens.push({ text: identifier, type: 'function' });
        } else if (/^[A-Z]+\d+$/.test(identifier)) {
          // Cell reference
          tokens.push({ text: identifier, type: 'cell' });
        } else {
          tokens.push({ text: identifier, type: 'default' });
        }
        continue;
      }
      
      // Operators
      if ('+-*/^=<>!(),:'.includes(char)) {
        tokens.push({ text: char, type: 'operator' });
        i++;
        continue;
      }
      
      // Default
      tokens.push({ text: char, type: 'default' });
      i++;
    }
    
    return tokens as Array<{
      text: string;
      type: 'function' | 'cell' | 'operator' | 'string' | 'number' | 'default';
    }>;
  }
}