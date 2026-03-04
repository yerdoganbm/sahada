/**
 * templates.ts — WhatsApp/Outbox mesaj şablonları
 */

export interface TemplateVars {
  teamName?: string;
  teamId?: string;
  venueName?: string;
  date?: string;
  time?: string;
  endTime?: string;
  memberCount?: number;
  perPersonAmount?: number;
  totalAmount?: number;
  captainIban?: string;
  captainAccountName?: string;
  captainBank?: string;
  captainPhone?: string;
  reservationId?: string;
  memberShort?: string;
  memberName?: string;
  remaining?: number;
  dueAt?: string;
  proofUrl?: string;
  joinLink?: string;
  inviteCode?: string;
  appBase?: string;
}

function fill(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = (vars as Record<string, unknown>)[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

/** Kısa EFT açıklama kodu formatı */
export function eftRef(teamId: string, reservationId: string, userId: string): string {
  const short = userId.slice(-3).toUpperCase();
  return `TEAM-${teamId}-RES-${reservationId}-U${short}`;
}

/** A) Kaptan -> WhatsApp grubuna takıma katıl mesajı */
export function teamInviteMessage(vars: TemplateVars): string {
  const base = vars.appBase ?? 'https://sahada.app';
  const link = vars.joinLink ?? `${base}/join?code=${vars.inviteCode ?? ''}`;
  return fill(
    `⚽ *{teamName}* takımına katıl!

🔗 Katılım linki: {link}
🔑 Davet kodu: {inviteCode}

ℹ️ İlk girişte ad-soyad ve telefon bilgin istenecek.
💰 Maç ödemeleri kaptan üzerinden toplanacak.

Bizi bekliyoruz! 🙌`,
    { ...vars, link } as TemplateVars,
  );
}

/** B) Kaptan -> WhatsApp grubuna maç ödeme mesajı */
export function matchPaymentMessage(vars: TemplateVars): string {
  const ref = vars.teamId && vars.reservationId && vars.memberShort
    ? eftRef(vars.teamId, vars.reservationId, vars.memberShort)
    : 'TEAM-...-RES-...-U...';

  const lines: string[] = [
    `⚽ *MAÇ ÖDEMESİ*`,
    ``,
    `📍 ${vars.venueName ?? '—'}`,
    `📅 ${vars.date ?? '—'} · ${vars.time ?? '—'}`,
    `👥 ${vars.memberCount ?? '—'} kişi · Kişi başı: *${vars.perPersonAmount ?? '?'}₺*`,
    ``,
    `💳 *EFT ile ödeme:*`,
    `IBAN: ${vars.captainIban ?? 'TR—'}`,
    `Hesap: ${vars.captainAccountName ?? '—'}${vars.captainBank ? ` (${vars.captainBank})` : ''}`,
    `Açıklama: TEAM-${vars.teamId}-RES-${vars.reservationId}-U[AD_KISALTMA]`,
  ];

  if (vars.captainPhone) {
    lines.push(``, `💵 *Nakit* ödeme için: ${vars.captainPhone}`);
  }

  if (vars.dueAt) {
    lines.push(``, `⏰ Son ödeme: ${vars.dueAt}`);
  }

  return lines.join('\n');
}

/** C) Kaptan -> Üyeye ödeme talebi (outbox bireysel) */
export function paymentRequestToMember(vars: TemplateVars): string {
  const ref = vars.teamId && vars.reservationId && vars.memberShort
    ? eftRef(vars.teamId, vars.reservationId, vars.memberShort)
    : '';

  return fill(
    `Merhaba {memberName}! ⚽
Maç: {venueName} · {date} {time}
Ödenecek: {perPersonAmount}₺

EFT: {captainIban}
Hesap: {captainAccountName}
Açıklama: ${ref || '{eftRef}'}

${vars.captainPhone ? 'Nakit: {captainPhone}' : ''}
Son ödeme: {dueAt}`,
    vars,
  );
}

/** D) Kaptan -> Hatırlatma (outbox reminder) */
export function paymentReminder(vars: TemplateVars): string {
  return fill(
    `⚠️ Hatırlatma: {date} {time} maçı için ödemen eksik.
Kalan: {remaining}₺ · Son saat: {dueAt}

EFT açıklaması: TEAM-{teamId}-RES-{reservationId}-U...`,
    vars,
  );
}

/** E) Üye -> Kaptana "ödemeyi yaptım" */
export function memberPaidMessage(vars: TemplateVars): string {
  const ref = vars.teamId && vars.reservationId && vars.memberShort
    ? eftRef(vars.teamId, vars.reservationId, vars.memberShort)
    : '';
  return `Merhaba kaptan! EFT'yi gönderdim. 🙏\nAçıklama: ${ref}\nTutar: ${vars.perPersonAmount ?? '?'}₺\n${vars.proofUrl ? `Dekont: ${vars.proofUrl}` : ''}`;
}

/** F) Üye -> Kaptana "gelemeyeceğim" */
export function memberCantComeMessage(vars: TemplateVars): string {
  return fill(
    `Merhaba kaptan, {date} {time} maçına gelemeyeceğim. İyi maçlar! ⚽`,
    vars,
  );
}

/** G) Kaptan -> Teşekkür (opsiyonel) */
export function thankYouMessage(vars: TemplateVars): string {
  return fill(
    `✅ Ödeme alındı, teşekkürler {memberName}! Maç: {venueName} {date} {time}`,
    vars,
  );
}

/** H) Kaptan -> Sahaya ödeme hatırlatması */
export function venuePaymentReminder(vars: TemplateVars): string {
  return fill(
    `🏟️ Sahaya ödeme bekleniyor: {totalAmount}₺\nIBAN: {captainIban}\nMaç: {date} {time}`,
    vars,
  );
}
