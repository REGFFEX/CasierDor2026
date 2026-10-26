import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { getNavigationItems } from '../constants';
import { filterNavigationItems } from '../utils/modules';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { useLanguage } from '../utils/languageContext';

const FloatingAccessButton: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  // Initialize position at bottom-right
  useEffect(() => {
    const saved = localStorage.getItem('floatingAccessBtnPos');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setPos(p);
      } catch {
        setPos({ x: window.innerWidth - 80, y: window.innerHeight - 140 });
      }
    } else {
      setPos({ x: window.innerWidth - 80, y: window.innerHeight - 140 });
    }
  }, []);

  // Clamp position within viewport
  const clampPos = useCallback((x: number, y: number) => {
    const btnSize = 56;
    const padding = 8;
    const maxX = window.innerWidth - btnSize - padding;
    const maxY = window.innerHeight - btnSize - padding;
    return {
      x: Math.max(padding, Math.min(x, maxX)),
      y: Math.max(padding, Math.min(y, maxY)),
    };
  }, []);

  // Re-clamp on resize
  useEffect(() => {
    const handleResize = () => setPos(p => clampPos(p.x, p.y));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPos]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (open) return;
    setDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
    setPos(clampPos(dragStart.current.posX + dx, dragStart.current.posY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (!hasMoved.current) {
      setOpen(true);
    }
  };

  // Save position when dragging stops
  useEffect(() => {
    if (!dragging && pos.x !== 0) {
      localStorage.setItem('floatingAccessBtnPos', JSON.stringify(pos));
    }
  }, [dragging, pos]);

  const allItems = filterNavigationItems(getNavigationItems(t), settings.disabledModules)
    .filter(i => i.id !== 'dashboard');

  if (pos.x === 0 && pos.y === 0) return null;

  return (
    <>
      {/* Floating round button */}
      <div
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 9999,
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        className="w-14 h-14 rounded-full bg-[var(--c-brand)] text-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </div>

      {/* Overlay panel — same "Tous les accès" block */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            className="bg-black/20 backdrop-blur-[2px]"
          />
          <div
            style={{
              position: 'fixed',
              left: Math.min(pos.x, window.innerWidth - 280),
              top: Math.max(8, pos.y - 200),
              zIndex: 10000,
            }}
            className="ds-card p-4 w-64 max-w-[80vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-[var(--c-text)] text-sm">Tous les accès</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {allItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                      active
                        ? 'bg-[var(--c-brand)] text-white shadow-md'
                        : 'bg-[var(--c-surface-2)] text-[var(--c-text-2)] hover:bg-[var(--c-brand-xlight)] hover:text-[var(--c-brand)]'
                    }`}
                    title={item.label}
                  >
                    {React.isValidElement(item.icon)
                      ? React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })
                      : item.icon}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingAccessButton;
