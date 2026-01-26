import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-xl shadow-modal w-full ${sizeClasses[size]} mx-4
          max-h-[90vh] overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E7EB]">
            <h2 className="text-h3 text-[#111827]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] hover:bg-[#F9FAFB] rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-[#E5E7EB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  citations?: Array<{ text: string; page: number }>;
  tabs?: Array<{ label: string; content: React.ReactNode }>;
}

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  title,
  summary,
  citations = [],
  tabs,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <h3 className="text-h3 text-[#111827]">{title}</h3>
        </div>

        {tabs && (
          <div className="flex gap-2 border-b border-[#E5E7EB] mb-6">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === index
                    ? 'border-[#8B5CF6] text-[#8B5CF6]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {tabs ? (
          <div>{tabs[activeTab].content}</div>
        ) : (
          <>
            <div className="prose prose-sm max-w-none">
              <p className="text-[#374151] leading-relaxed">{summary}</p>
            </div>

            {citations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#111827] mb-3">Citations</h4>
                <div className="flex flex-wrap gap-2">
                  {citations.map((citation, index) => (
                    <button
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-medium hover:bg-[#FDE68A] transition-colors"
                    >
                      <span>Page {citation.page}</span>
                      <span className="text-[#D97706]">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary">
          Copy Summary
        </Button>
      </div>
    </Modal>
  );
};
