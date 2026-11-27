export interface FieldLWW<T = any> {
  value: T;
  timestamp: number;
}

export class CrdtJsonDocumentMerger {
  public mergeDocuments(
    docA: Record<string, FieldLWW>,
    docB: Record<string, FieldLWW>
  ): Record<string, FieldLWW> {
    const merged: Record<string, FieldLWW> = {};
    const allKeys = new Set([...Object.keys(docA), ...Object.keys(docB)]);

    for (const key of allKeys) {
      const fieldA = docA[key];
      const fieldB = docB[key];

      if (!fieldA) {
        merged[key] = { ...fieldB };
      } else if (!fieldB) {
        merged[key] = { ...fieldA };
      } else {
        // Last-Write-Wins based on timestamp
        merged[key] = fieldA.timestamp >= fieldB.timestamp ? { ...fieldA } : { ...fieldB };
      }
    }

    return merged;
  }
}
