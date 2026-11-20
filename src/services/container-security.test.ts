import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Container Image Security Scanning Configuration & Policy', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/container-image-audit.yml');
  const trivyConfigPath = path.resolve(process.cwd(), 'deploy/security/trivy.yaml');
  const dockerfilePath = path.resolve(process.cwd(), 'backend/Dockerfile');

  it('verifies .github/workflows/container-image-audit.yml exists and uses correct Trivy and Grype actions', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf8');

    expect(content).toContain('aquasecurity/trivy-action@v0.36.0');
    expect(content).toContain('anchore/scan-action');
    expect(content).toContain('upload-sarif');
    expect(content).toContain('deploy/security/trivy.yaml');
  });

  it('validates deploy/security/trivy.yaml syntax and policy thresholds', () => {
    expect(fs.existsSync(trivyConfigPath)).toBe(true);
    const content = fs.readFileSync(trivyConfigPath, 'utf8');

    expect(content).toContain('CRITICAL');
    expect(content).toContain('HIGH');
    expect(content).toContain('os');
    expect(content).toContain('library');
    expect(content).toContain('ignore-unfixed: true');
    expect(content).toContain('exit-code: 1');
  });

  it('validates backend/Dockerfile security hardening (non-root USER, minimal slim base)', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    const content = fs.readFileSync(dockerfilePath, 'utf8');

    expect(content).toContain('FROM node:20-slim');
    expect(content).toContain('USER node');
    expect(content).toContain('rm -rf /var/lib/apt/lists/*');
  });
});
