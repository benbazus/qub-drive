import { CellReference, CellValue, Spreadsheet } from '@/types/spreadsheet';
import { FormulaEngine } from './formulaEngine';

export interface DependencyNode {
  cellRef: string;
  sheetId: string;
  formula?: string;
  dependencies: Set<string>; // Cells this cell depends on
  dependents: Set<string>; // Cells that depend on this cell
  calculationOrder: number;
  isCircular: boolean;
}

export interface CalculationChain {
  cells: string[];
  hasCircularReference: boolean;
  circularCells: string[];
}

export class CellDependencyTracker {
  private dependencyGraph: Map<string, DependencyNode> = new Map();
  private calculationChain: string[] = [];
  private circularReferences: Set<string> = new Set();

  /**
   * Update dependencies for a cell
   */
  updateCellDependencies(
    cellRef: string,
    sheetId: string,
    formula?: string
  ): void {
    const fullCellRef = `${sheetId}:${cellRef}`;
    
    // Remove existing dependencies
    this.removeCellDependencies(fullCellRef);
    
    if (formula) {
      // Get new dependencies
      const dependencies = FormulaEngine.getDependencies(formula);
      
      // Create or update node
      const node: DependencyNode = {
        cellRef,
        sheetId,
        formula,
        dependencies: new Set(),
        dependents: new Set(),
        calculationOrder: 0,
        isCircular: false,
      };
      
      // Add dependencies
      for (const dep of dependencies) {
        const depSheetId = dep.sheetId || sheetId;
        const depCellRef = `${dep.column}${dep.row}`;
        const depFullRef = `${depSheetId}:${depCellRef}`;
        
        node.dependencies.add(depFullRef);
        
        // Update dependent's dependents list
        const depNode = this.getOrCreateNode(depCellRef, depSheetId);
        depNode.dependents.add(fullCellRef);
        this.dependencyGraph.set(depFullRef, depNode);
      }
      
      this.dependencyGraph.set(fullCellRef, node);
      
      // Recalculate calculation order
      this.updateCalculationOrder();
    }
  }

  /**
   * Remove cell dependencies
   */
  removeCellDependencies(fullCellRef: string): void {
    const node = this.dependencyGraph.get(fullCellRef);
    if (!node) return;
    
    // Remove from dependents of cells this cell depends on
    for (const depRef of node.dependencies) {
      const depNode = this.dependencyGraph.get(depRef);
      if (depNode) {
        depNode.dependents.delete(fullCellRef);
      }
    }
    
    // Remove from dependencies of cells that depend on this cell
    for (const dependentRef of node.dependents) {
      const dependentNode = this.dependencyGraph.get(dependentRef);
      if (dependentNode) {
        dependentNode.dependencies.delete(fullCellRef);
      }
    }
    
    this.dependencyGraph.delete(fullCellRef);
    this.circularReferences.delete(fullCellRef);
  }

  /**
   * Get or create a dependency node
   */
  private getOrCreateNode(cellRef: string, sheetId: string): DependencyNode {
    const fullCellRef = `${sheetId}:${cellRef}`;
    let node = this.dependencyGraph.get(fullCellRef);
    
    if (!node) {
      node = {
        cellRef,
        sheetId,
        dependencies: new Set(),
        dependents: new Set(),
        calculationOrder: 0,
        isCircular: false,
      };
    }
    
    return node;
  }

  /**
   * Update calculation order using topological sort
   */
  updateCalculationOrder(): void {
    this.calculationChain = [];
    this.circularReferences.clear();
    
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];
    
    // Perform DFS to detect cycles and determine order
    const visit = (nodeRef: string): boolean => {
      if (visiting.has(nodeRef)) {
        // Circular reference detected
        this.markCircularReference(nodeRef, visiting);
        return false;
      }
      
      if (visited.has(nodeRef)) {
        return true;
      }
      
      visiting.add(nodeRef);
      
      const node = this.dependencyGraph.get(nodeRef);
      if (node) {
        // Visit all dependencies first
        for (const depRef of node.dependencies) {
          if (!visit(depRef)) {
            node.isCircular = true;
          }
        }
      }
      
      visiting.delete(nodeRef);
      visited.add(nodeRef);
      order.push(nodeRef);
      
      return true;
    };
    
    // Visit all nodes
    for (const nodeRef of this.dependencyGraph.keys()) {
      if (!visited.has(nodeRef)) {
        visit(nodeRef);
      }
    }
    
    // Update calculation order
    this.calculationChain = order;
    
    // Update order numbers in nodes
    for (let i = 0; i < order.length; i++) {
      const node = this.dependencyGraph.get(order[i]);
      if (node) {
        node.calculationOrder = i;
      }
    }
  }

  /**
   * Mark circular reference chain
   */
  private markCircularReference(startRef: string, visiting: Set<string>): void {
    const chain = Array.from(visiting);
    const startIndex = chain.indexOf(startRef);
    
    if (startIndex >= 0) {
      const circularChain = chain.slice(startIndex);
      
      for (const ref of circularChain) {
        this.circularReferences.add(ref);
        const node = this.dependencyGraph.get(ref);
        if (node) {
          node.isCircular = true;
        }
      }
    }
  }

  /**
   * Get calculation chain
   */
  getCalculationChain(): CalculationChain {
    return {
      cells: [...this.calculationChain],
      hasCircularReference: this.circularReferences.size > 0,
      circularCells: Array.from(this.circularReferences),
    };
  }

  /**
   * Get cells that depend on a given cell
   */
  getDependentCells(cellRef: string, sheetId: string): string[] {
    const fullCellRef = `${sheetId}:${cellRef}`;
    const node = this.dependencyGraph.get(fullCellRef);
    
    if (!node) return [];
    
    return Array.from(node.dependents);
  }

  /**
   * Get cells that a given cell depends on
   */
  getCellDependencies(cellRef: string, sheetId: string): string[] {
    const fullCellRef = `${sheetId}:${cellRef}`;
    const node = this.dependencyGraph.get(fullCellRef);
    
    if (!node) return [];
    
    return Array.from(node.dependencies);
  }

  /**
   * Check if a cell has circular references
   */
  hasCircularReference(cellRef: string, sheetId: string): boolean {
    const fullCellRef = `${sheetId}:${cellRef}`;
    return this.circularReferences.has(fullCellRef);
  }

  /**
   * Get all cells that need recalculation when a cell changes
   */
  getCellsToRecalculate(cellRef: string, sheetId: string): string[] {
    const fullCellRef = `${sheetId}:${cellRef}`;
    const toRecalculate = new Set<string>();
    const visited = new Set<string>();
    
    const collectDependents = (ref: string) => {
      if (visited.has(ref)) return;
      visited.add(ref);
      
      const node = this.dependencyGraph.get(ref);
      if (!node) return;
      
      for (const dependent of node.dependents) {
        toRecalculate.add(dependent);
        collectDependents(dependent);
      }
    };
    
    collectDependents(fullCellRef);
    
    // Sort by calculation order
    const result = Array.from(toRecalculate);
    result.sort((a, b) => {
      const nodeA = this.dependencyGraph.get(a);
      const nodeB = this.dependencyGraph.get(b);
      
      if (!nodeA || !nodeB) return 0;
      
      return nodeA.calculationOrder - nodeB.calculationOrder;
    });
    
    return result;
  }

  /**
   * Validate that adding a dependency won't create a circular reference
   */
  wouldCreateCircularReference(
    fromCellRef: string,
    fromSheetId: string,
    toCellRef: string,
    toSheetId: string
  ): boolean {
    const fromFullRef = `${fromSheetId}:${fromCellRef}`;
    const toFullRef = `${toSheetId}:${toCellRef}`;
    
    // Check if toCellRef already depends on fromCellRef
    const dependents = this.getCellsToRecalculate(toCellRef, toSheetId);
    return dependents.includes(fromFullRef);
  }

  /**
   * Get dependency tree for visualization
   */
  getDependencyTree(cellRef: string, sheetId: string): DependencyTree {
    const fullCellRef = `${sheetId}:${cellRef}`;
    const node = this.dependencyGraph.get(fullCellRef);
    
    if (!node) {
      return {
        cellRef: fullCellRef,
        dependencies: [],
        dependents: [],
        isCircular: false,
      };
    }
    
    const buildTree = (ref: string, visited: Set<string> = new Set()): DependencyTree => {
      if (visited.has(ref)) {
        return {
          cellRef: ref,
          dependencies: [],
          dependents: [],
          isCircular: true,
        };
      }
      
      visited.add(ref);
      const currentNode = this.dependencyGraph.get(ref);
      
      if (!currentNode) {
        return {
          cellRef: ref,
          dependencies: [],
          dependents: [],
          isCircular: false,
        };
      }
      
      return {
        cellRef: ref,
        dependencies: Array.from(currentNode.dependencies).map(depRef => 
          buildTree(depRef, new Set(visited))
        ),
        dependents: Array.from(currentNode.dependents).map(depRef => 
          buildTree(depRef, new Set(visited))
        ),
        isCircular: currentNode.isCircular,
      };
    };
    
    return buildTree(fullCellRef);
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencyGraph.clear();
    this.calculationChain = [];
    this.circularReferences.clear();
  }

  /**
   * Get statistics about the dependency graph
   */
  getStatistics(): {
    totalCells: number;
    cellsWithFormulas: number;
    circularReferences: number;
    maxDependencyDepth: number;
    averageDependencies: number;
  } {
    const totalCells = this.dependencyGraph.size;
    const cellsWithFormulas = Array.from(this.dependencyGraph.values())
      .filter(node => node.formula).length;
    const circularReferences = this.circularReferences.size;
    
    let maxDepth = 0;
    let totalDependencies = 0;
    
    for (const node of this.dependencyGraph.values()) {
      totalDependencies += node.dependencies.size;
      
      // Calculate depth for this node
      const depth = this.calculateNodeDepth(node);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return {
      totalCells,
      cellsWithFormulas,
      circularReferences,
      maxDependencyDepth: maxDepth,
      averageDependencies: totalCells > 0 ? totalDependencies / totalCells : 0,
    };
  }

  /**
   * Calculate the dependency depth of a node
   */
  private calculateNodeDepth(node: DependencyNode): number {
    const visited = new Set<string>();
    
    const getDepth = (currentNode: DependencyNode): number => {
      const fullRef = `${currentNode.sheetId}:${currentNode.cellRef}`;
      
      if (visited.has(fullRef)) {
        return 0; // Circular reference
      }
      
      visited.add(fullRef);
      
      let maxDepth = 0;
      for (const depRef of currentNode.dependencies) {
        const depNode = this.dependencyGraph.get(depRef);
        if (depNode) {
          maxDepth = Math.max(maxDepth, getDepth(depNode) + 1);
        }
      }
      
      visited.delete(fullRef);
      return maxDepth;
    };
    
    return getDepth(node);
  }
}

export interface DependencyTree {
  cellRef: string;
  dependencies: DependencyTree[];
  dependents: DependencyTree[];
  isCircular: boolean;
}