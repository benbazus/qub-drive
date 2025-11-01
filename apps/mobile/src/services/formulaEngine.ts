import {
  CellValue,
  CellError,
  CellReference,
  Spreadsheet,
} from "@/types/spreadsheet";
import { SpreadsheetService } from "./spreadsheetService";

export interface FormulaContext {
  spreadsheet: Spreadsheet;
  currentSheetId: string;
  currentCellRef: string;
}

export interface CalculationResult {
  value: CellValue;
  dependencies: CellReference[];
  error?: CellError;
}

export interface FunctionDefinition {
  name: string;
  minArgs: number;
  maxArgs: number;
  calculate: (args: CellValue[], context: FormulaContext) => CellValue;
  description: string;
  syntax: string;
}

export class FormulaEngine {
  private static functions: Map<string, FunctionDefinition> = new Map();
  private static dependencyGraph: Map<string, Set<string>> = new Map();
  private static calculationCache: Map<string, CalculationResult> = new Map();

  static {
    this.initializeFunctions();
  }

  /**
   * Parse and evaluate a formula
   */
  static evaluateFormula(
    formula: string,
    context: FormulaContext
  ): CalculationResult {
    try {
      // Remove leading = if present
      const cleanFormula = formula.startsWith("=") ? formula.slice(1) : formula;

      // Check cache first
      const cacheKey = `${context.currentSheetId}:${context.currentCellRef}:${cleanFormula}`;
      const cached = this.calculationCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Parse the formula into tokens
      const tokens = this.tokenizeFormula(cleanFormula);

      // Build expression tree
      const expressionTree = this.parseExpression(tokens);

      // Evaluate the expression
      const result = this.evaluateExpression(expressionTree, context);

      // Cache the result
      this.calculationCache.set(cacheKey, result);

      return result;
    } catch {
      return {
        value: { type: "error", value: "INVALID_VALUE" },
        dependencies: [],
        error: "INVALID_VALUE",
      };
    }
  }

  /**
   * Get all cell dependencies for a formula
   */
  static getDependencies(formula: string): CellReference[] {
    const dependencies: CellReference[] = [];
    const cleanFormula = formula.startsWith("=") ? formula.slice(1) : formula;

    // Match cell references (A1, $A$1, Sheet1!A1, etc.)
    const cellRefRegex = /(?:([A-Za-z_][A-Za-z0-9_]*!)?\$?([A-Z]+)\$?(\d+))/g;
    let match;

    while ((match = cellRefRegex.exec(cleanFormula)) !== null) {
      const [fullMatch, sheetName, column, row] = match;
      if (column && row) {
        dependencies.push({
          ...(sheetName && { sheetId: sheetName.slice(0, -1) }),
          column,
          row: parseInt(row, 10),
          absoluteColumn: fullMatch.includes(`$${column}`),
          absoluteRow: fullMatch.includes(`$${row}`),
        });
      }
    }

    // Match range references (A1:B2, etc.)
    const rangeRefRegex =
      /(?:([A-Za-z_][A-Za-z0-9_]*!)?\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+))/g;

    while ((match = rangeRefRegex.exec(cleanFormula)) !== null) {
      const [, sheetName, startCol, startRow, endCol, endRow] = match;

      if (startCol && startRow && endCol && endRow) {
        // Add all cells in the range
        const startColIndex = SpreadsheetService.columnLetterToIndex(startCol);
        const endColIndex = SpreadsheetService.columnLetterToIndex(endCol);
        const startRowIndex = parseInt(startRow, 10);
        const endRowIndex = parseInt(endRow, 10);

        for (let col = startColIndex; col <= endColIndex; col++) {
          for (let row = startRowIndex; row <= endRowIndex; row++) {
            dependencies.push({
              ...(sheetName && { sheetId: sheetName.slice(0, -1) }),
              column: SpreadsheetService.columnIndexToLetter(col),
              row,
              absoluteColumn: false,
              absoluteRow: false,
            });
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Update dependency graph when a cell formula changes
   */
  static updateDependencies(
    cellRef: string,
    sheetId: string,
    formula?: string
  ): void {
    const fullCellRef = `${sheetId}:${cellRef}`;

    // Remove existing dependencies
    this.dependencyGraph.delete(fullCellRef);

    if (formula) {
      const dependencies = this.getDependencies(formula);
      const dependencySet = new Set<string>();

      dependencies.forEach((dep) => {
        const depSheetId = dep.sheetId || sheetId;
        const depCellRef = `${dep.column}${dep.row}`;
        dependencySet.add(`${depSheetId}:${depCellRef}`);
      });

      this.dependencyGraph.set(fullCellRef, dependencySet);
    }

    // Clear cache for affected cells
    this.clearCacheForCell(fullCellRef);
  }

  /**
   * Get cells that depend on a given cell
   */
  static getDependentCells(cellRef: string, sheetId: string): string[] {
    const fullCellRef = `${sheetId}:${cellRef}`;
    const dependents: string[] = [];

    for (const [cell, dependencies] of this.dependencyGraph.entries()) {
      if (dependencies.has(fullCellRef)) {
        dependents.push(cell);
      }
    }

    return dependents;
  }

  /**
   * Clear calculation cache for a cell and its dependents
   */
  static clearCacheForCell(fullCellRef: string): void {
    // Clear cache for this cell
    for (const key of this.calculationCache.keys()) {
      if (key.startsWith(fullCellRef)) {
        this.calculationCache.delete(key);
      }
    }

    // Clear cache for dependent cells
    const parts = fullCellRef.split(":");
    if (parts.length === 2 && parts[0] && parts[1]) {
      const dependents = this.getDependentCells(parts[1], parts[0]);
      dependents.forEach((dependent) => {
        this.clearCacheForCell(dependent);
      });
    }
  }

  /**
   * Tokenize formula into components
   */
  private static tokenizeFormula(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];
      if (!char) break;

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(char) || char === ".") {
        let number = "";
        while (i < formula.length && formula[i] && /[\d.]/.test(formula[i]!)) {
          number += formula[i]!;
          i++;
        }
        tokens.push({ type: "number", value: parseFloat(number) });
        continue;
      }

      // Strings
      if (char === '"') {
        let string = "";
        i++; // Skip opening quote
        while (i < formula.length && formula[i] && formula[i] !== '"') {
          string += formula[i]!;
          i++;
        }
        i++; // Skip closing quote
        tokens.push({ type: "string", value: string });
        continue;
      }

      // Cell references and functions
      if (/[A-Za-z]/.test(char)) {
        let identifier = "";
        while (
          i < formula.length &&
          formula[i] &&
          /[A-Za-z0-9_$!]/.test(formula[i]!)
        ) {
          identifier += formula[i]!;
          i++;
        }

        // Check if it's a function call
        if (i < formula.length && formula[i] === "(") {
          tokens.push({ type: "function", value: identifier.toUpperCase() });
        } else {
          // It's a cell reference
          tokens.push({ type: "cellref", value: identifier });
        }
        continue;
      }

      // Operators and punctuation
      switch (char) {
        case "+":
          tokens.push({ type: "operator", value: "+" });
          break;
        case "-":
          tokens.push({ type: "operator", value: "-" });
          break;
        case "*":
          tokens.push({ type: "operator", value: "*" });
          break;
        case "/":
          tokens.push({ type: "operator", value: "/" });
          break;
        case "^":
          tokens.push({ type: "operator", value: "^" });
          break;
        case "(":
          tokens.push({ type: "lparen", value: "(" });
          break;
        case ")":
          tokens.push({ type: "rparen", value: ")" });
          break;
        case ",":
          tokens.push({ type: "comma", value: "," });
          break;
        case ":":
          tokens.push({ type: "colon", value: ":" });
          break;
        case "=":
          tokens.push({ type: "operator", value: "=" });
          break;
        case "<":
          if (i + 1 < formula.length && formula[i + 1] === "=") {
            tokens.push({ type: "operator", value: "<=" });
            i++;
          } else {
            tokens.push({ type: "operator", value: "<" });
          }
          break;
        case ">":
          if (i + 1 < formula.length && formula[i + 1] === "=") {
            tokens.push({ type: "operator", value: ">=" });
            i++;
          } else {
            tokens.push({ type: "operator", value: ">" });
          }
          break;
        case "!":
          if (i + 1 < formula.length && formula[i + 1] === "=") {
            tokens.push({ type: "operator", value: "!=" });
            i++;
          } else {
            tokens.push({ type: "operator", value: "!" });
          }
          break;
        default:
          throw new Error(`Unexpected character: ${char}`);
      }

      i++;
    }

    return tokens;
  }

  /**
   * Parse tokens into expression tree
   */
  private static parseExpression(tokens: Token[]): ExpressionNode {
    let index = 0;

    const parseComparison = (): ExpressionNode => {
      let left = parseAddition();

      while (
        index < tokens.length &&
        tokens[index]?.type === "operator" &&
        ["=", "<", ">", "<=", ">=", "!="].includes(
          tokens[index]?.value as string
        )
      ) {
        const operator = tokens[index]?.value as string;
        index++;
        const right = parseAddition();
        left = { type: "binary", operator, left, right };
      }

      return left;
    };

    const parseAddition = (): ExpressionNode => {
      let left = parseMultiplication();

      while (
        index < tokens.length &&
        tokens[index]?.type === "operator" &&
        ["+", "-"].includes(tokens[index]?.value as string)
      ) {
        const operator = tokens[index]?.value as string;
        index++;
        const right = parseMultiplication();
        left = { type: "binary", operator, left, right };
      }

      return left;
    };

    const parseMultiplication = (): ExpressionNode => {
      let left = parseExponentiation();

      while (
        index < tokens.length &&
        tokens[index]?.type === "operator" &&
        ["*", "/"].includes(tokens[index]?.value as string)
      ) {
        const operator = tokens[index]?.value as string;
        index++;
        const right = parseExponentiation();
        left = { type: "binary", operator, left, right };
      }

      return left;
    };

    const parseExponentiation = (): ExpressionNode => {
      let left = parseUnary();

      while (
        index < tokens.length &&
        tokens[index]?.type === "operator" &&
        tokens[index]?.value === "^"
      ) {
        const operator = tokens[index]?.value as string;
        index++;
        const right = parseUnary();
        left = { type: "binary", operator, left, right };
      }

      return left;
    };

    const parseUnary = (): ExpressionNode => {
      if (
        index < tokens.length &&
        tokens[index]?.type === "operator" &&
        ["+", "-"].includes(tokens[index]?.value as string)
      ) {
        const operator = tokens[index]?.value as string;
        index++;
        const operand = parseUnary();
        return { type: "unary", operator, operand };
      }

      return parsePrimary();
    };

    const parsePrimary = (): ExpressionNode => {
      if (index >= tokens.length) {
        throw new Error("Unexpected end of formula");
      }

      const token = tokens[index];
      if (!token) {
        throw new Error("Unexpected end of formula");
      }

      switch (token.type) {
        case "number":
          index++;
          return { type: "number", value: token.value as number };

        case "string":
          index++;
          return { type: "string", value: token.value as string };

        case "cellref":
          index++;
          // Check if it's a range (next token is colon)
          if (index < tokens.length && tokens[index]?.type === "colon") {
            index++; // Skip colon
            if (index >= tokens.length || tokens[index]?.type !== "cellref") {
              throw new Error("Expected cell reference after colon");
            }
            const endRef = tokens[index]?.value as string;
            index++;
            return {
              type: "range",
              startRef: token.value as string,
              endRef,
            };
          }
          return { type: "cellref", value: token.value as string };

        case "function":
          const functionName = token.value as string;
          index++; // Skip function name

          if (index >= tokens.length || tokens[index]?.type !== "lparen") {
            throw new Error("Expected opening parenthesis after function name");
          }
          index++; // Skip opening parenthesis

          const args: ExpressionNode[] = [];

          if (index < tokens.length && tokens[index]?.type !== "rparen") {
            args.push(parseComparison());

            while (index < tokens.length && tokens[index]?.type === "comma") {
              index++; // Skip comma
              args.push(parseComparison());
            }
          }

          if (index >= tokens.length || tokens[index]?.type !== "rparen") {
            throw new Error("Expected closing parenthesis");
          }
          index++; // Skip closing parenthesis

          return { type: "function", name: functionName, args };

        case "lparen":
          index++; // Skip opening parenthesis
          const expr = parseComparison();

          if (index >= tokens.length || tokens[index]?.type !== "rparen") {
            throw new Error("Expected closing parenthesis");
          }
          index++; // Skip closing parenthesis

          return expr;

        default:
          throw new Error(`Unexpected token: ${token.type}`);
      }
    };

    return parseComparison();
  }

  /**
   * Evaluate expression tree
   */
  private static evaluateExpression(
    node: ExpressionNode,
    context: FormulaContext
  ): CalculationResult {
    const dependencies: CellReference[] = [];

    const evaluate = (node: ExpressionNode): CellValue => {
      switch (node.type) {
        case "number":
          return { type: "number", value: node.value };

        case "string":
          return { type: "string", value: node.value };

        case "cellref":
          const cellValue = this.getCellValue(node.value, context);
          const cellRef = this.parseCellReference(
            node.value,
            context.currentSheetId
          );
          dependencies.push(cellRef);
          return cellValue;

        case "range":
          // For ranges, we'll return an array-like structure
          const rangeValues = this.getRangeValues(
            node.startRef,
            node.endRef,
            context
          );
          rangeValues.dependencies.forEach((dep) => dependencies.push(dep));
          return rangeValues.values;

        case "function":
          const func = this.functions.get(node.name);
          if (!func) {
            return { type: "error", value: "NAME" };
          }

          const argValues = node.args.map((arg) => {
            const result = evaluate(arg);
            return result;
          });

          if (
            argValues.length < func.minArgs ||
            argValues.length > func.maxArgs
          ) {
            return { type: "error", value: "VALUE" };
          }

          return func.calculate(argValues, context);

        case "binary":
          const left = evaluate(node.left);
          const right = evaluate(node.right);

          return this.evaluateBinaryOperation(node.operator, left, right);

        case "unary":
          const operand = evaluate(node.operand);

          return this.evaluateUnaryOperation(node.operator, operand);

        default:
          return { type: "error", value: "INVALID_VALUE" };
      }
    };

    const value = evaluate(node);

    return {
      value,
      dependencies,
    };
  }

  /**
   * Get cell value from spreadsheet
   */
  private static getCellValue(
    cellRef: string,
    context: FormulaContext
  ): CellValue {
    try {
      const { sheetId, column, row } = this.parseCellReference(
        cellRef,
        context.currentSheetId
      );
      const sheet = context.spreadsheet.sheets.find((s) => s.id === sheetId);

      if (!sheet) {
        return { type: "error", value: "REFERENCE" };
      }

      const fullCellRef = `${column}${row}`;
      const cell = sheet.cells[fullCellRef];

      if (!cell || cell.value.type === "empty") {
        return { type: "number", value: 0 };
      }

      return cell.value;
    } catch {
      return { type: "error", value: "REFERENCE" };
    }
  }

  /**
   * Get range values from spreadsheet
   */
  private static getRangeValues(
    startRef: string,
    endRef: string,
    context: FormulaContext
  ): { values: CellValue; dependencies: CellReference[] } {
    const dependencies: CellReference[] = [];
    const values: CellValue[] = [];

    try {
      const start = this.parseCellReference(startRef, context.currentSheetId);
      const end = this.parseCellReference(endRef, context.currentSheetId);

      const startCol = SpreadsheetService.columnLetterToIndex(start.column);
      const endCol = SpreadsheetService.columnLetterToIndex(end.column);
      const startRow = start.row;
      const endRow = end.row;

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const column = SpreadsheetService.columnIndexToLetter(col);
          const cellRef = `${column}${row}`;
          const cellValue = this.getCellValue(cellRef, context);
          values.push(cellValue);

          dependencies.push({
            ...(start.sheetId && { sheetId: start.sheetId }),
            column,
            row,
            absoluteColumn: false,
            absoluteRow: false,
          });
        }
      }

      // Return as a special array-like value
      return {
        values: { type: "string", value: JSON.stringify(values) }, // Temporary representation
        dependencies,
      };
    } catch {
      return {
        values: { type: "error", value: "REFERENCE" },
        dependencies: [],
      };
    }
  }

  /**
   * Parse cell reference string
   */
  private static parseCellReference(
    cellRef: string,
    defaultSheetId: string
  ): CellReference {
    const match = cellRef.match(
      /^(?:([A-Za-z_][A-Za-z0-9_]*!)?\$?([A-Z]+)\$?(\d+))$/
    );

    if (!match) {
      throw new Error(`Invalid cell reference: ${cellRef}`);
    }

    const [, sheetPart, column, rowStr] = match;

    if (!column || !rowStr) {
      throw new Error(`Invalid cell reference: ${cellRef}`);
    }

    const sheetId = sheetPart ? sheetPart.slice(0, -1) : defaultSheetId;
    const row = parseInt(rowStr, 10);

    return {
      ...(sheetId && sheetId !== defaultSheetId && { sheetId }),
      column,
      row,
      absoluteColumn: cellRef.includes(`$${column}`),
      absoluteRow: cellRef.includes(`$${rowStr}`),
    };
  }

  /**
   * Evaluate binary operations
   */
  private static evaluateBinaryOperation(
    operator: string,
    left: CellValue,
    right: CellValue
  ): CellValue {
    // Handle errors
    if (left.type === "error") return left;
    if (right.type === "error") return right;

    // Convert to numbers for arithmetic operations
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    switch (operator) {
      case "+":
        if (leftNum === null || rightNum === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: leftNum + rightNum };

      case "-":
        if (leftNum === null || rightNum === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: leftNum - rightNum };

      case "*":
        if (leftNum === null || rightNum === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: leftNum * rightNum };

      case "/":
        if (leftNum === null || rightNum === null) {
          return { type: "error", value: "VALUE" };
        }
        if (rightNum === 0) {
          return { type: "error", value: "DIVIDE_BY_ZERO" };
        }
        return { type: "number", value: leftNum / rightNum };

      case "^":
        if (leftNum === null || rightNum === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: Math.pow(leftNum, rightNum) };

      case "=":
        return {
          type: "boolean",
          value: this.compareValues(left, right) === 0,
        };

      case "<":
        return { type: "boolean", value: this.compareValues(left, right) < 0 };

      case ">":
        return { type: "boolean", value: this.compareValues(left, right) > 0 };

      case "<=":
        return { type: "boolean", value: this.compareValues(left, right) <= 0 };

      case ">=":
        return { type: "boolean", value: this.compareValues(left, right) >= 0 };

      case "!=":
        return {
          type: "boolean",
          value: this.compareValues(left, right) !== 0,
        };

      default:
        return { type: "error", value: "INVALID_VALUE" };
    }
  }

  /**
   * Evaluate unary operations
   */
  private static evaluateUnaryOperation(
    operator: string,
    operand: CellValue
  ): CellValue {
    if (operand.type === "error") return operand;

    const num = this.toNumber(operand);

    switch (operator) {
      case "+":
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: num };

      case "-":
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: -num };

      default:
        return { type: "error", value: "INVALID_VALUE" };
    }
  }

  /**
   * Convert cell value to number
   */
  private static toNumber(value: CellValue): number | null {
    switch (value.type) {
      case "number":
        return value.value;
      case "boolean":
        return value.value ? 1 : 0;
      case "string":
        const num = parseFloat(value.value);
        return isNaN(num) ? null : num;
      case "date":
        return value.value.getTime();
      default:
        return null;
    }
  }

  /**
   * Compare two cell values
   */
  private static compareValues(left: CellValue, right: CellValue): number {
    // Handle same types
    if (left.type === right.type) {
      switch (left.type) {
        case "number":
          return (
            left.value - (right as { type: "number"; value: number }).value
          );
        case "string":
          return left.value.localeCompare(
            (right as { type: "string"; value: string }).value
          );
        case "boolean":
          return left.value ===
            (right as { type: "boolean"; value: boolean }).value
            ? 0
            : left.value
            ? 1
            : -1;
        case "date":
          return (
            left.value.getTime() -
            (right as { type: "date"; value: Date }).value.getTime()
          );
        default:
          return 0;
      }
    }

    // Try to convert to numbers
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum !== null && rightNum !== null) {
      return leftNum - rightNum;
    }

    // Convert to strings
    const leftStr = this.toString(left);
    const rightStr = this.toString(right);

    return leftStr.localeCompare(rightStr);
  }

  /**
   * Convert cell value to string
   */
  private static toString(value: CellValue): string {
    switch (value.type) {
      case "string":
        return value.value;
      case "number":
        return value.value.toString();
      case "boolean":
        return value.value ? "TRUE" : "FALSE";
      case "date":
        return value.value.toISOString();
      case "error":
        return `#${value.value}`;
      default:
        return "";
    }
  }

  /**
   * Initialize built-in functions
   */
  private static initializeFunctions(): void {
    // Mathematical functions
    this.registerFunction({
      name: "SUM",
      minArgs: 1,
      maxArgs: 255,
      description: "Adds all numbers in the arguments",
      syntax: "SUM(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        let sum = 0;

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            // Handle range values
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) sum += num;
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) sum += num;
          }
        }

        return { type: "number", value: sum };
      },
    });

    this.registerFunction({
      name: "AVERAGE",
      minArgs: 1,
      maxArgs: 255,
      description: "Calculates the average of numbers",
      syntax: "AVERAGE(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        let sum = 0;
        let count = 0;

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            // Handle range values
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) {
                  sum += num;
                  count++;
                }
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) {
              sum += num;
              count++;
            }
          }
        }

        if (count === 0) {
          return { type: "error", value: "DIVIDE_BY_ZERO" };
        }

        return { type: "number", value: sum / count };
      },
    });

    this.registerFunction({
      name: "COUNT",
      minArgs: 1,
      maxArgs: 255,
      description: "Counts cells that contain numbers",
      syntax: "COUNT(value1, [value2], ...)",
      calculate: (args: CellValue[]) => {
        let count = 0;

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            // Handle range values
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                if (val.type === "number") count++;
              }
            } catch {
              // Ignore invalid range values
            }
          } else if (arg.type === "number") {
            count++;
          }
        }

        return { type: "number", value: count };
      },
    });

    this.registerFunction({
      name: "MAX",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns the largest value",
      syntax: "MAX(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        let max = -Infinity;
        let hasNumber = false;

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            // Handle range values
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) {
                  max = Math.max(max, num);
                  hasNumber = true;
                }
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) {
              max = Math.max(max, num);
              hasNumber = true;
            }
          }
        }

        if (!hasNumber) {
          return { type: "number", value: 0 };
        }

        return { type: "number", value: max };
      },
    });

    this.registerFunction({
      name: "MIN",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns the smallest value",
      syntax: "MIN(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        let min = Infinity;
        let hasNumber = false;

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            // Handle range values
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) {
                  min = Math.min(min, num);
                  hasNumber = true;
                }
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) {
              min = Math.min(min, num);
              hasNumber = true;
            }
          }
        }

        if (!hasNumber) {
          return { type: "number", value: 0 };
        }

        return { type: "number", value: min };
      },
    });

    // Logical functions
    this.registerFunction({
      name: "IF",
      minArgs: 2,
      maxArgs: 3,
      description: "Returns one value if condition is true, another if false",
      syntax: "IF(condition, value_if_true, [value_if_false])",
      calculate: (args: CellValue[]) => {
        const condition = args[0];
        const trueValue = args[1];
        const falseValue = args[2] || { type: "boolean", value: false };

        if (!condition || !trueValue) {
          return { type: "error", value: "VALUE" };
        }

        let isTrue = false;

        switch (condition.type) {
          case "boolean":
            isTrue = condition.value;
            break;
          case "number":
            isTrue = condition.value !== 0;
            break;
          case "string":
            isTrue = condition.value !== "";
            break;
          default:
            isTrue = false;
        }

        return isTrue ? trueValue : falseValue;
      },
    });

    // Text functions
    this.registerFunction({
      name: "CONCATENATE",
      minArgs: 1,
      maxArgs: 255,
      description: "Joins text strings",
      syntax: "CONCATENATE(text1, [text2], ...)",
      calculate: (args: CellValue[]) => {
        let result = "";

        for (const arg of args) {
          result += this.toString(arg);
        }

        return { type: "string", value: result };
      },
    });

    // Date functions
    this.registerFunction({
      name: "NOW",
      minArgs: 0,
      maxArgs: 0,
      description: "Returns current date and time",
      syntax: "NOW()",
      calculate: () => {
        return { type: "date", value: new Date() };
      },
    });

    this.registerFunction({
      name: "TODAY",
      minArgs: 0,
      maxArgs: 0,
      description: "Returns current date",
      syntax: "TODAY()",
      calculate: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { type: "date", value: today };
      },
    });

    // Advanced mathematical functions
    this.registerFunction({
      name: "ROUND",
      minArgs: 1,
      maxArgs: 2,
      description: "Rounds a number to specified decimal places",
      syntax: "ROUND(number, [digits])",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const num = this.toNumber(args[0]);
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }

        const digits = args[1] ? this.toNumber(args[1]) || 0 : 0;
        const factor = Math.pow(10, digits);
        return { type: "number", value: Math.round(num * factor) / factor };
      },
    });

    this.registerFunction({
      name: "ROUNDUP",
      minArgs: 1,
      maxArgs: 2,
      description: "Rounds a number up to specified decimal places",
      syntax: "ROUNDUP(number, [digits])",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const num = this.toNumber(args[0]);
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }

        const digits = args[1] ? this.toNumber(args[1]) || 0 : 0;
        const factor = Math.pow(10, digits);
        return { type: "number", value: Math.ceil(num * factor) / factor };
      },
    });

    this.registerFunction({
      name: "ROUNDDOWN",
      minArgs: 1,
      maxArgs: 2,
      description: "Rounds a number down to specified decimal places",
      syntax: "ROUNDDOWN(number, [digits])",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const num = this.toNumber(args[0]);
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }

        const digits = args[1] ? this.toNumber(args[1]) || 0 : 0;
        const factor = Math.pow(10, digits);
        return { type: "number", value: Math.floor(num * factor) / factor };
      },
    });

    this.registerFunction({
      name: "ABS",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the absolute value of a number",
      syntax: "ABS(number)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const num = this.toNumber(args[0]);
        if (num === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: Math.abs(num) };
      },
    });

    this.registerFunction({
      name: "SQRT",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the square root of a number",
      syntax: "SQRT(number)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const num = this.toNumber(args[0]);
        if (num === null || num < 0) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: Math.sqrt(num) };
      },
    });

    this.registerFunction({
      name: "POWER",
      minArgs: 2,
      maxArgs: 2,
      description: "Returns a number raised to a power",
      syntax: "POWER(number, power)",
      calculate: (args: CellValue[]) => {
        if (!args[0] || !args[1]) {
          return { type: "error", value: "VALUE" };
        }

        const base = this.toNumber(args[0]);
        const exponent = this.toNumber(args[1]);
        if (base === null || exponent === null) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: Math.pow(base, exponent) };
      },
    });

    // Statistical functions
    this.registerFunction({
      name: "MEDIAN",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns the median of numbers",
      syntax: "MEDIAN(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        const numbers: number[] = [];

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) numbers.push(num);
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) numbers.push(num);
          }
        }

        if (numbers.length === 0) {
          return { type: "error", value: "VALUE" };
        }

        numbers.sort((a, b) => a - b);
        const mid = Math.floor(numbers.length / 2);

        if (numbers.length % 2 === 0) {
          const value1 = numbers[mid - 1];
          const value2 = numbers[mid];
          if (value1 !== undefined && value2 !== undefined) {
            return {
              type: "number",
              value: (value1 + value2) / 2,
            };
          }
        } else {
          const value = numbers[mid];
          if (value !== undefined) {
            return { type: "number", value };
          }
        }

        return { type: "error", value: "VALUE" };
      },
    });

    this.registerFunction({
      name: "MODE",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns the most frequently occurring value",
      syntax: "MODE(number1, [number2], ...)",
      calculate: (args: CellValue[]) => {
        const numbers: number[] = [];

        for (const arg of args) {
          if (arg.type === "string" && arg.value.startsWith("[")) {
            try {
              const rangeValues = JSON.parse(arg.value) as CellValue[];
              for (const val of rangeValues) {
                const num = this.toNumber(val);
                if (num !== null) numbers.push(num);
              }
            } catch {
              // Ignore invalid range values
            }
          } else {
            const num = this.toNumber(arg);
            if (num !== null) numbers.push(num);
          }
        }

        if (numbers.length === 0) {
          return { type: "error", value: "VALUE" };
        }

        const frequency: Record<number, number> = {};
        let maxCount = 0;
        let mode: number | null = null;

        for (const num of numbers) {
          const count = (frequency[num] || 0) + 1;
          frequency[num] = count;
          if (count > maxCount) {
            maxCount = count;
            mode = num;
          }
        }

        if (maxCount === 1) {
          return { type: "error", value: "NOT_AVAILABLE" };
        }

        return { type: "number", value: mode! };
      },
    });

    // Lookup functions
    this.registerFunction({
      name: "VLOOKUP",
      minArgs: 3,
      maxArgs: 4,
      description:
        "Looks up a value in the first column and returns a value in the same row",
      syntax:
        "VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",
      calculate: (args: CellValue[], _context: FormulaContext) => {
        if (!args[0] || !args[1] || !args[2]) {
          return { type: "error", value: "VALUE" };
        }

        const colIndex = this.toNumber(args[2]);

        if (colIndex === null || colIndex < 1) {
          return { type: "error", value: "VALUE" };
        }

        // For now, return a placeholder - full implementation would require range parsing
        return { type: "error", value: "NOT_AVAILABLE" };
      },
    });

    // Text functions
    this.registerFunction({
      name: "LEFT",
      minArgs: 1,
      maxArgs: 2,
      description: "Returns leftmost characters from text",
      syntax: "LEFT(text, [num_chars])",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        const numChars = args[1] ? this.toNumber(args[1]) || 1 : 1;

        return {
          type: "string",
          value: text.substring(0, Math.max(0, numChars)),
        };
      },
    });

    this.registerFunction({
      name: "RIGHT",
      minArgs: 1,
      maxArgs: 2,
      description: "Returns rightmost characters from text",
      syntax: "RIGHT(text, [num_chars])",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        const numChars = args[1] ? this.toNumber(args[1]) || 1 : 1;

        return {
          type: "string",
          value: text.substring(Math.max(0, text.length - numChars)),
        };
      },
    });

    this.registerFunction({
      name: "MID",
      minArgs: 3,
      maxArgs: 3,
      description: "Returns characters from the middle of text",
      syntax: "MID(text, start_num, num_chars)",
      calculate: (args: CellValue[]) => {
        if (!args[0] || !args[1] || !args[2]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        const startNum = this.toNumber(args[1]);
        const numChars = this.toNumber(args[2]);

        if (startNum === null || numChars === null || startNum < 1) {
          return { type: "error", value: "VALUE" };
        }

        return {
          type: "string",
          value: text.substring(startNum - 1, startNum - 1 + numChars),
        };
      },
    });

    this.registerFunction({
      name: "LEN",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the length of text",
      syntax: "LEN(text)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        return { type: "number", value: text.length };
      },
    });

    this.registerFunction({
      name: "UPPER",
      minArgs: 1,
      maxArgs: 1,
      description: "Converts text to uppercase",
      syntax: "UPPER(text)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        return { type: "string", value: text.toUpperCase() };
      },
    });

    this.registerFunction({
      name: "LOWER",
      minArgs: 1,
      maxArgs: 1,
      description: "Converts text to lowercase",
      syntax: "LOWER(text)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        return { type: "string", value: text.toLowerCase() };
      },
    });

    this.registerFunction({
      name: "TRIM",
      minArgs: 1,
      maxArgs: 1,
      description: "Removes extra spaces from text",
      syntax: "TRIM(text)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const text = this.toString(args[0]);
        return { type: "string", value: text.trim().replace(/\s+/g, " ") };
      },
    });

    // Date functions
    this.registerFunction({
      name: "YEAR",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the year of a date",
      syntax: "YEAR(date)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const date = this.toDate(args[0]);
        if (!date) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: date.getFullYear() };
      },
    });

    this.registerFunction({
      name: "MONTH",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the month of a date",
      syntax: "MONTH(date)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const date = this.toDate(args[0]);
        if (!date) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: date.getMonth() + 1 };
      },
    });

    this.registerFunction({
      name: "DAY",
      minArgs: 1,
      maxArgs: 1,
      description: "Returns the day of a date",
      syntax: "DAY(date)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        const date = this.toDate(args[0]);
        if (!date) {
          return { type: "error", value: "VALUE" };
        }
        return { type: "number", value: date.getDate() };
      },
    });

    this.registerFunction({
      name: "DATE",
      minArgs: 3,
      maxArgs: 3,
      description: "Creates a date from year, month, and day",
      syntax: "DATE(year, month, day)",
      calculate: (args: CellValue[]) => {
        if (!args[0] || !args[1] || !args[2]) {
          return { type: "error", value: "VALUE" };
        }

        const year = this.toNumber(args[0]);
        const month = this.toNumber(args[1]);
        const day = this.toNumber(args[2]);

        if (year === null || month === null || day === null) {
          return { type: "error", value: "VALUE" };
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
          return { type: "error", value: "VALUE" };
        }

        return { type: "date", value: date };
      },
    });

    // Logical functions
    this.registerFunction({
      name: "AND",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns TRUE if all arguments are TRUE",
      syntax: "AND(logical1, [logical2], ...)",
      calculate: (args: CellValue[]) => {
        for (const arg of args) {
          if (!this.toBoolean(arg)) {
            return { type: "boolean", value: false };
          }
        }
        return { type: "boolean", value: true };
      },
    });

    this.registerFunction({
      name: "OR",
      minArgs: 1,
      maxArgs: 255,
      description: "Returns TRUE if any argument is TRUE",
      syntax: "OR(logical1, [logical2], ...)",
      calculate: (args: CellValue[]) => {
        for (const arg of args) {
          if (this.toBoolean(arg)) {
            return { type: "boolean", value: true };
          }
        }
        return { type: "boolean", value: false };
      },
    });

    this.registerFunction({
      name: "NOT",
      minArgs: 1,
      maxArgs: 1,
      description: "Reverses the logic of its argument",
      syntax: "NOT(logical)",
      calculate: (args: CellValue[]) => {
        if (!args[0]) {
          return { type: "error", value: "VALUE" };
        }

        return { type: "boolean", value: !this.toBoolean(args[0]) };
      },
    });
  }

  /**
   * Convert cell value to boolean
   */
  private static toBoolean(value: CellValue): boolean {
    switch (value.type) {
      case "boolean":
        return value.value;
      case "number":
        return value.value !== 0;
      case "string":
        return value.value !== "";
      case "date":
        return true;
      default:
        return false;
    }
  }

  /**
   * Convert cell value to date
   */
  private static toDate(value: CellValue): Date | null {
    switch (value.type) {
      case "date":
        return value.value;
      case "number":
        // Excel-style date serial number (days since 1900-01-01)
        const excelEpoch = new Date(1900, 0, 1);
        return new Date(
          excelEpoch.getTime() + (value.value - 1) * 24 * 60 * 60 * 1000
        );
      case "string":
        const date = new Date(value.value);
        return isNaN(date.getTime()) ? null : date;
      default:
        return null;
    }
  }

  /**
   * Register a new function
   */
  static registerFunction(func: FunctionDefinition): void {
    this.functions.set(func.name.toUpperCase(), func);
  }

  /**
   * Get all available functions
   */
  static getFunctions(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  /**
   * Get function by name
   */
  static getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name.toUpperCase());
  }
}

// Token types for formula parsing
interface Token {
  type:
    | "number"
    | "string"
    | "cellref"
    | "function"
    | "operator"
    | "lparen"
    | "rparen"
    | "comma"
    | "colon";
  value: string | number;
}

// Expression tree node types
type ExpressionNode =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "cellref"; value: string }
  | { type: "range"; startRef: string; endRef: string }
  | { type: "function"; name: string; args: ExpressionNode[] }
  | {
      type: "binary";
      operator: string;
      left: ExpressionNode;
      right: ExpressionNode;
    }
  | { type: "unary"; operator: string; operand: ExpressionNode };
