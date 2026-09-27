/**
 * Context Menu Component
 * 
 * Menu contextuel "⋯" intelligent avec repositionnement automatique
 * Mobile-first avec bottom-sheet sur mobile
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom/client';
import { MoreVertical, X } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger?: 'click' | 'hover';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'auto';
  children: React.ReactNode;
  className?: string;
}

export function ContextMenu({
  items,
  trigger = 'click',
  position = 'auto',
  children,
  className = '',
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + 4;
    let left = triggerRect.right;

    // Auto positioning based on available space
    if (position === 'auto') {
      // Check if menu would go off right edge
      if (left + menuRect.width > viewportWidth) {
        left = triggerRect.left - menuRect.width;
      }

      // Check if menu would go off bottom edge
      if (top + menuRect.height > viewportHeight) {
        top = triggerRect.top - menuRect.height - 4;
      }
    } else {
      switch (position) {
        case 'bottom-left':
          left = triggerRect.left;
          break;
        case 'top-right':
          top = triggerRect.top - menuRect.height - 4;
          break;
        case 'top-left':
          top = triggerRect.top - menuRect.height - 4;
          left = triggerRect.left;
          break;
        case 'bottom-right':
        default:
          // Default positioning
          break;
      }
    }

    // Ensure menu stays within viewport
    left = Math.max(8, Math.min(left, viewportWidth - menuRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - menuRect.height - 8));

    setMenuPosition({ top, left });
  }, [position]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      // Calculate position after render
      setTimeout(calculatePosition, 0);
    } else {
      setIsOpen(false);
    }
  }, [isOpen, calculatePosition]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node) &&
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleClickOutside, handleEscape]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [isOpen, calculatePosition]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`context-menu-trigger ${className}`}
        onClick={trigger === 'click' ? handleToggle : undefined}
        onMouseEnter={trigger === 'hover' ? () => setIsOpen(true) : undefined}
        onMouseLeave={trigger === 'hover' ? () => setIsOpen(false) : undefined}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          isMobile ? (
            <MobileBottomSheet
              items={items}
              onItemClick={handleItemClick}
              onClose={() => setIsOpen(false)}
            />
          ) : (
            <DesktopMenu
              items={items}
              position={menuPosition}
              onItemClick={handleItemClick}
              onClose={() => setIsOpen(false)}
            />
          ),
          document.body
        )}
    </>
  );
}

function DesktopMenu({
  items,
  position,
  onItemClick,
  onClose,
}: {
  items: ContextMenuItem[];
  position: { top: number; left: number };
  onItemClick: (item: ContextMenuItem) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="context-menu-desktop fixed bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 min-w-[200px] max-w-xs"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-1">
        {items.map((item, index) => {
          if (item.divider) {
            return <div key={`divider-${index}`} className="my-1 border-t border-gray-200 dark:border-slate-700" />;
          }

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              disabled={item.disabled}
              className={`context-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                item.disabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileBottomSheet({
  items,
  onItemClick,
  onClose,
}: {
  items: ContextMenuItem[];
  onItemClick: (item: ContextMenuItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="context-menu-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="context-menu-bottom-sheet bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Actions</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 max-h-[70vh] overflow-y-auto">
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-2 border-t border-gray-200 dark:border-slate-700" />;
            }

            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                disabled={item.disabled}
                className={`context-menu-item-mobile w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Convenience trigger button
export function ContextMenuTrigger({
  onClick,
  className = '',
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`context-menu-trigger-btn p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${className}`}
    >
      <MoreVertical className="w-5 h-5" />
    </button>
  );
}
