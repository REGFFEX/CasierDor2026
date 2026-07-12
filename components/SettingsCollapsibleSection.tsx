import React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface SettingsCollapsibleSectionProps {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'blue' | 'purple' | 'emerald' | 'amber' | 'indigo' | 'cyan' | 'rose';
  badge?: React.ReactNode;
  hidden?: boolean;
  children: React.ReactNode;
}

const ACCENT: Record<string, { shell: string; icon: string; chevron: string }> = {
  blue: {
    shell: 'from-blue-50 to-sky-100/80 border-blue-200/80',
    icon: 'from-blue-400 via-blue-500 to-indigo-600 shadow-blue-500/40',
    chevron: 'text-blue-600',
  },
  purple: {
    shell: 'from-violet-50 to-purple-100/80 border-violet-200/80',
    icon: 'from-violet-400 via-purple-500 to-fuchsia-600 shadow-purple-500/40',
    chevron: 'text-purple-600',
  },
  emerald: {
    shell: 'from-emerald-50 to-teal-100/80 border-emerald-200/80',
    icon: 'from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/40',
    chevron: 'text-emerald-600',
  },
  amber: {
    shell: 'from-amber-50 to-orange-100/80 border-amber-200/80',
    icon: 'from-amber-400 via-orange-500 to-rose-500 shadow-amber-500/40',
    chevron: 'text-amber-600',
  },
  indigo: {
    shell: 'from-indigo-50 to-blue-100/80 border-indigo-200/80',
    icon: 'from-indigo-400 via-blue-500 to-violet-600 shadow-indigo-500/40',
    chevron: 'text-indigo-600',
  },
  cyan: {
    shell: 'from-cyan-50 to-sky-100/80 border-cyan-200/80',
    icon: 'from-cyan-400 via-sky-500 to-blue-600 shadow-cyan-500/40',
    chevron: 'text-cyan-600',
  },
  rose: {
    shell: 'from-rose-50 to-pink-100/80 border-rose-200/80',
    icon: 'from-rose-400 via-pink-500 to-fuchsia-600 shadow-rose-500/40',
    chevron: 'text-rose-600',
  },
};

/** Section pliable style icône 3D (iOS / One UI) */
const SettingsCollapsibleSection: React.FC<SettingsCollapsibleSectionProps> = ({
  open,
  onToggle,
  title,
  subtitle,
  icon: Icon,
  accent = 'blue',
  badge,
  hidden = false,
  children,
}) => {
  if (hidden) return null;

  const a = ACCENT[accent] || ACCENT.blue;

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm bg-gradient-to-br ${a.shell}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 hover:bg-white/60 dark:hover:bg-slate-800/60 p-2 rounded-2xl transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${a.icon} flex items-center justify-center shadow-lg ring-2 ring-white/80 dark:ring-slate-700/80`}
            style={{
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.45)',
            }}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.2} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider truncate">
                {subtitle}
              </p>
            )}
          </div>
          {badge}
        </div>
        <ChevronDown
          className={`w-5 h-5 shrink-0 ${a.chevron} transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="pt-5 mt-2 border-t border-white/50 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsCollapsibleSection;
