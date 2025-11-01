import {
  CellValue,
  DataValidation,
  BooleanCondition,
  ConditionValue,
  NumberFormat,
  CellFormat,
  ConditionalFormatRule,
  GradientRule,
  Color,
} from '@/types/spreadsheet';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  correctedValue?: CellValue;
}

export interface FormattingResult {
  formattedValue: string;
  displayValue: string;
}

export class DataValidationService {
  /**
   * Validate cell value against validation rules
   */
  static validateCellValue(
    value: CellValue,
    validation?: DataValidation
  ): ValidationResult {
    if (!validation) {
      return { isValid: true };
    }

    try {
      const isValid = this.evaluateCondition(value, validation.condition);
      
      if (!isValid) {
        return {
          isValid: false,
          error: validation.inputMessage || 'Invalid value',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Validation error',
      };
    }
  }

  /**
   * Evaluate boolean condition
   */
  private static evaluateCondition(
    value: CellValue,
    condition: BooleanCondition
  ): boolean {
    const { conditionType, values } = condition;

    switch (conditionType) {
      case 'NUMBER_GREATER':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a > b) : false;
      
      case 'NUMBER_GREATER_THAN_EQ':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a >= b) : false;
      
      case 'NUMBER_LESS':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a < b) : false;
      
      case 'NUMBER_LESS_THAN_EQ':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a <= b) : false;
      
      case 'NUMBER_EQ':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a === b) : false;
      
      case 'NUMBER_NOT_EQ':
        return values[0] ? this.compareNumbers(value, values[0], (a, b) => a !== b) : false;
      
      case 'NUMBER_BETWEEN':
        return values[0] && values[1] ? this.isNumberBetween(value, values[0], values[1]) : false;
      
      case 'NUMBER_NOT_BETWEEN':
        return values[0] && values[1] ? !this.isNumberBetween(value, values[0], values[1]) : false;
      
      case 'TEXT_CONTAINS':
        return values[0] ? this.textContains(value, values[0]) : false;
      
      case 'TEXT_NOT_CONTAINS':
        return values[0] ? !this.textContains(value, values[0]) : false;
      
      case 'TEXT_STARTS_WITH':
        return values[0] ? this.textStartsWith(value, values[0]) : false;
      
      case 'TEXT_ENDS_WITH':
        return values[0] ? this.textEndsWith(value, values[0]) : false;
      
      case 'TEXT_EQ':
        return values[0] ? this.textEquals(value, values[0]) : false;
      
      case 'TEXT_IS_EMAIL':
        return this.isValidEmail(value);
      
      case 'TEXT_IS_URL':
        return this.isValidUrl(value);
      
      case 'DATE_EQ':
        return values[0] ? this.compareDates(value, values[0], (a, b) => a.getTime() === b.getTime()) : false;
      
      case 'DATE_BEFORE':
        return values[0] ? this.compareDates(value, values[0], (a, b) => a.getTime() < b.getTime()) : false;
      
      case 'DATE_AFTER':
        return values[0] ? this.compareDates(value, values[0], (a, b) => a.getTime() > b.getTime()) : false;
      
      case 'DATE_ON_OR_BEFORE':
        return values[0] ? this.compareDates(value, values[0], (a, b) => a.getTime() <= b.getTime()) : false;
      
      case 'DATE_ON_OR_AFTER':
        return values[0] ? this.compareDates(value, values[0], (a, b) => a.getTime() >= b.getTime()) : false;
      
      case 'DATE_BETWEEN':
        return values[0] && values[1] ? this.isDateBetween(value, values[0], values[1]) : false;
      
      case 'DATE_NOT_BETWEEN':
        return values[0] && values[1] ? !this.isDateBetween(value, values[0], values[1]) : false;
      
      case 'DATE_IS_VALID':
        return this.isValidDate(value);
      
      case 'ONE_OF_LIST':
        return this.isOneOfList(value, values);
      
      case 'BLANK':
        return this.isBlank(value);
      
      case 'NOT_BLANK':
        return !this.isBlank(value);
      
      case 'BOOLEAN':
        return value.type === 'boolean';
      
      case 'CUSTOM':
        // Custom validation would require formula evaluation
        return true; // Placeholder
      
      default:
        return true;
    }
  }

  /**
   * Compare numbers with a comparison function
   */
  private static compareNumbers(
    value: CellValue,
    conditionValue: ConditionValue,
    compareFn: (a: number, b: number) => boolean
  ): boolean {
    const num = this.toNumber(value);
    const conditionNum = this.parseConditionValue(conditionValue);
    
    if (num === null || conditionNum === null) {
      return false;
    }
    
    return compareFn(num, conditionNum);
  }

  /**
   * Check if number is between two values
   */
  private static isNumberBetween(
    value: CellValue,
    min: ConditionValue,
    max: ConditionValue
  ): boolean {
    const num = this.toNumber(value);
    const minNum = this.parseConditionValue(min);
    const maxNum = this.parseConditionValue(max);
    
    if (num === null || minNum === null || maxNum === null) {
      return false;
    }
    
    return num >= minNum && num <= maxNum;
  }

  /**
   * Check if text contains substring
   */
  private static textContains(value: CellValue, conditionValue: ConditionValue): boolean {
    const text = this.toString(value);
    const searchText = conditionValue?.userEnteredValue || '';
    
    return text.toLowerCase().includes(searchText.toLowerCase());
  }

  /**
   * Check if text starts with substring
   */
  private static textStartsWith(value: CellValue, conditionValue: ConditionValue): boolean {
    const text = this.toString(value);
    const searchText = conditionValue?.userEnteredValue || '';
    
    return text.toLowerCase().startsWith(searchText.toLowerCase());
  }

  /**
   * Check if text ends with substring
   */
  private static textEndsWith(value: CellValue, conditionValue: ConditionValue): boolean {
    const text = this.toString(value);
    const searchText = conditionValue?.userEnteredValue || '';
    
    return text.toLowerCase().endsWith(searchText.toLowerCase());
  }

  /**
   * Check if text equals value
   */
  private static textEquals(value: CellValue, conditionValue: ConditionValue): boolean {
    const text = this.toString(value);
    const searchText = conditionValue?.userEnteredValue || '';
    
    return text.toLowerCase() === searchText.toLowerCase();
  }

  /**
   * Validate email format
   */
  private static isValidEmail(value: CellValue): boolean {
    if (value.type !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.value);
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(value: CellValue): boolean {
    if (value.type !== 'string') return false;
    
    try {
      new URL(value.value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compare dates with a comparison function
   */
  private static compareDates(
    value: CellValue,
    conditionValue: ConditionValue,
    compareFn: (a: Date, b: Date) => boolean
  ): boolean {
    const date = this.toDate(value);
    const conditionDate = this.parseConditionDate(conditionValue);
    
    if (!date || !conditionDate) {
      return false;
    }
    
    return compareFn(date, conditionDate);
  }

  /**
   * Check if date is between two dates
   */
  private static isDateBetween(
    value: CellValue,
    min: ConditionValue,
    max: ConditionValue
  ): boolean {
    const date = this.toDate(value);
    const minDate = this.parseConditionDate(min);
    const maxDate = this.parseConditionDate(max);
    
    if (!date || !minDate || !maxDate) {
      return false;
    }
    
    return date.getTime() >= minDate.getTime() && date.getTime() <= maxDate.getTime();
  }

  /**
   * Check if value is a valid date
   */
  private static isValidDate(value: CellValue): boolean {
    return this.toDate(value) !== null;
  }

  /**
   * Check if value is in a list of values
   */
  private static isOneOfList(value: CellValue, values: ConditionValue[]): boolean {
    const valueStr = this.toString(value).toLowerCase();
    
    return values.some(conditionValue => {
      const conditionStr = (conditionValue?.userEnteredValue || '').toLowerCase();
      return valueStr === conditionStr;
    });
  }

  /**
   * Check if value is blank
   */
  private static isBlank(value: CellValue): boolean {
    return value.type === 'empty' || 
           (value.type === 'string' && value.value.trim() === '');
  }

  /**
   * Convert cell value to number
   */
  private static toNumber(value: CellValue): number | null {
    switch (value.type) {
      case 'number':
        return value.value;
      case 'boolean':
        return value.value ? 1 : 0;
      case 'string':
        const num = parseFloat(value.value);
        return isNaN(num) ? null : num;
      case 'date':
        return value.value.getTime();
      default:
        return null;
    }
  }

  /**
   * Convert cell value to string
   */
  private static toString(value: CellValue): string {
    switch (value.type) {
      case 'string':
        return value.value;
      case 'number':
        return value.value.toString();
      case 'boolean':
        return value.value ? 'TRUE' : 'FALSE';
      case 'date':
        return value.value.toISOString();
      case 'error':
        return `#${value.value}`;
      default:
        return '';
    }
  }

  /**
   * Convert cell value to date
   */
  private static toDate(value: CellValue): Date | null {
    switch (value.type) {
      case 'date':
        return value.value;
      case 'number':
        // Excel-style date serial number
        const excelEpoch = new Date(1900, 0, 1);
        return new Date(excelEpoch.getTime() + (value.value - 1) * 24 * 60 * 60 * 1000);
      case 'string':
        const date = new Date(value.value);
        return isNaN(date.getTime()) ? null : date;
      default:
        return null;
    }
  }

  /**
   * Parse condition value to number
   */
  private static parseConditionValue(conditionValue: ConditionValue): number | null {
    if (conditionValue?.userEnteredValue) {
      const num = parseFloat(conditionValue.userEnteredValue);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Parse condition value to date
   */
  private static parseConditionDate(conditionValue: ConditionValue): Date | null {
    if (conditionValue?.relativeDate) {
      const now = new Date();
      
      switch (conditionValue.relativeDate) {
        case 'TODAY':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case 'YESTERDAY':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        case 'TOMORROW':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        case 'PAST_WEEK':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'PAST_MONTH':
          return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        case 'PAST_YEAR':
          return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        default:
          return null;
      }
    }
    
    if (conditionValue?.userEnteredValue) {
      const date = new Date(conditionValue.userEnteredValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  }

  /**
   * Format cell value according to number format
   */
  static formatCellValue(value: CellValue, format: NumberFormat): FormattingResult {
    if (value.type === 'empty') {
      return { formattedValue: '', displayValue: '' };
    }

    if (value.type === 'error') {
      const errorDisplay = `#${value.value}`;
      return { formattedValue: errorDisplay, displayValue: errorDisplay };
    }

    switch (format.formatType) {
      case 'TEXT':
        return this.formatAsText(value);
      
      case 'NUMBER':
        return this.formatAsNumber(value, format.pattern);
      
      case 'PERCENT':
        return this.formatAsPercent(value, format.pattern);
      
      case 'CURRENCY':
        return this.formatAsCurrency(value, format.pattern);
      
      case 'DATE':
        return this.formatAsDate(value, format.pattern);
      
      case 'TIME':
        return this.formatAsTime(value, format.pattern);
      
      case 'DATETIME':
        return this.formatAsDateTime(value, format.pattern);
      
      case 'SCIENTIFIC':
        return this.formatAsScientific(value, format.pattern);
      
      default:
        return this.formatAsText(value);
    }
  }

  /**
   * Format as text
   */
  private static formatAsText(value: CellValue): FormattingResult {
    const text = this.toString(value);
    return { formattedValue: text, displayValue: text };
  }

  /**
   * Format as number
   */
  private static formatAsNumber(value: CellValue, pattern: string): FormattingResult {
    const num = this.toNumber(value);
    
    if (num === null) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    // Parse pattern for decimal places
    const decimalPlaces = this.getDecimalPlaces(pattern);
    const formatted = num.toFixed(decimalPlaces);
    
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as percentage
   */
  private static formatAsPercent(value: CellValue, pattern: string): FormattingResult {
    const num = this.toNumber(value);
    
    if (num === null) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    const decimalPlaces = this.getDecimalPlaces(pattern);
    const percent = (num * 100).toFixed(decimalPlaces);
    const formatted = `${percent}%`;
    
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as currency
   */
  private static formatAsCurrency(value: CellValue, pattern: string): FormattingResult {
    const num = this.toNumber(value);
    
    if (num === null) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    // Extract currency symbol from pattern or use default
    const currencySymbol = this.getCurrencySymbol(pattern);
    const decimalPlaces = this.getDecimalPlaces(pattern);
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencySymbol === '$' ? 'USD' : 'USD',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(num);
    
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as date
   */
  private static formatAsDate(value: CellValue, pattern: string): FormattingResult {
    const date = this.toDate(value);
    
    if (!date) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    const formatted = this.formatDateWithPattern(date, pattern);
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as time
   */
  private static formatAsTime(value: CellValue, pattern: string): FormattingResult {
    const date = this.toDate(value);
    
    if (!date) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    const formatted = this.formatTimeWithPattern(date, pattern);
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as datetime
   */
  private static formatAsDateTime(value: CellValue, pattern: string): FormattingResult {
    const date = this.toDate(value);
    
    if (!date) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    const formatted = this.formatDateTimeWithPattern(date, pattern);
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Format as scientific notation
   */
  private static formatAsScientific(value: CellValue, pattern: string): FormattingResult {
    const num = this.toNumber(value);
    
    if (num === null) {
      const text = this.toString(value);
      return { formattedValue: text, displayValue: text };
    }

    const decimalPlaces = this.getDecimalPlaces(pattern);
    const formatted = num.toExponential(decimalPlaces);
    
    return { formattedValue: formatted, displayValue: formatted };
  }

  /**
   * Get decimal places from pattern
   */
  private static getDecimalPlaces(pattern: string): number {
    const match = pattern.match(/\.(\d+)/);
    return match ? match[1].length : 2;
  }

  /**
   * Get currency symbol from pattern
   */
  private static getCurrencySymbol(pattern: string): string {
    const symbols = ['$', '€', '£', '¥', '₹'];
    
    for (const symbol of symbols) {
      if (pattern.includes(symbol)) {
        return symbol;
      }
    }
    
    return '$'; // Default
  }

  /**
   * Format date with pattern
   */
  private static formatDateWithPattern(date: Date, pattern: string): string {
    if (pattern.includes('MM/dd/yyyy')) {
      return date.toLocaleDateString('en-US');
    }
    
    if (pattern.includes('dd/MM/yyyy')) {
      return date.toLocaleDateString('en-GB');
    }
    
    if (pattern.includes('yyyy-MM-dd')) {
      return date.toISOString().split('T')[0];
    }
    
    // Default format
    return date.toLocaleDateString();
  }

  /**
   * Format time with pattern
   */
  private static formatTimeWithPattern(date: Date, pattern: string): string {
    if (pattern.includes('HH:mm:ss')) {
      return date.toLocaleTimeString('en-GB');
    }
    
    if (pattern.includes('h:mm:ss AM/PM')) {
      return date.toLocaleTimeString('en-US');
    }
    
    // Default format
    return date.toLocaleTimeString();
  }

  /**
   * Format datetime with pattern
   */
  private static formatDateTimeWithPattern(date: Date, pattern: string): string {
    const datePart = this.formatDateWithPattern(date, pattern);
    const timePart = this.formatTimeWithPattern(date, pattern);
    
    return `${datePart} ${timePart}`;
  }

  /**
   * Apply conditional formatting based on cell value
   */
  static applyConditionalFormatting(
    value: CellValue,
    rules: ConditionalFormatRule[]
  ): CellFormat | null {
    for (const rule of rules) {
      if (rule.booleanRule) {
        const isMatch = this.evaluateCondition(value, rule.booleanRule.condition);
        if (isMatch) {
          return rule.booleanRule.format;
        }
      }
      
      if (rule.gradientRule) {
        // Implement gradient formatting based on value
        const num = this.toNumber(value);
        if (num !== null) {
          // For now, return a simple format - full gradient implementation would be more complex
          return {
            ...this.createDefaultCellFormat(),
            backgroundColor: this.interpolateColor(num, rule.gradientRule),
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Interpolate color for gradient formatting
   */
  private static interpolateColor(value: number, gradientRule: GradientRule): Color {
    // Simple implementation - would need min/max values from data range
    const ratio = Math.max(0, Math.min(1, (value - 0) / 100)); // Assuming 0-100 range
    
    const minColor = gradientRule.minPoint.color;
    const maxColor = gradientRule.maxPoint.color;
    
    return {
      red: minColor.red + (maxColor.red - minColor.red) * ratio,
      green: minColor.green + (maxColor.green - minColor.green) * ratio,
      blue: minColor.blue + (maxColor.blue - minColor.blue) * ratio,
      alpha: minColor.alpha + (maxColor.alpha - minColor.alpha) * ratio,
    };
  }

  /**
   * Create default cell format
   */
  private static createDefaultCellFormat(): CellFormat {
    return {
      numberFormat: {
        formatType: 'TEXT',
        pattern: '',
      },
      borders: {},
      padding: { top: 4, right: 8, bottom: 4, left: 8 },
      horizontalAlignment: 'LEFT',
      verticalAlignment: 'MIDDLE',
      wrapStrategy: 'OVERFLOW_CELL',
      textDirection: 'LEFT_TO_RIGHT',
      textFormat: {
        fontFamily: 'Arial',
        fontSize: 12,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
      },
      textRotation: {
        angle: 0,
        vertical: false,
      },
    };
  }

  /**
   * Validate and auto-correct common data entry errors
   */
  static autoCorrectValue(value: CellValue, expectedType?: string): CellValue {
    if (value.type === 'string' && value.value) {
      const text = value.value.trim();
      
      // Auto-correct common number formats
      if (expectedType === 'number' || this.looksLikeNumber(text)) {
        const corrected = this.parseNumber(text);
        if (corrected !== null) {
          return { type: 'number', value: corrected };
        }
      }
      
      // Auto-correct date formats
      if (expectedType === 'date' || this.looksLikeDate(text)) {
        const corrected = this.parseDate(text);
        if (corrected) {
          return { type: 'date', value: corrected };
        }
      }
      
      // Auto-correct boolean values
      if (expectedType === 'boolean' || this.looksLikeBoolean(text)) {
        const corrected = this.parseBoolean(text);
        if (corrected !== null) {
          return { type: 'boolean', value: corrected };
        }
      }
    }
    
    return value;
  }

  /**
   * Check if text looks like a number
   */
  private static looksLikeNumber(text: string): boolean {
    return /^[-+]?[\d,]*\.?\d*%?$/.test(text.replace(/\s/g, ''));
  }

  /**
   * Parse number from text with common formats
   */
  private static parseNumber(text: string): number | null {
    // Remove common formatting
    let cleaned = text.replace(/[\s,]/g, '');
    
    // Handle percentage
    const isPercentage = cleaned.endsWith('%');
    if (isPercentage) {
      cleaned = cleaned.slice(0, -1);
    }
    
    // Handle currency symbols
    cleaned = cleaned.replace(/^[$€£¥₹]/, '');
    
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    
    return isPercentage ? num / 100 : num;
  }

  /**
   * Check if text looks like a date
   */
  private static looksLikeDate(text: string): boolean {
    return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text) ||
           /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(text) ||
           /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text);
  }

  /**
   * Parse date from text with common formats
   */
  private static parseDate(text: string): Date | null {
    // Try common date formats
    const formats = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD
    ];
    
    for (const format of formats) {
      const match = text.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Try different interpretations
        const attempts = [
          new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2)), // MM/DD/YYYY
          new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1)), // DD/MM/YYYY
          new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3)), // YYYY/MM/DD
        ];
        
        for (const attempt of attempts) {
          if (!isNaN(attempt.getTime())) {
            return attempt;
          }
        }
      }
    }
    
    // Fallback to native Date parsing
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Check if text looks like a boolean
   */
  private static looksLikeBoolean(text: string): boolean {
    const lower = text.toLowerCase();
    return ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'].includes(lower);
  }

  /**
   * Parse boolean from text
   */
  private static parseBoolean(text: string): boolean | null {
    const lower = text.toLowerCase();
    
    if (['true', 'yes', '1', 'on'].includes(lower)) {
      return true;
    }
    
    if (['false', 'no', '0', 'off'].includes(lower)) {
      return false;
    }
    
    return null;
  }

  /**
   * Create validation rules for common data types
   */
  static createValidationRules() {
    return {
      // Number validation
      positiveNumber: (): DataValidation => ({
        condition: {
          conditionType: 'NUMBER_GREATER',
          values: [{ userEnteredValue: '0' }],
        },
        inputMessage: 'Please enter a positive number',
        strict: true,
        showCustomUi: true,
      }),

      // Email validation
      email: (): DataValidation => ({
        condition: {
          conditionType: 'TEXT_IS_EMAIL',
          values: [],
        },
        inputMessage: 'Please enter a valid email address',
        strict: true,
        showCustomUi: true,
      }),

      // URL validation
      url: (): DataValidation => ({
        condition: {
          conditionType: 'TEXT_IS_URL',
          values: [],
        },
        inputMessage: 'Please enter a valid URL',
        strict: true,
        showCustomUi: true,
      }),

      // Date validation
      futureDate: (): DataValidation => ({
        condition: {
          conditionType: 'DATE_AFTER',
          values: [{ relativeDate: 'TODAY' }],
        },
        inputMessage: 'Please enter a future date',
        strict: true,
        showCustomUi: true,
      }),

      // List validation
      fromList: (items: string[]): DataValidation => ({
        condition: {
          conditionType: 'ONE_OF_LIST',
          values: items.map(item => ({ userEnteredValue: item })),
        },
        inputMessage: `Please select from: ${items.join(', ')}`,
        strict: true,
        showCustomUi: true,
      }),

      // Range validation
      numberRange: (min: number, max: number): DataValidation => ({
        condition: {
          conditionType: 'NUMBER_BETWEEN',
          values: [
            { userEnteredValue: min.toString() },
            { userEnteredValue: max.toString() },
          ],
        },
        inputMessage: `Please enter a number between ${min} and ${max}`,
        strict: true,
        showCustomUi: true,
      }),
    };
  }
}