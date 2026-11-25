/**
 * Architecture Service: Adaptive Image Loader
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-40]
 */

export type NetworkTier = '4g' | '3g' | '2g' | 'slow-2g';

export interface ImageSourceResolution {
  format: 'avif' | 'webp' | 'jpeg';
  src: string;
  srcSet: string;
  quality: number;
}

export class AdaptiveImageLoaderService {
  public selectBestFormat(supportedFormats: string[], networkTier: NetworkTier, saveData: boolean): 'avif' | 'webp' | 'jpeg' {
    if (saveData || networkTier === 'slow-2g') {
      return supportedFormats.includes('avif') ? 'avif' : supportedFormats.includes('webp') ? 'webp' : 'jpeg';
    }
    if (supportedFormats.includes('avif')) return 'avif';
    if (supportedFormats.includes('webp')) return 'webp';
    return 'jpeg';
  }

  public resolveQuality(networkTier: NetworkTier, saveData: boolean): number {
    if (saveData) return 50;
    switch (networkTier) {
      case '4g': return 85;
      case '3g': return 70;
      case '2g': return 55;
      case 'slow-2g': return 40;
      default: return 75;
    }
  }

  public generateResponsiveSources(basePath: string, widths: number[], networkTier: NetworkTier, saveData: boolean, supportedFormats: string[]): ImageSourceResolution {
    const format = this.selectBestFormat(supportedFormats, networkTier, saveData);
    const quality = this.resolveQuality(networkTier, saveData);

    const adjustedWidths = (saveData || networkTier === '2g' || networkTier === 'slow-2g')
      ? widths.filter(w => w <= 640)
      : widths;

    const actualWidths = adjustedWidths.length > 0 ? adjustedWidths : [widths[0]];
    const srcSet = actualWidths
      .map(w => `${basePath}?w=${w}&q=${quality}&fmt=${format} ${w}w`)
      .join(', ');

    return {
      format,
      src: `${basePath}?w=${actualWidths[0]}&q=${quality}&fmt=${format}`,
      srcSet,
      quality
    };
  }
}
