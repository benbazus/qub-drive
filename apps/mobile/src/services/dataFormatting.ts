import {
  CellValue,
  NumberFormat,
  NumberFormatType,
  CellFormat,
  Color,
} from '@/types/spreadsheet';

export interface FormatOptions {
  locale?: string;
  currency?: string;
  timeZone?: string;
  decimalPlaces?: number;
  useGrouping?: boolean;
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
}

export interface ConditionalFormat {
  condition: (value: CellValue) => boolean;
  format: Partial<CellFormat>;
  priority: number;
}

export class DataFormattingService {
  private static defaultLocale = 'en-US';
  private static defaultCurrency = 'USD';
  private static defaultTimeZone = 'UTC';

  /**
   * Format cell value with advanced options
   */
  static formatValue(
    value: CellValue,
    format: NumberFormat,
    options: FormatOptions = {}
  ): string {
    if (value.type === 'empty') {
      return '';
    }

    if (value.type === 'error') {
      return `#${value.value}`;
    }

    const locale = options.locale || this.defaultLocale;

    switch (format.formatType) {
      case 'TEXT':
        return this.formatAsText(value);

      case 'NUMBER':
        return this.formatAsNumber(value, format.pattern, options);

      case 'PERCENT':
        return this.formatAsPercent(value, format.pattern, options);

      case 'CURRENCY':
        return this.formatAsCurrency(value, format.pattern, options);

      case 'DATE':
        return this.formatAsDate(value, format.pattern, options);

      case 'TIME':
        return this.formatAsTime(value, format.pattern, options);

      case 'DATETIME':
        return this.formatAsDateTime(value, format.pattern, options);

      case 'SCIENTIFIC':
        return this.formatAsScientific(value, format.pattern, options);

      default:
        return this.formatAsText(value);
    }
  }

  /**
   * Format as text
   */
  private static formatAsText(value: CellValue): string {
    switch (value.type) {
      case 'string':
        return value.value;
      case 'number':
        return value.value.toString();
      case 'boolean':
        return value.value ? 'TRUE' : 'FALSE';
      case 'date':
        return value.value.toISOString();
      default:
        return '';
    }
  }

  /**
   * Format as number with advanced options
   */
  private static formatAsNumber(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const num = this.toNumber(value);
    if (num === null) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const decimalPlaces = options.decimalPlaces ?? this.getDecimalPlaces(pattern);
    const useGrouping = options.useGrouping ?? true;

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
      useGrouping,
    }).format(num);
  }

  /**
   * Format as percentage
   */
  private static formatAsPercent(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const num = this.toNumber(value);
    if (num === null) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const decimalPlaces = options.decimalPlaces ?? this.getDecimalPlaces(pattern);

    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(num);
  }

  /**
   * Format as currency
   */
  private static formatAsCurrency(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const num = this.toNumber(value);
    if (num === null) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const currency = options.currency || this.getCurrencyFromPattern(pattern) || this.defaultCurrency;
    const decimalPlaces = options.decimalPlaces ?? this.getDecimalPlaces(pattern);

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(num);
  }

  /**
   * Format as date with advanced options
   */
  private static formatAsDate(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const date = this.toDate(value);
    if (!date) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const timeZone = options.timeZone || this.defaultTimeZone;

    // Parse custom pattern or use Intl.DateTimeFormat
    if (this.isCustomDatePattern(pattern)) {
      return this.formatDateWithCustomPattern(date, pattern, locale, timeZone);
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle || 'medium',
      timeZone,
    }).format(date);
  }

  /**
   * Format as time
   */
  private static formatAsTime(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const date = this.toDate(value);
    if (!date) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const timeZone = options.timeZone || this.defaultTimeZone;

    if (this.isCustomTimePattern(pattern)) {
      return this.formatTimeWithCustomPattern(date, pattern, locale, timeZone);
    }

    return new Intl.DateTimeFormat(locale, {
      timeStyle: options.timeStyle || 'medium',
      timeZone,
    }).format(date);
  }

  /**
   * Format as datetime
   */
  private static formatAsDateTime(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const date = this.toDate(value);
    if (!date) {
      return this.formatAsText(value);
    }

    const locale = options.locale || this.defaultLocale;
    const timeZone = options.timeZone || this.defaultTimeZone;

    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle || 'medium',
      timeStyle: options.timeStyle || 'medium',
      timeZone,
    }).format(date);
  }

  /**
   * Format as scientific notation
   */
  private static formatAsScientific(
    value: CellValue,
    pattern: string,
    options: FormatOptions
  ): string {
    const num = this.toNumber(value);
    if (num === null) {
      return this.formatAsText(value);
    }

    const decimalPlaces = options.decimalPlaces ?? this.getDecimalPlaces(pattern);
    return num.toExponential(decimalPlaces);
  }

  /**
   * Apply conditional formatting
   */
  static applyConditionalFormatting(
    value: CellValue,
    conditionalFormats: ConditionalFormat[]
  ): Partial<CellFormat> | null {
    // Sort by priority (higher priority first)
    const sortedFormats = conditionalFormats.sort((a, b) => b.priority - a.priority);

    for (const format of sortedFormats) {
      if (format.condition(value)) {
        return format.format;
      }
    }

    return null;
  }

  /**
   * Create common conditional formats
   */
  static createConditionalFormats() {
    return {
      // Highlight negative numbers in red
      negativeNumbers: (): ConditionalFormat => ({
        condition: (value: CellValue) => {
          const num = this.toNumber(value);
          return num !== null && num < 0;
        },
        format: {
          textFormat: {
            foregroundColor: { red: 1, green: 0, blue: 0, alpha: 1 },
            fontFamily: 'Arial',
            fontSize: 12,
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
          },
        },
        priority: 1,
      }),

      // Highlight values above threshold
      aboveThreshold: (threshold: number, color: Color): ConditionalFormat => ({
        condition: (value: CellValue) => {
          const num = this.toNumber(value);
          return num !== null && num > threshold;
        },
        format: {
          backgroundColor: color,
        },
        priority: 2,
      }),

      // Highlight values below threshold
      belowThreshold: (threshold: number, color: Color): ConditionalFormat => ({
        condition: (value: CellValue) => {
          const num = this.toNumber(value);
          return num !== null && num < threshold;
        },
        format: {
          backgroundColor: color,
        },
        priority: 2,
      }),

      // Highlight text containing specific value
      textContains: (searchText: string, color: Color): ConditionalFormat => ({
        condition: (value: CellValue) => {
          if (value.type !== 'string') return false;
          return value.value.toLowerCase().includes(searchText.toLowerCase());
        },
        format: {
          backgroundColor: color,
        },
        priority: 1,
      }),

      // Highlight dates in range
      dateRange: (startDate: Date, endDate: Date, color: Color): ConditionalFormat => ({
        condition: (value: CellValue) => {
          const date = this.toDate(value);
          if (!date) return false;
          return date >= startDate && date <= endDate;
        },
        format: {
          backgroundColor: color,
        },
        priority: 1,
      }),

      // Data bars (simplified)
      dataBars: (minValue: number, maxValue: number): ConditionalFormat => ({
        condition: (value: CellValue) => {
          const num = this.toNumber(value);
          return num !== null && num >= minValue && num <= maxValue;
        },
        format: {
          // This would need special handling in the UI to render data bars
          backgroundColor: { red: 0.8, green: 0.9, blue: 1, alpha: 0.5 },
        },
        priority: 0,
      }),
    };
  }

  /**
   * Auto-detect appropriate format for value
   */
  static detectFormat(value: CellValue): NumberFormat {
    switch (value.type) {
      case 'number':
        if (this.looksLikePercentage(value.value)) {
          return { formatType: 'PERCENT', pattern: '0.00%' };
        }
        if (this.looksLikeCurrency(value.value)) {
          return { formatType: 'CURRENCY', pattern: '$#,##0.00' };
        }
        if (Number.isInteger(value.value)) {
          return { formatType: 'NUMBER', pattern: '#,##0' };
        }
        return { formatType: 'NUMBER', pattern: '#,##0.00' };

      case 'date':
        return { formatType: 'DATE', pattern: 'MM/dd/yyyy' };

      case 'boolean':
        return { formatType: 'TEXT', pattern: '' };

      case 'string':
        if (this.looksLikeDate(value.value)) {
          return { formatType: 'DATE', pattern: 'MM/dd/yyyy' };
        }
        if (this.looksLikeTime(value.value)) {
          return { formatType: 'TIME', pattern: 'h:mm:ss AM/PM' };
        }
        return { formatType: 'TEXT', pattern: '' };

      default:
        return { formatType: 'TEXT', pattern: '' };
    }
  }

  /**
   * Helper methods
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

  private static getDecimalPlaces(pattern: string): number {
    const match = pattern.match(/\.(\d+)/);
    return match ? match[1].length : 2;
  }

  private static getCurrencyFromPattern(pattern: string): string | null {
    const symbols = ['$', '€', '£', '¥', '₹'];
    for (const symbol of symbols) {
      if (pattern.includes(symbol)) {
        switch (symbol) {
          case '$': return 'USD';
          case '€': return 'EUR';
          case '£': return 'GBP';
          case '¥': return 'JPY';
          case '₹': return 'INR';
        }
      }
    }
    return null;
  }

  private static isCustomDatePattern(pattern: string): boolean {
    return /[yMdDhHmsS]/.test(pattern);
  }

  private static isCustomTimePattern(pattern: string): boolean {
    return /[hHmsS]/.test(pattern);
  }

  private static formatDateWithCustomPattern(
    date: Date,
    pattern: string,
    locale: string,
    timeZone: string
  ): string {
    // Simplified custom pattern implementation
    // In a full implementation, you'd parse the pattern more thoroughly
    let result = pattern;
    
    result = result.replace(/yyyy/g, date.getFullYear().toString());
    result = result.replace(/yy/g, date.getFullYear().toString().slice(-2));
    result = result.replace(/MM/g, (date.getMonth() + 1).toString().padStart(2, '0'));
    result = result.replace(/M/g, (date.getMonth() + 1).toString());
    result = result.replace(/dd/g, date.getDate().toString().padStart(2, '0'));
    result = result.replace(/d/g, date.getDate().toString());
    
    return result;
  }

  private static formatTimeWithCustomPattern(
    date: Date,
    pattern: string,
    locale: string,
    timeZone: string
  ): string {
    // Simplified custom pattern implementation
    let result = pattern;
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    result = result.replace(/HH/g, hours.toString().padStart(2, '0'));
    result = result.replace(/H/g, hours.toString());
    result = result.replace(/hh/g, (hours % 12 || 12).toString().padStart(2, '0'));
    result = result.replace(/h/g, (hours % 12 || 12).toString());
    result = result.replace(/mm/g, minutes.toString().padStart(2, '0'));
    result = result.replace(/m/g, minutes.toString());
    result = result.replace(/ss/g, seconds.toString().padStart(2, '0'));
    result = result.replace(/s/g, seconds.toString());
    result = result.replace(/AM\/PM/g, hours >= 12 ? 'PM' : 'AM');
    
    return result;
  }

  private static looksLikePercentage(num: number): boolean {
    return num >= 0 && num <= 1;
  }

  private static looksLikeCurrency(num: number): boolean {
    // Simple heuristic - could be improved
    return Math.abs(num) >= 1 && num % 1 !== 0;
  }

  private static looksLikeDate(text: string): boolean {
    return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text) ||
           /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(text);
  }

  private static looksLikeTime(text: string): boolean {
    return /^\d{1,2}:\d{2}(:\d{2})?(\s?(AM|PM))?$/i.test(text);
  }
}