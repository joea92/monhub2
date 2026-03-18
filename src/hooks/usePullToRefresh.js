import { useEffect, useRef, useState } from 'react';

const REFRESH_THRESHOLD = 80;

export function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulledDistance = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      const scrollTop = element.scrollTop;
      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      const scrollTop = element.scrollTop;
      if (scrollTop === 0 && startY.current > 0) {
        currentY.current = e.touches[0].clientY;
        pulledDistance.current = currentY.current - startY.current;
        if (pulledDistance.current > 0) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pulledDistance.current >= REFRESH_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      startY.current = 0;
      currentY.current = 0;
      pulledDistance.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);

  return { scrollRef, isRefreshing, pulledDistance: pulledDistance.current };
}