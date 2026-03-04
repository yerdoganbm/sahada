/**
 * money.ts — Para formatı ve hesap yardımcıları
 */

/** Kuruşsuz Türk Lirası formatı: 1500 -> "1.500₺" */
export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Yüzdelik gösterim: 0.75 -> "75%" */
export function formatPercent(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Eşit bölüştürme (kalan kuruş ilk kişiye) */
export function splitEqual(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i === 0 ? remainder : 0));
}

/** İki kuruş değerini ondalık hatalardan koruyarak topla */
export function addMoney(...amounts: number[]): number {
  return Math.round(amounts.reduce((s, a) => s + a, 0));
}

/** Güvenli yuvarlama */
export function round(n: number, decimals = 2): number {
  return parseFloat(n.toFixed(decimals));
}

/** min-max aralığına çek */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
