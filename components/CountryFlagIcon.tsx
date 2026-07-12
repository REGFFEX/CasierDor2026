import React from 'react';

interface CountryFlagIconProps {
  iso2: string;
  size?: number;
  className?: string;
}

const CountryFlagIcon: React.FC<CountryFlagIconProps> = ({ iso2, size = 20, className = '' }) => {
  const code = iso2.toLowerCase();
  const h = Math.round(size * 0.72);

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10 bg-gray-100 ${className}`}
      style={{ width: size, height: h }}
    >
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={size}
        height={h}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          if (el.parentElement) {
            el.parentElement.textContent = iso2.toUpperCase().slice(0, 2);
            el.parentElement.className += ' text-[8px] font-bold items-center justify-center text-gray-500';
          }
        }}
      />
    </span>
  );
};

export default CountryFlagIcon;
