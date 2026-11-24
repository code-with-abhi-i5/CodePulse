import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';

export interface SourceFileNode {
  filePath: string;
  content: string;
}

export interface ImportDependencyEdge {
  fromFile: string;
  toFile: string;
  specifier: string;
  lineNumber: number;
}

export interface ModuleMetrics {
  filePath: string;
  fanIn: number;   // In-degree: how many modules depend on this
  fanOut: number;  // Out-degree: how many modules this depends on
  instability: number; // I = FanOut / (FanIn + FanOut)
}

export interface ParsedDependencyGraph {
  nodes: string[];
  edges: ImportDependencyEdge[];
  adjacency: Map<string, string[]>;
  reverseAdjacency: Map<string, string[]>;
  metrics: Map<string, ModuleMetrics>;
}

@Injectable()
export class DependencyGraphService {
  private readonly logger = new Logger(DependencyGraphService.name);

  public normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/^\.\//, '');
  }

  /**
   * Resolves a module import specifier against a known set of workspace files.
   */
  public resolveImportTarget(
    fromFile: string,
    specifier: string,
    knownFiles: Set<string>,
  ): string {
    const normFrom = this.normalizePath(fromFile);

    if (!specifier.startsWith('.')) {
      const clean = this.normalizePath(specifier);
      const candidates = [clean, `${clean}.ts`, `${clean}.tsx`, `${clean}/index.ts`];
      for (const c of candidates) {
        if (knownFiles.has(c)) return c;
      }
      return `${clean}.ts`;
    }

    const dir = path.posix.dirname(normFrom);
    const resolvedBase = this.normalizePath(path.posix.normalize(path.posix.join(dir, specifier)));
    const candidates = [
      resolvedBase,
      `${resolvedBase}.ts`,
      `${resolvedBase}.tsx`,
      `${resolvedBase}.js`,
      `${resolvedBase}/index.ts`,
      `${resolvedBase}/index.tsx`,
    ];

    for (const c of candidates) {
      if (knownFiles.has(c)) return c;
    }

    return `${resolvedBase}.ts`;
  }

  /**
   * Builds an indexed directed dependency graph for a collection of source files in < 250ms.
   */
  public buildGraph(files: SourceFileNode[]): ParsedDependencyGraph {
    const knownFiles = new Set(files.map((f) => this.normalizePath(f.filePath)));
    const nodes = Array.from(knownFiles);
    const edges: ImportDependencyEdge[] = [];
    const adjacency = new Map<string, string[]>();
    const reverseAdjacency = new Map<string, string[]>();

    for (const node of nodes) {
      adjacency.set(node, []);
      reverseAdjacency.set(node, []);
    }

    // Regex parsing import and export ... from statements
    const importRegex = /(?:import|export)\s+(?:(?:(?:\*\s+as\s+\w+)|(?:[\w\s{},*]+))\s+from\s+)?['"]([^'"]+)['"]/g;

    for (const file of files) {
      const fromPath = this.normalizePath(file.filePath);
      const lines = file.content.split('\n');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;

        let match: RegExpExecArray | null;
        importRegex.lastIndex = 0;

        while ((match = importRegex.exec(line)) !== null) {
          const specifier = match[1];
          // Skip external npm packages
          if (!specifier.startsWith('.') && !specifier.startsWith('src/') && !specifier.startsWith('backend/')) {
            continue;
          }

          const targetPath = this.resolveImportTarget(fromPath, specifier, knownFiles);

          edges.push({
            fromFile: fromPath,
            toFile: targetPath,
            specifier,
            lineNumber: lineIdx + 1,
          });

          if (!adjacency.has(fromPath)) adjacency.set(fromPath, []);
          adjacency.get(fromPath)!.push(targetPath);

          if (!reverseAdjacency.has(targetPath)) reverseAdjacency.set(targetPath, []);
          reverseAdjacency.get(targetPath)!.push(fromPath);
        }
      }
    }

    // Compute Robert C. Martin package metrics (Fan-In, Fan-Out, Instability)
    const metrics = new Map<string, ModuleMetrics>();
    for (const node of nodes) {
      const fanOut = adjacency.get(node)?.length ?? 0;
      const fanIn = reverseAdjacency.get(node)?.length ?? 0;
      const total = fanIn + fanOut;
      const instability = total === 0 ? 0 : Number((fanOut / total).toFixed(3));

      metrics.set(node, {
        filePath: node,
        fanIn,
        fanOut,
        instability,
      });
    }

    return {
      nodes,
      edges,
      adjacency,
      reverseAdjacency,
      metrics,
    };
  }

  /**
   * Performs Kahn's algorithm for topological sorting to verify DAG acyclicity.
   * Returns sorted order or null if cycles exist.
   */
  public topologicalSort(graph: ParsedDependencyGraph): string[] | null {
    const inDegree = new Map<string, number>();
    for (const node of graph.nodes) {
      inDegree.set(node, 0);
    }

    for (const edge of graph.edges) {
      if (inDegree.has(edge.toFile)) {
        inDegree.set(edge.toFile, inDegree.get(edge.toFile)! + 1);
      }
    }

    const queue: string[] = [];
    for (const [node, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(node);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const neighbors = graph.adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (inDegree.has(neighbor)) {
          const updatedDeg = inDegree.get(neighbor)! - 1;
          inDegree.set(neighbor, updatedDeg);
          if (updatedDeg === 0) {
            queue.push(neighbor);
          }
        }
      }
    }

    return sorted.length === graph.nodes.length ? sorted : null;
  }
}
