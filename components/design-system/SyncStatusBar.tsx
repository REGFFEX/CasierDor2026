import React from 'react';
import { CloudOff, Cloud, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useConnectivity } from '../../utils/connectivityContext';
import { useLanguage } from '../../utils/languageContext';

const SyncStatusBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { status, pendingCount, failedCount } = useConnectivity();
  const { t } = useLanguage();

  const config = {
    offline: {
      icon: CloudOff,
      label: t('status.offline'),
      className: 'text-gray-600 dark:text-gray-300 bg-gray-100/90 dark:bg-slate-800/90',
      dot: 'bg-gray-400',
    },
    online: {
      icon: Cloud,
      label: t('status.online'),
      className: 'text-primary-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/40',
      dot: 'bg-primary',
    },
    pending: {
      icon: Clock,
      label: `${pendingCount} ${t('status.pending').toLowerCase()}`,
      className: 'text-amber-800 dark:text-amber-200 bg-amber-50/90 dark:bg-amber-950/40',
      dot: 'bg-warning animate-pulse-soft',
    },
    syncing: {
      icon: Loader2,
      label: t('status.syncing'),
      className: 'text-primary-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/40',
      dot: 'bg-primary animate-pulse',
    },
    synced: {
      icon: CheckCircle2,
      label: t('status.synced'),
      className: 'text-green-800 dark:text-green-200 bg-green-50/90 dark:bg-green-950/40',
      dot: 'bg-success',
    },
    sync_error: {
      icon: AlertTriangle,
      label: failedCount > 0 ? `${t('status.error')} (${failedCount})` : t('status.error'),
      className: 'text-red-800 dark:text-red-200 bg-red-50/90 dark:bg-red-950/40',
      dot: 'bg-error',
    },
  }[status];

  const Icon = config.icon;
  const spin = status === 'syncing';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border border-white/50 dark:border-slate-600/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${config.className} ${compact ? 'max-w-[140px]' : ''}`}
      role="status"
      aria-live="polite"
      title={config.label}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
      <Icon className={`h-3.5 w-3.5 shrink-0 ${spin ? 'animate-spin' : ''}`} />
      {!compact && <span className="truncate">{config.label}</span>}
    </div>
  );
};

export default SyncStatusBar;
