import React from 'react';

type CrystalCardProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const CrystalCard: React.FC<CrystalCardProps> = ({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  onClick,
}) => {
  const base = interactive ? 'crystal-card-interactive cursor-pointer' : 'crystal-card';
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${base} ${paddingMap[padding]} ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%, rgba(31,79,216,0.04) 100%)',
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
};

export default CrystalCard;
