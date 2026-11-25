/**
 * Architecture Service: GraphQL BigDecimal Custom Scalar
 * Subsystem: Financial Precision & Token Economics
 */

export class GraphqlBigDecimalScalarService {
  public serialize(value: unknown): string {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
    throw new Error('Invalid BigDecimal value');
  }

  public parseValue(value: unknown): string {
    return this.serialize(value);
  }

  public add(a: string, b: string): string {
    // Integer addition in basis points (scale 8)
    const scale = 8;
    const factor = BigInt(10 ** scale);
    const parseToBasis = (s: string) => {
      const parts = s.split('.');
      const whole = BigInt(parts[0] || '0') * factor;
      const frac = BigInt((parts[1] || '').padEnd(scale, '0').slice(0, scale));
      return whole + frac;
    };

    const sum = parseToBasis(a) + parseToBasis(b);
    const whole = sum / factor;
    const frac = (sum % factor).toString().padStart(scale, '0').replace(/0+$/, '');
    return frac.length > 0 ? `${whole}.${frac}` : whole.toString();
  }
}
