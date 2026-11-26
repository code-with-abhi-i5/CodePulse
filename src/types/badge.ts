export type BadgeTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster';

export interface BadgeTierVisualConfig {
  tier: BadgeTier;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  /** RGB normalized [0..1] base metallic albedo for GLSL shader uniform */
  baseColorRgb: [number, number, number];
  /** RGB normalized [0..1] secondary sheen tint */
  sheenColorRgb: [number, number, number];
  /** Thin-film optical interference intensity (0..1.5) */
  iridescenceIntensity: number;
  /** Diffraction grating line frequency */
  diffractionFrequency: number;
  /** Specular metallic roughness (lower = mirror sheen) */
  metallicRoughness: number;
  /** Particle sparks enabled for Diamond, Master, and Grandmaster tiers */
  enableParticleSparks: boolean;
  sparkCount: number;
}

export interface BadgeShaderUniformConfig {
  uTime: number;
  uTilt: [number, number];
  uBaseColor: [number, number, number];
  uSheenColor: [number, number, number];
  uIridescence: number;
  uDiffractionFreq: number;
  uSparkIntensity: number;
}

export interface HolographicBadgeMetadata {
  id: string;
  title: string;
  subtitle?: string;
  tier: BadgeTier;
  mintedAtIso?: string;
  percentileLabel?: string;
}

export const BADGE_TIER_ORDER: readonly BadgeTier[] = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
] as const;

export const BADGE_TIER_CONFIGS: Record<BadgeTier, BadgeTierVisualConfig> = {
  Bronze: {
    tier: 'Bronze',
    primaryHex: '#CD7F32',
    secondaryHex: '#8C5319',
    accentHex: '#F3B578',
    baseColorRgb: [0.804, 0.498, 0.196],
    sheenColorRgb: [0.953, 0.71, 0.471],
    iridescenceIntensity: 0.35,
    diffractionFrequency: 18.0,
    metallicRoughness: 0.42,
    enableParticleSparks: false,
    sparkCount: 0,
  },
  Silver: {
    tier: 'Silver',
    primaryHex: '#C0C0C0',
    secondaryHex: '#7A828E',
    accentHex: '#F1F5F9',
    baseColorRgb: [0.753, 0.753, 0.753],
    sheenColorRgb: [0.945, 0.961, 0.976],
    iridescenceIntensity: 0.5,
    diffractionFrequency: 24.0,
    metallicRoughness: 0.32,
    enableParticleSparks: false,
    sparkCount: 0,
  },
  Gold: {
    tier: 'Gold',
    primaryHex: '#FFD700',
    secondaryHex: '#B45309',
    accentHex: '#FEF08A',
    baseColorRgb: [1.0, 0.843, 0.0],
    sheenColorRgb: [0.996, 0.941, 0.541],
    iridescenceIntensity: 0.68,
    diffractionFrequency: 30.0,
    metallicRoughness: 0.25,
    enableParticleSparks: false,
    sparkCount: 0,
  },
  Platinum: {
    tier: 'Platinum',
    primaryHex: '#38BDF8',
    secondaryHex: '#0F766E',
    accentHex: '#CCFBF1',
    baseColorRgb: [0.22, 0.741, 0.973],
    sheenColorRgb: [0.8, 0.984, 0.945],
    iridescenceIntensity: 0.85,
    diffractionFrequency: 36.0,
    metallicRoughness: 0.2,
    enableParticleSparks: false,
    sparkCount: 0,
  },
  Diamond: {
    tier: 'Diamond',
    primaryHex: '#818CF8',
    secondaryHex: '#06B6D4',
    accentHex: '#E0E7FF',
    baseColorRgb: [0.506, 0.549, 0.973],
    sheenColorRgb: [0.024, 0.714, 0.831],
    iridescenceIntensity: 1.1,
    diffractionFrequency: 44.0,
    metallicRoughness: 0.14,
    enableParticleSparks: true,
    sparkCount: 14,
  },
  Master: {
    tier: 'Master',
    primaryHex: '#C084FC',
    secondaryHex: '#EC4899',
    accentHex: '#FAE8FF',
    baseColorRgb: [0.753, 0.518, 0.988],
    sheenColorRgb: [0.925, 0.282, 0.6],
    iridescenceIntensity: 1.25,
    diffractionFrequency: 52.0,
    metallicRoughness: 0.11,
    enableParticleSparks: true,
    sparkCount: 22,
  },
  Grandmaster: {
    tier: 'Grandmaster',
    primaryHex: '#F43F5E',
    secondaryHex: '#F59E0B',
    accentHex: '#FFF1F2',
    baseColorRgb: [0.957, 0.247, 0.369],
    sheenColorRgb: [0.961, 0.62, 0.043],
    iridescenceIntensity: 1.45,
    diffractionFrequency: 64.0,
    metallicRoughness: 0.08,
    enableParticleSparks: true,
    sparkCount: 32,
  },
};

export function getBadgeTierConfig(tier: BadgeTier): BadgeTierVisualConfig {
  return BADGE_TIER_CONFIGS[tier] ?? BADGE_TIER_CONFIGS.Bronze;
}

export function buildBadgeShaderUniforms(
  tier: BadgeTier,
  tilt: [number, number] = [0, 0],
  timeSec = 0,
): BadgeShaderUniformConfig {
  const cfg = getBadgeTierConfig(tier);
  return {
    uTime: timeSec,
    uTilt: tilt,
    uBaseColor: cfg.baseColorRgb,
    uSheenColor: cfg.sheenColorRgb,
    uIridescence: cfg.iridescenceIntensity,
    uDiffractionFreq: cfg.diffractionFrequency,
    uSparkIntensity: cfg.enableParticleSparks ? 1.0 : 0.0,
  };
}
