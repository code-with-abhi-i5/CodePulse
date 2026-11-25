/**
 * Architecture Service: AST Node Object Pool Allocator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-12]
 */

export interface AstNode {
  id: number;
  type: string;
  name: string;
  value: any;
  children: AstNode[];
}

export class AstNodeObjectPoolService {
  private pool: AstNode[];
  private maxPoolSize: number;
  private totalAllocated: number;
  private totalReused: number;
  private nextId: number;

  constructor(maxPoolSize: number = 500) {
    this.pool = [];
    this.maxPoolSize = maxPoolSize;
    this.totalAllocated = 0;
    this.totalReused = 0;
    this.nextId = 1;
  }

  public acquire(type: string, name: string = '', value: any = null): AstNode {
    if (this.pool.length > 0) {
      const node = this.pool.pop()!;
      node.type = type;
      node.name = name;
      node.value = value;
      node.children = [];
      this.totalReused++;
      return node;
    }

    this.totalAllocated++;
    return {
      id: this.nextId++,
      type,
      name,
      value,
      children: []
    };
  }

  public release(node: AstNode): void {
    if (this.pool.length < this.maxPoolSize) {
      node.type = '';
      node.name = '';
      node.value = null;
      node.children = [];
      this.pool.push(node);
    }
  }

  public getStats(): { poolSize: number; totalAllocated: number; totalReused: number } {
    return {
      poolSize: this.pool.length,
      totalAllocated: this.totalAllocated,
      totalReused: this.totalReused
    };
  }
}
