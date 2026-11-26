export interface OklchColor { l: number; c: number; h: number; }
export class CssOklchGamutConverterService_3776 {
  public formatCss(color: OklchColor): string {
    return `oklch(${(color.l * 100).toFixed(1)}% ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
  }
  public interpolate(c1: OklchColor, c2: OklchColor, factor: number): OklchColor {
    return {
      l: c1.l + (c2.l - c1.l) * factor,
      c: c1.c + (c2.c - c1.c) * factor,
      h: c1.h + (c2.h - c1.h) * factor
    };
  }
}