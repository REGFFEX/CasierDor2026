import { useState, useCallback } from 'react';
import {
  loadConfirmPreferences,
  shouldSkipConfirmation,
  setNeverAskAgain,
} from '../utils/confirmPreferences';

export interface PendingConfirmAction {
  actionId: string;
  message: string;
  title?: string;
  level?: 1 | 2;
  run: () => void;
}

export function useConfirmAction() {
  const [pending, setPending] = useState<PendingConfirmAction | null>(null);
  const [neverAsk, setNeverAsk] = useState(false);

  const requestConfirm = useCallback((opts: PendingConfirmAction) => {
    if (shouldSkipConfirmation(opts.actionId)) {
      opts.run();
      return;
    }
    setNeverAsk(false);
    setPending(opts);
  }, []);

  const cancel = useCallback(() => {
    setPending(null);
    setNeverAsk(false);
  }, []);

  const confirm = useCallback(
    (mode: 'once' | 'permanent') => {
      if (!pending) return;
      if (mode === 'permanent' || neverAsk) {
        setNeverAskAgain(pending.actionId, true);
      }
      pending.run();
      setPending(null);
      setNeverAsk(false);
    },
    [pending, neverAsk]
  );

  return {
    pending,
    neverAsk,
    setNeverAsk,
    requestConfirm,
    cancel,
    confirm,
    preferences: loadConfirmPreferences(),
  };
}
