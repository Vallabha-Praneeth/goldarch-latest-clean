import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'ai';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  count?: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  count,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    error: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    info: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    default: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    ai: 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white border-transparent',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border
        text-tiny font-medium uppercase
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
      {count !== undefined && (
        <span className="ml-0.5 font-bold">{count}</span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, BadgeVariant> = {
    active: 'success',
    completed: 'success',
    pending: 'warning',
    'in-progress': 'info',
    'at-risk': 'warning',
    delayed: 'error',
    inactive: 'error',
    cancelled: 'error',
  };

  return (
    <Badge variant={statusMap[status.toLowerCase()] || 'default'}>
      {status}
    </Badge>
  );
};
