import { HallucinationVerification } from '../../types/ai';

export class HallucinationFilter {
  verifyExports(generatedCode: string, knownModuleExports: string[]): HallucinationVerification {
    const importRegex = /import\s*\{([^}]+)\}\s*from/g;
    const claimedExports: string[] = [];

    let match;
    while ((match = importRegex.exec(generatedCode)) !== null) {
      const items = match[1].split(',').map(s => s.trim()).filter(Boolean);
      claimedExports.push(...items);
    }

    const hallucinatedExports = claimedExports.filter(e => !knownModuleExports.includes(e));
    const validExports = claimedExports.filter(e => !hallucinatedExports.includes(e));
    const isHallucinated = hallucinatedExports.length > 0;

    const confidenceScore = claimedExports.length > 0
      ? Math.round((validExports.length / claimedExports.length) * 100) / 100
      : 1.0;

    return {
      isHallucinated,
      hallucinatedExports,
      validExports,
      confidenceScore
    };
  }
}
