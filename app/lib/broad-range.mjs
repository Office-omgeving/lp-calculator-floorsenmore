// Ruime prijsvork die bezoekers zien vóór ze hun gegevens invullen.
// De echte vork wordt aan beide kanten BROAD_MARGIN breder gemaakt en afgerond op ROUND_TO,
// zodat de ruime vork de gedetailleerde richtprijs altijd omvat.
export const BROAD_MARGIN = 0.2;
export const ROUND_TO = 500;

/**
 * @param {number} low
 * @param {number} high
 * @returns {{ low: number, high: number }}
 */
export function broadRange(low, high) {
  const lo = Math.max(ROUND_TO, Math.floor((low * (1 - BROAD_MARGIN)) / ROUND_TO) * ROUND_TO);
  const hi = Math.ceil((high * (1 + BROAD_MARGIN)) / ROUND_TO) * ROUND_TO;
  return { low: Math.min(lo, low), high: Math.max(hi, high) };
}
