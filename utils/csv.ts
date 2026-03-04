/**
 * csv.ts — CSV üretim ve indirme yardımcıları
 */

/** Bir hücreyi RFC-4180 uyumlu şekilde escape et */
function escapeCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Satırlar dizisini CSV string'ine çevir */
export function generateCSV(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ];
  return lines.join('\n');
}

/** Tarayıcıda CSV dosyası indir */
export function downloadCSV(filename: string, csv: string): void {
  const BOM = '\uFEFF'; // Excel Türkçe karakter uyumluluğu için UTF-8 BOM
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Contributions + ledger için kaptan raporu */
export interface ContributionRow {
  memberName: string;
  expectedAmount: number;
  paidAmount: number;
  remaining: number;
  status: string;
  lastUpdatedAt: string;
}

export interface LedgerRow {
  at: string;
  direction: string;
  method: string;
  amount: number;
  note?: string;
}

export function buildContributionsCSV(rows: ContributionRow[]): string {
  return generateCSV(
    ['Üye', 'Beklenen (₺)', 'Ödenen (₺)', 'Kalan (₺)', 'Durum', 'Son Güncelleme'],
    rows.map(r => [r.memberName, r.expectedAmount, r.paidAmount, r.remaining, r.status, r.lastUpdatedAt]),
  );
}

export function buildLedgerCSV(rows: LedgerRow[]): string {
  return generateCSV(
    ['Tarih', 'Yön', 'Yöntem', 'Tutar (₺)', 'Not'],
    rows.map(r => [r.at, r.direction, r.method, r.amount, r.note ?? '']),
  );
}

export function buildReservationsCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  return generateCSV(headers, rows.map(r => headers.map(h => r[h])));
}
