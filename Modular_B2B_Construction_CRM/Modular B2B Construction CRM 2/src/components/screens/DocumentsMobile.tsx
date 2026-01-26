import React from 'react';
import { FileText, Upload, Filter, Sparkles } from 'lucide-react';
import { Badge } from '../Badge';
import { Button } from '../Button';

export const DocumentsMobile: React.FC = () => {
  const documents = [
    {
      name: 'Project_Blueprint_Final.pdf',
      type: 'Blueprint',
      date: 'Jan 12, 2026',
      size: '2.4 MB',
      hasAI: true,
    },
    {
      name: 'Contract_BuildCo_2026.pdf',
      type: 'Contract',
      date: 'Jan 11, 2026',
      size: '1.8 MB',
      hasAI: true,
    },
    {
      name: 'Budget_Q1_Report.xlsx',
      type: 'Financial',
      date: 'Jan 10, 2026',
      size: '856 KB',
      hasAI: false,
    },
    {
      name: 'Safety_Compliance.pdf',
      type: 'Compliance',
      date: 'Jan 9, 2026',
      size: '3.2 MB',
      hasAI: true,
    },
    {
      name: 'Material_Specifications.pdf',
      type: 'Specification',
      date: 'Jan 8, 2026',
      size: '1.2 MB',
      hasAI: true,
    },
  ];

  return (
    <div className="pb-20">
      {/* Search and Filters */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full h-10 pl-10 pr-4 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter Chips - Scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Badge variant="info">Blueprints</Badge>
          <Badge variant="info">Last 30 days</Badge>
          <button className="flex-shrink-0 px-3 py-1 border border-[#D1D5DB] rounded-sm text-xs text-[#6B7280] hover:bg-[#F9FAFB]">
            <Filter className="h-3 w-3 inline mr-1" />
            More
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y divide-[#E5E7EB]">
        {documents.map((doc, index) => (
          <div key={index} className="bg-white px-4 py-4 hover:bg-[#F9FAFB] active:bg-[#F3F4F6]">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-16 h-22 bg-[#DBEAFE] rounded-lg flex-shrink-0 flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#2563EB]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#111827] text-sm truncate mb-1">
                  {doc.name}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{doc.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-3">
                  <span>{doc.date}</span>
                  <span>{doc.size}</span>
                </div>
                {doc.hasAI && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white rounded-md text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    AI Summarize
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload FAB */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-lg flex items-center justify-center z-40">
        <Upload className="h-6 w-6" />
      </button>
    </div>
  );
};
