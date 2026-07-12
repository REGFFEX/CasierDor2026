import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollablePanelProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  maxHeight?: string;
  scrollStep?: number;
}

/** Zone scrollable avec boutons montée/descente (visibles au toucher, puis fondu) */
const ScrollablePanel: React.FC<ScrollablePanelProps> = ({
  children,
  className = '',
  innerClassName = '',
  maxHeight = '78vh',
  scrollStep = 240,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showButtonsBriefly = useCallback(() => {
    setButtonsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setButtonsVisible(false), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ top: delta, behavior: 'smooth' });
    showButtonsBriefly();
  };

  return (
    <div
      className={`relative scroll-container flex-1 min-h-0 ${className}`}
      onMouseEnter={showButtonsBriefly}
      onFocusCapture={showButtonsBriefly}
    >
      <button
        type="button"
        onClick={() => scrollBy(-scrollStep)}
        className={`scroll-button scroll-button-top ${buttonsVisible ? 'scroll-button-visible' : ''}`}
        aria-label="Scroll up"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(scrollStep)}
        className={`scroll-button scroll-button-bottom ${buttonsVisible ? 'scroll-button-visible' : ''}`}
        aria-label="Scroll down"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      <div
        ref={scrollRef}
        className={`overflow-y-auto custom-scrollbar overscroll-contain ${innerClassName}`}
        style={{ maxHeight }}
        onScroll={showButtonsBriefly}
        onTouchStart={showButtonsBriefly}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollablePanel;
