import React, { useState } from 'react';
import { X } from 'lucide-react';

type CompanyLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<CompanyLogoSize, string> = {
  xs: 'w-10 h-10', // enlarged from 9
  sm: 'w-12 h-12', // enlarged from 10
  md: 'w-16 h-16', // enlarged from 14
  lg: 'w-24 h-24', // enlarged from 20
  xl: 'w-32 h-32', // enlarged from 28
};

const FALLBACK_TEXT: Record<CompanyLogoSize, string> = {
  xs: 'text-xl',
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

interface CompanyLogoProps {
  src?: string;
  alt?: string;
  fallbackLetter?: string;
  size?: CompanyLogoSize;
  className?: string;
  interactive?: boolean;
}

/** Avatar circulaire type WhatsApp — object-cover dans un conteneur rond avec lightbox */
const CompanyLogo: React.FC<CompanyLogoProps> = ({
  src,
  alt = 'Logo',
  fallbackLetter = 'C',
  size = 'sm',
  className = '',
  interactive = true,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleOpen = () => {
    if (interactive) setIsLightboxOpen(true);
  };

  return (
    <>
      <div
        className={`${sizeClass} shrink-0 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md shadow-slate-200/80 dark:shadow-black/40 ${interactive ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''} ${className}`}
        aria-hidden={!src && !fallbackLetter}
        onClick={handleOpen}
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

      {isLightboxOpen && interactive && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Fermer"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="relative max-w-sm md:max-w-md lg:max-w-lg w-full aspect-square rounded-full overflow-hidden border-4 border-white/20 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {src ? (
              <img src={src} alt={alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[8rem] md:text-[12rem]">
                {fallbackLetter.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyLogo;
