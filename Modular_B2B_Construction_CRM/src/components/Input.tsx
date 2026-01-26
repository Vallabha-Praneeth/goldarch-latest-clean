import React from 'react';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helper,
  error,
  success,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const inputStyles = `
    w-full h-10 px-3 text-sm text-[#111827] bg-white border rounded-md 
    transition-all duration-200
    placeholder:text-[#9CA3AF]
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed
    ${error ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]' : ''}
    ${success ? 'border-[#10B981] focus:ring-[#10B981] focus:border-[#10B981]' : ''}
    ${!error && !success ? 'border-[#D1D5DB] focus:ring-[#2563EB] focus:border-[#2563EB] hover:border-[#9CA3AF]' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
  `;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-[#111827] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {leftIcon}
          </div>
        )}
        <input
          className={inputStyles}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {rightIcon}
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EF4444]">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10B981]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>
      {helper && !error && (
        <p className="mt-1.5 text-xs text-[#6B7280]">{helper}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>
      )}
    </div>
  );
};

export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'>> = (props) => {
  return <Input leftIcon={<Search className="h-4 w-4" />} {...props} />;
};
