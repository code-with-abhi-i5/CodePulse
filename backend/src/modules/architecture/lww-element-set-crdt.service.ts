export interface LWWElement<T> {
  element: T;
  timestamp: number;
}

export class LWWElementSetCRDT<T = string> {
  private addSet = new Map<string, LWWElement<T>>();
  private removeSet = new Map<string, LWWElement<T>>();
  private readonly addBias: boolean;

  constructor(addBias = true) {
    this.addBias = addBias;
  }

  private getKey(element: T): string {
    return typeof element === 'object' ? JSON.stringify(element) : String(element);
  }

  public add(element: T, timestamp: number = Date.now()): void {
    const key = this.getKey(element);
    const existing = this.addSet.get(key);
    if (!existing || timestamp > existing.timestamp) {
      this.addSet.set(key, { element, timestamp });
    }
  }

  public remove(element: T, timestamp: number = Date.now()): void {
    const key = this.getKey(element);
    const existing = this.removeSet.get(key);
    if (!existing || timestamp > existing.timestamp) {
      this.removeSet.set(key, { element, timestamp });
    }
  }

  public lookup(element: T): boolean {
    const key = this.getKey(element);
    const addEntry = this.addSet.get(key);
    if (!addEntry) return false;

    const removeEntry = this.removeSet.get(key);
    if (!removeEntry) return true;

    if (addEntry.timestamp > removeEntry.timestamp) {
      return true;
    }
    if (removeEntry.timestamp > addEntry.timestamp) {
      return false;
    }
    // Equal timestamps: fallback to bias
    return this.addBias;
  }

  public elements(): T[] {
    const result: T[] = [];
    for (const [key, addEntry] of this.addSet.entries()) {
      const removeEntry = this.removeSet.get(key);
      let isPresent = true;
      if (removeEntry) {
        if (removeEntry.timestamp > addEntry.timestamp) {
          isPresent = false;
        } else if (removeEntry.timestamp === addEntry.timestamp) {
          isPresent = this.addBias;
        }
      }
      if (isPresent) {
        result.push(addEntry.element);
      }
    }
    return result;
  }

  public merge(other: LWWElementSetCRDT<T>): void {
    for (const [key, entry] of other.addSet.entries()) {
      const existing = this.addSet.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        this.addSet.set(key, { element: entry.element, timestamp: entry.timestamp });
      }
    }
    for (const [key, entry] of other.removeSet.entries()) {
      const existing = this.removeSet.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        this.removeSet.set(key, { element: entry.element, timestamp: entry.timestamp });
      }
    }
  }

  public toJSON(): { addSet: [string, LWWElement<T>][]; removeSet: [string, LWWElement<T>][] } {
    return {
      addSet: Array.from(this.addSet.entries()),
      removeSet: Array.from(this.removeSet.entries())
    };
  }

  public fromJSON(state: { addSet: [string, LWWElement<T>][]; removeSet: [string, LWWElement<T>][] }): void {
    this.addSet = new Map(state.addSet);
    this.removeSet = new Map(state.removeSet);
  }
}
