import React, { useState } from 'react';
import { Upload, Filter, Download } from 'lucide-react';
import { Button } from '../Button';
import { DataTableFilters } from '../DataTable';
import { DocumentCard } from '../Card';
import { Modal } from '../Modal';
import { FileUpload, UploadProgress } from '../FileUpload';
import { Badge } from '../Badge';

export const DocumentsDesktop: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'complete' | 'error'>('uploading');

  const documents = [
    { name: 'Project_Blueprint_Final.pdf', type: 'Blueprint', date: 'Jan 12, 2026', size: '2.4 MB', hasAI: true },
    { name: 'Contract_BuildCo_2026.pdf', type: 'Contract', date: 'Jan 11, 2026', size: '1.8 MB', hasAI: true },
    { name: 'Budget_Q1_Report.xlsx', type: 'Financial', date: 'Jan 10, 2026', size: '856 KB', hasAI: false },
    { name: 'Safety_Compliance.pdf', type: 'Compliance', date: 'Jan 9, 2026', size: '3.2 MB', hasAI: true },
    { name: 'Material_Specs.pdf', type: 'Specification', date: 'Jan 8, 2026', size: '1.2 MB', hasAI: true },
    { name: 'Timeline_Phase1.pdf', type: 'Schedule', date: 'Jan 7, 2026', size: '945 KB', hasAI: true },
  ];

  const handleUpload = (files: File[]) => {
    setUploadProgress(0);
    setUploadStatus('uploading');

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('processing');
          
          setTimeout(() => {
            setUploadStatus('complete');
            setTimeout(() => {
              setShowUploadModal(false);
              setUploadProgress(null);
            }, 1500);
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-h2 text-[#111827] mb-2">Documents</h1>
              <p className="text-sm text-[#6B7280]">
                Manage and search your project documents with AI-powered insights
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={<Upload className="h-5 w-5" />}
              onClick={() => setShowUploadModal(true)}
            >
              Upload Document
            </Button>
          </div>

          {/* Filters */}
          <DataTableFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onExport={() => console.log('Export')}
            filters={
              <>
                <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>
                  Type
                </Button>
                <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>
                  Date
                </Button>
              </>
            }
          />

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[#6B7280]">Active filters:</span>
            <Badge variant="info">Blueprints</Badge>
            <Badge variant="info">Last 30 days</Badge>
          </div>
        </div>

        {/* Documents Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-6">
            {documents.map((doc, index) => (
              <DocumentCard key={index} {...doc} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F9FAFB] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                    <span className="text-lg">📄</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#111827]">{doc.name}</h4>
                    <p className="text-sm text-[#6B7280]">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm text-[#6B7280]">
                  <span>{doc.date}</span>
                  <span className="w-20 text-right">{doc.size}</span>
                  {doc.hasAI && (
                    <Button variant="secondary" size="sm">
                      AI Summarize
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (uploadProgress === null) {
            setShowUploadModal(false);
          }
        }}
        title="Upload Document"
        footer={
          uploadProgress === null ? (
            <>
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Start Upload
              </Button>
            </>
          ) : null
        }
      >
        {uploadProgress === null ? (
          <FileUpload onUpload={handleUpload} />
        ) : (
          <UploadProgress
            fileName="Project_Blueprint_Final.pdf"
            progress={uploadProgress}
            status={uploadStatus}
          />
        )}
      </Modal>
    </>
  );
};
