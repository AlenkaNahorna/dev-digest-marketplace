/** Compare two X.Y.Z versions numerically; positive when a is newer than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

interface Sortable {
  date?: string | null;
  version: string;
  plugin: string;
}

/**
 * Newest first: by date (undated last), then by version (higher first) so that releases made
 * on the same day show the latest version on top, then by plugin name for a stable order.
 */
export function compareReleases(a: Sortable, b: Sortable): number {
  return (
    (b.date ?? '').localeCompare(a.date ?? '') ||
    compareVersions(b.version, a.version) ||
    a.plugin.localeCompare(b.plugin)
  );
}
