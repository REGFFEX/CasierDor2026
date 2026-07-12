import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface AuthCrystalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'text-white',
    'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
    'border border-white/30',
    'shadow-[0_8px_32px_rgba(59,130,246,0.35),0_2px_8px_rgba(167,139,250,0.25)]',
    'hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500',
    'hover:shadow-[0_12px_40px_rgba(59,130,246,0.45),0_4px_12px_rgba(236,72,153,0.15)]',
  ].join(' '),
  secondary: [
    'text-blue-700 dark:text-blue-200',
    'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md',
    'border border-blue-200/60 dark:border-blue-500/30',
    'shadow-[0_4px_20px_rgba(99,102,241,0.12)]',
    'hover:bg-white hover:border-blue-300',
  ].join(' '),
  ghost: [
    'text-gray-600 dark:text-gray-300',
    'bg-transparent border border-transparent',
    'hover:bg-white/50 dark:hover:bg-slate-800/50',
  ].join(' '),
};

const AuthCrystalButton: React.FC<AuthCrystalButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={[
      'relative inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl',
      'font-semibold text-sm tracking-wide transition-all duration-300',
      'backdrop-blur-sm overflow-hidden',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
      'before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/25 before:to-transparent before:pointer-events-none',
      variantClasses[variant],
      className,
    ].join(' ')}
    {...props}
  >
    {loading ? (
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      <>
        {icon}
        <span>{children}</span>
        {iconRight}
      </>
    )}
  </button>
);

export default AuthCrystalButton;
