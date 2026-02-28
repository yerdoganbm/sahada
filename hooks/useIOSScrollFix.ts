import React, { useEffect } from 'react';

/**
 * iOS Safari Modal Scroll Lock Hook
 *
 * Modal/drawer açıldığında body scroll'u kilitler,
 * kapandığında eski scroll pozisyonuna geri döner.
 */
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.setProperty('--scroll-position', `-${scrollY}px`);
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('modal-open');

      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.removeProperty('--scroll-position');
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};

/**
 * iOS Safari Scroll Position Save Hook
 */
export const useSaveScrollPosition = () => {
  const scrollPositions = new Map<string, number>();

  const savePosition = (key: string) => {
    scrollPositions.set(key, window.scrollY);
  };

  const restorePosition = (key: string) => {
    const position = scrollPositions.get(key);
    if (position !== undefined) {
      setTimeout(() => window.scrollTo(0, position), 0);
    }
  };

  return { savePosition, restorePosition };
};

/**
 * iOS Safari Viewport Height Fix Hook
 */
export const useViewportHeightFix = () => {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    window.visualViewport?.addEventListener('resize', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      window.visualViewport?.removeEventListener('resize', setVh);
    };
  }, []);
};

/**
 * iOS Safari Scroll Momentum Hook
 */
export const useScrollMomentum = <T extends HTMLElement>() => {
  const ref = React.useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.webkitOverflowScrolling = 'touch';
    element.style.overscrollBehavior = 'contain';

    return () => {
      element.style.webkitOverflowScrolling = '';
      element.style.overscrollBehavior = '';
    };
  }, []);

  return ref;
};

/**
 * iOS Safari Touch Scroll Detection Hook
 */
interface TouchScrollOptions {
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  onPullDown?: (distance: number) => void;
  pullThreshold?: number;
}

export const useTouchScroll = (options: TouchScrollOptions = {}) => {
  const {
    onScrollStart,
    onScrollEnd,
    onPullDown,
    pullThreshold = 80
  } = options;

  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentY = startY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (!isScrolling && Math.abs(deltaY) > 5) {
        isScrolling = true;
        onScrollStart?.();
      }

      if (window.scrollY === 0 && deltaY > pullThreshold) {
        onPullDown?.(deltaY);
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        onScrollEnd?.();
      }, 150);
    };

    const handleTouchEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        onScrollEnd?.();
      }, 150);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onScrollStart, onScrollEnd, onPullDown, pullThreshold]);
};
