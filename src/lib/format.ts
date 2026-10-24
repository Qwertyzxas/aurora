const cache = new Map<number, Intl.NumberFormat>();

/** Russian number formatting for animated counters: 16 777 216, 1,4 */
export function formatNumber(value: number, decimals = 0): string {
  let format = cache.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    cache.set(decimals, format);
  }
  return format.format(value);
}

/** "#rrggbb" → [r, g, b] in 0…1 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Invalid color: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
