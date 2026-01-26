import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'icon-text';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] focus-visible:ring-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed',
    secondary: 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#9CA3AF] active:bg-[#F3F4F6] focus-visible:ring-[#2563EB] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] focus-visible:ring-[#2563EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[#EF4444] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed',
    icon: 'bg-transparent text-[#4B5563] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] focus-visible:ring-[#2563EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed',
    'icon-text': 'bg-transparent text-[#374151] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] focus-visible:ring-[#2563EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed',
  };
  
  const sizeStyles = {
    sm: variant === 'icon' ? 'h-8 w-8 rounded-md' : 'h-8 px-3 text-sm rounded-md',
    md: variant === 'icon' ? 'h-10 w-10 rounded-md' : 'h-10 px-4 text-sm rounded-md',
    lg: variant === 'icon' ? 'h-12 w-12 rounded-lg' : 'h-12 px-6 text-base rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
};
