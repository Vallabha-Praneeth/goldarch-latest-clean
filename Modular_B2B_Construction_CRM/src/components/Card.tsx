import React from 'react';
import { FileText, Building2, DollarSign, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface BaseCardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<BaseCardProps> = ({ 
  className = '', 
  children, 
  hover = false,
  onClick 
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg border border-[#E5E7EB] p-6
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface SupplierCardProps {
  name: string;
  category: string;
  location: string;
  status: 'active' | 'pending' | 'inactive';
  rating: number;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  name,
  category,
  location,
  status,
  rating,
}) => {
  const statusColors = {
    active: 'success',
    pending: 'warning',
    inactive: 'error',
  } as const;

  return (
    <Card hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#4B5563]" />
          </div>
          <div>
            <h4 className="font-semibold text-[#111827]">{name}</h4>
            <p className="text-sm text-[#6B7280]">{category}</p>
          </div>
        </div>
        <Badge variant={statusColors[status]}>{status}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#6B7280]">{location}</span>
        <div className="flex items-center gap-1">
          <span className="text-[#F59E0B]">★</span>
          <span className="font-medium text-[#111827]">{rating}</span>
        </div>
      </div>
    </Card>
  );
};

interface ProjectCardProps {
  name: string;
  client: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed';
  budget: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  name,
  client,
  progress,
  status,
  budget,
}) => {
  const statusColors = {
    'on-track': 'success',
    'at-risk': 'warning',
    'delayed': 'error',
  } as const;

  return (
    <Card hover>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-[#111827] mb-1">{name}</h4>
          <p className="text-sm text-[#6B7280]">{client}</p>
        </div>
        <Badge variant={statusColors[status]}>{status}</Badge>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-[#6B7280]">Progress</span>
          <span className="font-medium text-[#111827]">{progress}%</span>
        </div>
        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <DollarSign className="h-4 w-4 text-[#6B7280]" />
        <span className="font-medium text-[#111827]">{budget}</span>
      </div>
    </Card>
  );
};

interface DocumentCardProps {
  name: string;
  type: string;
  date: string;
  size: string;
  hasAI?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  name,
  type,
  date,
  size,
  hasAI = true,
}) => {
  return (
    <Card hover>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-[#2563EB]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#111827] truncate mb-1">{name}</h4>
          <p className="text-sm text-[#6B7280]">{type}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[#6B7280] mb-3">
        <span>{date}</span>
        <span>{size}</span>
      </div>
      {hasAI && (
        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />}
          className="w-full"
        >
          AI Summarize
        </Button>
      )}
    </Card>
  );
};

interface DealCardProps {
  company: string;
  value: string;
  probability: number;
  contact: string;
  nextAction: string;
}

export const DealCard: React.FC<DealCardProps> = ({
  company,
  value,
  probability,
  contact,
  nextAction,
}) => {
  return (
    <Card hover className="mb-3">
      <div className="mb-3">
        <h4 className="font-semibold text-[#111827] mb-1">{company}</h4>
        <p className="text-lg font-bold text-[#2563EB]">{value}</p>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Probability</span>
          <span className="font-medium text-[#111827]">{probability}%</span>
        </div>
        <div className="text-sm">
          <span className="text-[#6B7280]">Contact: </span>
          <span className="text-[#111827]">{contact}</span>
        </div>
      </div>
      <div className="pt-3 border-t border-[#E5E7EB]">
        <p className="text-xs text-[#6B7280]">Next: {nextAction}</p>
      </div>
    </Card>
  );
};
