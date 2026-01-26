import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = '#2563EB',
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[#10B981]' : isNegative ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
            {isPositive && <TrendingUp className="h-4 w-4" />}
            {isNegative && <TrendingDown className="h-4 w-4" />}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-[#6B7280] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#111827]">{value}</p>
        {changeLabel && (
          <p className="text-xs text-[#9CA3AF] mt-2">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};
