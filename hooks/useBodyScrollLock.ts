/**
 * iOS Safari uyumlu body scroll kilidi (modal/drawer açıkken arka plan kaymasını engeller).
 * Sadece overflow: hidden yeterli olmadığı için position: fixed + top kullanır.
 */
import { useLayoutEffect } from 'react';

export function useBodyScrollLock(isLocked: boolean) {
  useLayoutEffect(() => {
    if (!isLocked) return;

    const scrollY = window.pageYOffset;
    const originalOverflow = window.getComputedStyle(document.body).overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      const savedScrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, parseInt(savedScrollY || '0', 10) * -1);
    };
  }, [isLocked]);
}
