/**
 * Floating Action Button (FAB)
 * 
 * Bouton d'action flottant pour mobile
 * Peut être étendu en menu d'actions multiples
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronUp } from 'lucide-react';

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FloatingActionButton({
  actions,
  position = 'bottom-right',
  size = 'md',
  className = '',
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  if (actions.length === 0) return null;

  // Single action - simple FAB
  if (actions.length === 1) {
    const action = actions[0];
    return (
      <div
        ref={fabRef}
        className={`fab-container fixed ${positionClasses[position]} ${sizeClasses[size]} ${className}`}
      >
        <button
          onClick={action.onClick}
          className="fab-single w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          style={{ backgroundColor: action.color }}
        >
          {action.icon || <Plus className={iconSizeClasses[size]} />}
        </button>
      </div>
    );
  }

  // Multiple actions - expandable FAB
  return (
    <div
      ref={fabRef}
      className={`fab-container fixed ${positionClasses[position]} ${className}`}
    >
      {/* Expanded actions */}
      <div className="fab-actions flex flex-col-reverse gap-3 mb-3">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick();
              setIsExpanded(false);
            }}
            className={`fab-action group flex items-center gap-3 ${
              isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            } transition-all duration-200`}
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
            }}
          >
            <span className="fab-action-label bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {action.label}
            </span>
            <div
              className={`fab-action-btn ${sizeClasses[size]} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}
              style={{ backgroundColor: action.color }}
            >
              {action.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fab-main ${sizeClasses[size]} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
          isExpanded ? 'rotate-45' : ''
        }`}
      >
        {isExpanded ? <X className={iconSizeClasses[size]} /> : <Plus className={iconSizeClasses[size]} />}
      </button>
    </div>
  );
}
