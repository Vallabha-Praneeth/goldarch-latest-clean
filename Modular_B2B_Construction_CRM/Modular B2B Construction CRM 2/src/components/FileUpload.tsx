import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = '.pdf,.doc,.docx',
  multiple = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(newFiles);
      onUpload?.(newFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      onUpload?.(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragActive
            ? 'border-[#2563EB] bg-[#DBEAFE]'
            : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#9CA3AF]'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-[#DBEAFE] rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#111827] mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-[#6B7280]">
              Supports PDF, DOC, DOCX up to 10MB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-[#E5E7EB] rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-[#2563EB] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-[#6B7280] hover:bg-[#F9FAFB] rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  status,
}) => {
  const statusConfig = {
    uploading: { text: 'Uploading...', color: '#2563EB', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    processing: { text: 'AI Processing...', color: '#8B5CF6', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    complete: { text: 'Complete', color: '#10B981', icon: <CheckCircle2 className="h-4 w-4" /> },
    error: { text: 'Error', color: '#EF4444', icon: <X className="h-4 w-4" /> },
  };

  const config = statusConfig[status];

  return (
    <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#2563EB]" />
          <span className="text-sm font-medium text-[#111827]">{fileName}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: config.color }}>
          {config.icon}
          <span className="text-sm font-medium">{config.text}</span>
        </div>
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
    </div>
  );
};
