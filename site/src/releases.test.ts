import { describe, expect, it } from 'vitest';
import { compareReleases, compareVersions } from './releases';

describe('compareVersions', () => {
  it('compares numerically, not as strings', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('0.1.0', '1.0.0')).toBeLessThan(0);
  });
});

describe('compareReleases', () => {
  const r = (plugin: string, version: string, date?: string) => ({ plugin, version, date });

  it('puts newer dates first and undated last', () => {
    const out = [r('a', '1.0.0'), r('a', '0.1.0', '2026-01-01'), r('a', '1.1.0', '2026-02-01')].sort(compareReleases);
    expect(out.map((x) => x.version)).toEqual(['1.1.0', '0.1.0', '1.0.0']);
  });

  it('on the same day shows higher versions first, across plugins', () => {
    const d = '2026-10-19';
    const out = [
      r('architecture-review', '0.1.0', d),
      r('architecture-review', '1.0.0', d),
      r('sdd-engineering', '1.1.0', d),
      r('research-tools', '1.0.0', d),
    ].sort(compareReleases);
    expect(out.map((x) => `${x.plugin}@${x.version}`)).toEqual([
      'sdd-engineering@1.1.0',
      'architecture-review@1.0.0',
      'research-tools@1.0.0',
      'architecture-review@0.1.0',
    ]);
  });
});
