import { useState, useEffect, RefObject } from 'react';

interface SwipeProps {
  element: RefObject<HTMLElement>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipe = ({
  element,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeProps) => {
  const [touchStart, setTouchStart] = useState<{x: number; y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number; y: number} | null>(null);

  // Reset touch position
  const resetTouchPosition = () => {
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    const target = element.current;
    if (!target) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

      if (isHorizontalSwipe) {
        // Horizontal swipe
        if (distanceX > threshold && onSwipeLeft) {
          onSwipeLeft();
        } else if (distanceX < -threshold && onSwipeRight) {
          onSwipeRight();
        }
      } else {
        // Vertical swipe
        if (distanceY > threshold && onSwipeUp) {
          onSwipeUp();
        } else if (distanceY < -threshold && onSwipeDown) {
          onSwipeDown();
        }
      }

      resetTouchPosition();
    };

    // Add event listeners
    target.addEventListener('touchstart', handleTouchStart);
    target.addEventListener('touchmove', handleTouchMove);
    target.addEventListener('touchend', handleTouchEnd);

    // Clean up
    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, threshold, touchStart, touchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    isSwiping: touchStart !== null && touchEnd !== null,
    touchStart,
    touchEnd,
  };
};

export default useSwipe; 