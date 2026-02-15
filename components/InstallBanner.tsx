/**
 * Install PWA Banner Component
 */

import React from 'react';
import { useInstallPWA } from '../hooks/useMobileFeatures';
import { Icon } from './Icon';

export function InstallBanner() {
  const { isInstallable, promptInstall } = useInstallPWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '16px',
        right: '16px',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}
      >
        ⚽
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
          Ana Ekrana Ekle
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          Uygulamayı yükle, hızlı erişim
        </div>
      </div>

      <button
        onClick={handleInstall}
        style={{
          background: '#fff',
          color: '#10B981',
          border: 'none',
          borderRadius: '12px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
        }}
      >
        Yükle
      </button>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '8px',
        }}
        aria-label="Kapat"
      >
        <Icon name="close" style={{ fontSize: '20px' }} />
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
