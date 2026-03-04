import React, { useState } from 'react';
import { Icon } from './Icon';

interface Props {
  title: string;
  subtitle?: string;
  body: string;
  whatsappHref?: string; // opsiyonel wa.me link
  className?: string;
}

/**
 * WhatsAppCopyCard — kopyalanabilir WhatsApp mesajı önizleme kartı
 */
export const WhatsAppCopyCard: React.FC<Props> = ({
  title, subtitle, body, whatsappHref, className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(body).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`rounded-2xl border border-green-500/20 bg-green-500/5 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2 border-b border-green-500/15">
        <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <Icon name="whatsapp" size={18} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{title}</p>
          {subtitle && <p className="text-slate-500 text-[10px]">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-all"
            >
              <Icon name="open_in_new" size={12} />
              Aç
            </a>
          )}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              copied
                ? 'bg-green-500/25 border-green-500/30 text-green-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
            }`}
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={12} />
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
        </div>
      </div>

      {/* Message preview */}
      <div className="px-4 py-3">
        <pre className="text-slate-300 text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
          {body}
        </pre>
      </div>
    </div>
  );
};
