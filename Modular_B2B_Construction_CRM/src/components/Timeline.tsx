import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'default';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  const getIconByType = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getColorByType = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[#10B981] text-white';
      case 'warning':
        return 'bg-[#F59E0B] text-white';
      case 'info':
        return 'bg-[#3B82F6] text-white';
      default:
        return 'bg-[#E5E7EB] text-[#6B7280]';
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColorByType(item.type)}`}>
              {item.icon || getIconByType(item.type)}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-[#E5E7EB] mt-2" />
            )}
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-[#111827]">{item.title}</h4>
              <span className="text-xs text-[#9CA3AF] flex-shrink-0 ml-4">{item.time}</span>
            </div>
            <p className="text-sm text-[#6B7280]">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
