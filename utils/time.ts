/**
 * time.ts — Tarih/saat yardımcıları
 */

/** "2024-05-18" formatında ISO tarih */
export function toISODate(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

/** "20:00" gibi HH:MM string -> toplam dakika */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Dakika -> "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Bir slotun bitiş saatini hesapla */
export function addMinutes(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

/** İki ISO tarih+saat arasındaki dakika farkı */
export function diffMinutes(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

/** Türkçe kısa tarih: "18 Mayıs Cmt" */
export function shortDateTR(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'short',
  });
}

/** Türkçe kısa datetime: "18 May 20:00" */
export function shortDateTimeTR(isoDate: string, time: string): string {
  const d = new Date(isoDate + 'T12:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short',
  });
  return `${d} ${time}`;
}

/** ISO string'in önümüzdeki N gün içinde olup olmadığı */
export function isWithinDays(iso: string, days: number): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff >= 0 && diff <= days * 86_400_000;
}

/** Şu an itibariyle geçmiş mi? */
export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Saat farkı (saat cinsinden, float) */
export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}
