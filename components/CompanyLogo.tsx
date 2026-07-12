import React from 'react';

type CompanyLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<CompanyLogoSize, string> = {
  xs: 'w-9 h-9',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const FALLBACK_TEXT: Record<CompanyLogoSize, string> = {
  xs: 'text-lg',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

interface CompanyLogoProps {
  src?: string;
  alt?: string;
  fallbackLetter?: string;
  size?: CompanyLogoSize;
  className?: string;
}

/** Avatar circulaire type WhatsApp — object-cover dans un conteneur rond */
const CompanyLogo: React.FC<CompanyLogoProps> = ({
  src,
  alt = 'Logo',
  fallbackLetter = 'C',
  size = 'sm',
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md shadow-slate-200/80 dark:shadow-black/40 ${className}`}
      aria-hidden={!src && !fallbackLetter}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold ${FALLBACK_TEXT[size]}`}
        >
          {fallbackLetter.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
