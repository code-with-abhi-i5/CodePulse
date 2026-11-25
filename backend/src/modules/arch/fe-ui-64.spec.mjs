import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SocialShareCardPreviewService } from './fe-ui-64.service.ts';

describe('SocialShareCardPreviewService (FE-UI-64)', () => {
  it('generates SVG social share card with configured user attributes', () => {
    const service = new SocialShareCardPreviewService();
    const svg = service.generateSvgCard({
      title: 'Won Weekly Coding Championship',
      handle: 'dev_alex',
      score: 2450,
      rank: 'Grandmaster',
      theme: 'dark'
    });

    assert.ok(svg.includes('1200'));
    assert.ok(svg.includes('Won Weekly Coding Championship'));
    assert.ok(svg.includes('@dev_alex'));
    assert.ok(svg.includes('2450 (Grandmaster)'));
  });
});
