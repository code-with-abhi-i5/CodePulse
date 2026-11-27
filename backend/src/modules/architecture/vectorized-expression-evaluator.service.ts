export type VectorOperator = 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'BETWEEN';

export interface VectorFilter {
  column: string;
  operator: VectorOperator;
  value: any;
  value2?: any;
}

export class VectorizedExpressionEvaluatorService {
  public evaluateNumericFilter(
    columnValues: Int32Array | Float64Array,
    operator: VectorOperator,
    val: number,
    val2?: number
  ): Uint8Array {
    const len = columnValues.length;
    const selection = new Uint8Array(len);

    switch (operator) {
      case 'EQ':
        for (let i = 0; i < len; i++) if (columnValues[i] === val) selection[i] = 1;
        break;
      case 'NEQ':
        for (let i = 0; i < len; i++) if (columnValues[i] !== val) selection[i] = 1;
        break;
      case 'GT':
        for (let i = 0; i < len; i++) if (columnValues[i] > val) selection[i] = 1;
        break;
      case 'GTE':
        for (let i = 0; i < len; i++) if (columnValues[i] >= val) selection[i] = 1;
        break;
      case 'LT':
        for (let i = 0; i < len; i++) if (columnValues[i] < val) selection[i] = 1;
        break;
      case 'LTE':
        for (let i = 0; i < len; i++) if (columnValues[i] <= val) selection[i] = 1;
        break;
      case 'BETWEEN':
        const lower = val;
        const upper = val2 ?? val;
        for (let i = 0; i < len; i++) {
          const v = columnValues[i];
          if (v >= lower && v <= upper) selection[i] = 1;
        }
        break;
    }

    return selection;
  }

  public evaluateStringFilter(
    columnValues: string[],
    operator: 'EQ' | 'NEQ' | 'IN',
    val: string | string[]
  ): Uint8Array {
    const len = columnValues.length;
    const selection = new Uint8Array(len);

    if (operator === 'EQ') {
      const target = String(val);
      for (let i = 0; i < len; i++) if (columnValues[i] === target) selection[i] = 1;
    } else if (operator === 'NEQ') {
      const target = String(val);
      for (let i = 0; i < len; i++) if (columnValues[i] !== target) selection[i] = 1;
    } else if (operator === 'IN') {
      const set = new Set(Array.isArray(val) ? val : [val]);
      for (let i = 0; i < len; i++) if (set.has(columnValues[i])) selection[i] = 1;
    }

    return selection;
  }

  public bitwiseAnd(maskA: Uint8Array, maskB: Uint8Array): Uint8Array {
    const len = maskA.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = maskA[i] & maskB[i];
    }
    return out;
  }

  public bitwiseOr(maskA: Uint8Array, maskB: Uint8Array): Uint8Array {
    const len = maskA.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = maskA[i] | maskB[i];
    }
    return out;
  }

  public toIndexList(mask: Uint8Array): number[] {
    const indices: number[] = [];
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 1) indices.push(i);
    }
    return indices;
  }
}
