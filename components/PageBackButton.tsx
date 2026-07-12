import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';

interface PageBackButtonProps {
  fallback?: string;
  className?: string;
}

/** Retour Android : history si possible, sinon route de secours */
export function useAppBack(fallback = '/') {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: false });
  };
}

const PageBackButton: React.FC<PageBackButtonProps> = ({
  fallback = '/',
  className = 'p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all group shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700',
}) => {
  const goBack = useAppBack(fallback);
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={goBack}
      className={className}
      aria-label={t('button.back')}
    >
      <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
    </button>
  );
};

export default PageBackButton;
