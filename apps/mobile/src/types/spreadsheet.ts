export interface Spreadsheet {
  id: string;
  documentId: string;
  title: string;
  sheets: Sheet[];
  namedRanges: Record<string, NamedRange>;
  charts: Chart[];
  pivotTables: PivotTable[];
  dataValidationRules: DataValidationRule[];
  conditionalFormatting: ConditionalFormatRule[];
  protectedRanges: ProtectedRange[];
  settings: SpreadsheetSettings;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sheet {
  id: string;
  title: string;
  index: number;
  gridProperties: GridProperties;
  cells: Record<string, Cell>; // "A1" -> Cell
  mergedRanges: GridRange[];
  conditionalFormatting: ConditionalFormatRule[];
  protectedRanges: ProtectedRange[];
  filterViews: FilterView[];
  isHidden: boolean;
  tabColor?: Color;
}

export interface GridProperties {
  rowCount: number;
  columnCount: number;
  frozenRowCount: number;
  frozenColumnCount: number;
  hideGridlines: boolean;
  rowGroupControlAfter: boolean;
  columnGroupControlAfter: boolean;
}

export interface Cell {
  value: CellValue;
  formula?: string;
  format: CellFormat;
  note?: string;
  hyperlink?: string;
  dataValidation?: DataValidation;
}

export type CellValue = 
  | { type: 'empty' }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'date'; value: Date }
  | { type: 'error'; value: CellError };

export type CellError = 
  | 'DIVIDE_BY_ZERO'
  | 'INVALID_REFERENCE'
  | 'INVALID_VALUE'
  | 'NOT_AVAILABLE'
  | 'NAME'
  | 'NULL'
  | 'NUMBER'
  | 'REFERENCE'
  | 'VALUE';

export interface CellFormat {
  numberFormat: NumberFormat;
  backgroundColor?: Color;
  borders: Borders;
  padding: Padding;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
  wrapStrategy: WrapStrategy;
  textDirection: TextDirection;
  textFormat: TextFormat;
  textRotation: TextRotation;
}

export interface NumberFormat {
  formatType: NumberFormatType;
  pattern: string;
}

export type NumberFormatType = 
  | 'TEXT'
  | 'NUMBER'
  | 'PERCENT'
  | 'CURRENCY'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'SCIENTIFIC';

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface Borders {
  top?: Border;
  bottom?: Border;
  left?: Border;
  right?: Border;
}

export interface Border {
  style: BorderStyle;
  width: number;
  color: Color;
}

export type BorderStyle = 
  | 'NONE'
  | 'DOTTED'
  | 'DASHED'
  | 'SOLID'
  | 'SOLID_MEDIUM'
  | 'SOLID_THICK'
  | 'DOUBLE';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type HorizontalAlignment = 'LEFT' | 'CENTER' | 'RIGHT';
export type VerticalAlignment = 'TOP' | 'MIDDLE' | 'BOTTOM';
export type WrapStrategy = 'OVERFLOW_CELL' | 'LEGACY_WRAP' | 'CLIP' | 'WRAP';
export type TextDirection = 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';

export interface TextFormat {
  foregroundColor?: Color;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
}

export interface TextRotation {
  angle: number; // -90 to 90 degrees
  vertical: boolean;
}

export interface GridRange {
  sheetId: string;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

export interface NamedRange {
  name: string;
  range: GridRange;
  description?: string;
}

export interface Chart {
  id: string;
  title: string;
  chartType: ChartType;
  dataRange: GridRange;
  position: ChartPosition;
  spec: ChartSpec;
}

export type ChartType = 
  | 'LINE'
  | 'AREA'
  | 'COLUMN'
  | 'BAR'
  | 'PIE'
  | 'SCATTER'
  | 'COMBO'
  | 'HISTOGRAM'
  | 'CANDLESTICK'
  | 'ORG'
  | 'TREEMAP'
  | 'WATERFALL';

export interface ChartPosition {
  overlayPosition?: OverlayPosition;
  newSheet: boolean;
}

export interface OverlayPosition {
  anchorCell: GridCoordinate;
  offsetXPixels: number;
  offsetYPixels: number;
  widthPixels: number;
  heightPixels: number;
}

export interface GridCoordinate {
  sheetId: string;
  rowIndex: number;
  columnIndex: number;
}

export interface ChartSpec {
  title: string;
  subtitle?: string;
  fontName: string;
  maximizeInChart: boolean;
  backgroundColor?: Color;
  altText?: string;
  titleTextFormat?: TextFormat;
  subtitleTextFormat?: TextFormat;
  hiddenDimensionStrategy: HiddenDimensionStrategy;
}

export type HiddenDimensionStrategy = 
  | 'SKIP_HIDDEN_ROWS_AND_COLUMNS'
  | 'SKIP_HIDDEN_ROWS'
  | 'SKIP_HIDDEN_COLUMNS'
  | 'SHOW_ALL';

export interface PivotTable {
  id: string;
  title: string;
  sourceRange: GridRange;
  rows: PivotGroup[];
  columns: PivotGroup[];
  values: PivotValue[];
  filters: PivotFilter[];
  valueLayout: ValueLayout;
}

export interface PivotGroup {
  sourceColumnOffset: number;
  showTotals: boolean;
  sortOrder: SortOrder;
  valueBucket?: PivotGroupSortValueBucket;
  valueMetadata: PivotGroupValueMetadata[];
  groupRule?: PivotGroupRule;
  groupLimit?: PivotGroupLimit;
}

export type SortOrder = 'ASCENDING' | 'DESCENDING';

export interface PivotGroupSortValueBucket {
  values: ExtendedValue[];
  valuesIndex: number;
}

export type ExtendedValue = 
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'formula'; value: string }
  | { type: 'error'; value: CellError };

export interface PivotGroupValueMetadata {
  value: ExtendedValue;
  collapsed: boolean;
}

export interface PivotGroupRule {
  manualRule?: ManualRule;
  histogramRule?: HistogramRule;
  dateTimeRule?: DateTimeRule;
}

export interface ManualRule {
  groups: ManualRuleGroup[];
}

export interface ManualRuleGroup {
  groupName: ExtendedValue;
  items: ExtendedValue[];
}

export interface HistogramRule {
  intervalSize: number;
  minValue: number;
  maxValue: number;
}

export interface DateTimeRule {
  ruleType: DateTimeRuleType;
}

export type DateTimeRuleType = 
  | 'SECOND'
  | 'MINUTE'
  | 'HOUR'
  | 'HOUR_MINUTE'
  | 'HOUR_MINUTE_AM_PM'
  | 'DAY_OF_WEEK'
  | 'DAY_OF_YEAR'
  | 'DAY_OF_MONTH'
  | 'DAY_MONTH'
  | 'MONTH'
  | 'QUARTER'
  | 'YEAR'
  | 'YEAR_MONTH'
  | 'YEAR_QUARTER'
  | 'YEAR_MONTH_DAY';

export interface PivotGroupLimit {
  count: number;
  applyOrder: number;
}

export interface PivotValue {
  sourceColumnOffset: number;
  summarizeFunction: PivotStandardValueFunction;
  name: string;
  calculatedDisplayType: PivotValueCalculatedDisplayType;
  formula?: string;
}

export type PivotStandardValueFunction = 
  | 'SUM'
  | 'COUNT'
  | 'COUNT_A'
  | 'COUNT_UNIQUE'
  | 'AVERAGE'
  | 'MAX'
  | 'MIN'
  | 'MEDIAN'
  | 'PRODUCT'
  | 'ST_DEV'
  | 'ST_DEV_P'
  | 'VAR'
  | 'VAR_P'
  | 'CUSTOM';

export type PivotValueCalculatedDisplayType = 
  | 'DEFAULT'
  | 'PERCENT_OF_ROW_TOTAL'
  | 'PERCENT_OF_COLUMN_TOTAL'
  | 'PERCENT_OF_GRAND_TOTAL'
  | 'RUNNING_TOTAL'
  | 'PERCENT_RUNNING_TOTAL'
  | 'PERCENT_OF_PARENT_ROW_TOTAL'
  | 'PERCENT_OF_PARENT_COLUMN_TOTAL'
  | 'PERCENT_OF_PARENT_TOTAL';

export interface PivotFilter {
  sourceColumnOffset: number;
  criteria: FilterCriteria;
  visibleValues: string[];
  visibleByDefault: boolean;
}

export type ValueLayout = 'HORIZONTAL' | 'VERTICAL';

export interface DataValidationRule {
  range: GridRange;
  condition: BooleanCondition;
  inputMessage?: string;
  strict: boolean;
  showCustomUi: boolean;
}

export interface DataValidation {
  condition: BooleanCondition;
  inputMessage?: string;
  strict: boolean;
  showCustomUi: boolean;
}

export interface BooleanCondition {
  conditionType: ConditionType;
  values: ConditionValue[];
}

export type ConditionType = 
  | 'NUMBER_GREATER'
  | 'NUMBER_GREATER_THAN_EQ'
  | 'NUMBER_LESS'
  | 'NUMBER_LESS_THAN_EQ'
  | 'NUMBER_EQ'
  | 'NUMBER_NOT_EQ'
  | 'NUMBER_BETWEEN'
  | 'NUMBER_NOT_BETWEEN'
  | 'TEXT_CONTAINS'
  | 'TEXT_NOT_CONTAINS'
  | 'TEXT_STARTS_WITH'
  | 'TEXT_ENDS_WITH'
  | 'TEXT_EQ'
  | 'TEXT_IS_EMAIL'
  | 'TEXT_IS_URL'
  | 'DATE_EQ'
  | 'DATE_BEFORE'
  | 'DATE_AFTER'
  | 'DATE_ON_OR_BEFORE'
  | 'DATE_ON_OR_AFTER'
  | 'DATE_BETWEEN'
  | 'DATE_NOT_BETWEEN'
  | 'DATE_IS_VALID'
  | 'ONE_OF_RANGE'
  | 'ONE_OF_LIST'
  | 'BLANK'
  | 'NOT_BLANK'
  | 'CUSTOM'
  | 'BOOLEAN';

export interface ConditionValue {
  relativeDate?: RelativeDate;
  userEnteredValue?: string;
}

export type RelativeDate = 
  | 'PAST_YEAR'
  | 'PAST_MONTH'
  | 'PAST_WEEK'
  | 'YESTERDAY'
  | 'TODAY'
  | 'TOMORROW';

export interface ConditionalFormatRule {
  ranges: GridRange[];
  booleanRule?: BooleanRule;
  gradientRule?: GradientRule;
}

export interface BooleanRule {
  condition: BooleanCondition;
  format: CellFormat;
}

export interface GradientRule {
  minPoint: InterpolationPoint;
  midPoint?: InterpolationPoint;
  maxPoint: InterpolationPoint;
}

export interface InterpolationPoint {
  color: Color;
  pointType: InterpolationPointType;
  value?: string;
}

export type InterpolationPointType = 
  | 'MIN'
  | 'MAX'
  | 'NUMBER'
  | 'PERCENT'
  | 'PERCENTILE';

export interface ProtectedRange {
  range: GridRange;
  description: string;
  warningOnly: boolean;
  requestingUserCanEdit: boolean;
  unprotectedRanges: GridRange[];
  editors: Editors;
}

export interface Editors {
  users: string[];
  groups: string[];
  domainUsersCanEdit: boolean;
}

export interface FilterView {
  id: string;
  title: string;
  range: GridRange;
  sortSpecs: SortSpec[];
  criteria: Record<number, FilterCriteria>;
}

export interface SortSpec {
  dimensionIndex: number;
  sortOrder: SortOrder;
  foregroundColor?: Color;
  backgroundColor?: Color;
}

export interface FilterCriteria {
  hiddenValues: string[];
  condition?: BooleanCondition;
  visibleForegroundColor?: Color;
  visibleBackgroundColor?: Color;
}

export interface SpreadsheetSettings {
  locale: string;
  timeZone: string;
  defaultFormat: CellFormat;
  iterativeCalculationSettings: IterativeCalculationSettings;
}

export interface IterativeCalculationSettings {
  maxIterations: number;
  convergenceThreshold: number;
}

// Formula engine types
export interface Formula {
  expression: string;
  dependencies: CellReference[];
  result: CellValue;
  error?: CellError;
}

export interface CellReference {
  sheetId?: string;
  column: string;
  row: number;
  absoluteColumn: boolean;
  absoluteRow: boolean;
}

// Request/Response DTOs
export interface UpdateCellRequest {
  sheetId: string;
  cellReference: string;
  value?: CellValue;
  formula?: string;
  format?: CellFormat;
}

export interface BatchUpdateCellsRequest {
  updates: UpdateCellRequest[];
}

export interface CreateSheetRequest {
  title: string;
  gridProperties?: GridProperties;
  tabColor?: Color;
}

export interface CreateChartRequest {
  title: string;
  chartType: ChartType;
  dataRange: GridRange;
  position: ChartPosition;
}

export interface CreatePivotTableRequest {
  title: string;
  sourceRange: GridRange;
  rows: PivotGroup[];
  columns: PivotGroup[];
  values: PivotValue[];
}

export interface SpreadsheetResponse {
  id: string;
  title: string;
  sheets: SheetResponse[];
  namedRanges: Record<string, NamedRange>;
  charts: Chart[];
  pivotTables: PivotTable[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SheetResponse {
  id: string;
  title: string;
  index: number;
  gridProperties: GridProperties;
  isHidden: boolean;
  tabColor?: Color;
}

// Mobile-specific interfaces
export interface MobileSpreadsheetProps {
  spreadsheet: Spreadsheet;
  activeSheetId: string;
  onCellEdit: (sheetId: string, cellRef: string, value: CellValue, formula?: string) => void;
  onSheetChange: (sheetId: string) => void;
  onZoom: (scale: number) => void;
  readOnly?: boolean;
  showFormulas?: boolean;
}

export interface CellEditingState {
  isEditing: boolean;
  cellRef?: string;
  sheetId?: string;
  value: string;
  formula?: string;
  keyboardType: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
}

export interface SpreadsheetViewport {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface TouchGesture {
  type: 'tap' | 'long-press' | 'double-tap' | 'pan' | 'pinch';
  cellRef?: string;
  position: { x: number; y: number };
  scale?: number;
  velocity?: { x: number; y: number };
}

export interface FormulaInputState {
  isVisible: boolean;
  cellRef?: string;
  formula: string;
  suggestions: FormulaSuggestion[];
  cursorPosition: number;
}

export interface FormulaSuggestion {
  type: 'function' | 'cell' | 'range' | 'named-range';
  text: string;
  description: string;
  insertText: string;
}

export interface SpreadsheetToolbarAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  group?: string;
}

export interface CellSelection {
  startCell: string;
  endCell: string;
  sheetId: string;
  isMultiple: boolean;
}

export interface SpreadsheetCreateRequest {
  title: string;
  folderId?: string;
  templateId?: string;
}

export interface SpreadsheetUpdateRequest {
  title?: string;
  folderId?: string;
}