'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Loader2,
  Copy,
  Check,
  Sparkles,
  List,
  AlignLeft,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  namespace?: string;
  projectId?: string;
  supplierId?: string;
}

type SummaryType = 'brief' | 'detailed' | 'bullet-points';

interface Summary {
  type: SummaryType;
  content: string;
  metadata: {
    chunkCount: number;
    totalTokens: number;
    processingTime: number;
    model: string;
  };
}

export function DocumentSummaryModal({
  open,
  onOpenChange,
  documentId,
  documentName,
  namespace,
  projectId,
  supplierId,
}: DocumentSummaryModalProps) {
  const [summaries, setSummaries] = useState<Map<SummaryType, Summary>>(new Map());
  const [activeTab, setActiveTab] = useState<SummaryType>('brief');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const summaryTypes: Array<{
    value: SummaryType;
    label: string;
    icon: any;
    description: string;
  }> = [
    {
      value: 'brief',
      label: 'Brief',
      icon: AlignLeft,
      description: '2-3 sentences',
    },
    {
      value: 'detailed',
      label: 'Detailed',
      icon: FileCheck,
      description: 'Comprehensive',
    },
    {
      value: 'bullet-points',
      label: 'Bullet Points',
      icon: List,
      description: 'Key points',
    },
  ];

  const generateSummary = async (type: SummaryType) => {
    // Check if we already have this summary type
    if (summaries.has(type)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/framework-b/documents/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          namespace,
          projectId,
          supplierId,
          summaryType: type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();

      if (data.success) {
        const newSummaries = new Map(summaries);
        newSummaries.set(type, {
          type,
          content: data.summary,
          metadata: data.metadata,
        });
        setSummaries(newSummaries);
        toast.success(`${type} summary generated`);
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    const type = value as SummaryType;
    setActiveTab(type);
    // Auto-generate summary when switching tabs
    if (!summaries.has(type)) {
      generateSummary(type);
    }
  };

  const handleCopy = () => {
    const summary = summaries.get(activeTab);
    if (summary) {
      navigator.clipboard.writeText(summary.content);
      setCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate brief summary on mount
  useState(() => {
    if (open && !summaries.has('brief')) {
      generateSummary('brief');
    }
  });

  const currentSummary = summaries.get(activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Document Summary
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {documentName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {summaryTypes.map(({ value, label, icon: Icon, description }) => (
              <TabsTrigger key={value} value={value} className="gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {summaryTypes.map(({ value }) => (
            <TabsContent key={value} value={value} className="mt-6">
              {loading && !summaries.has(value) ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Generating {value} summary...</p>
                  <p className="text-sm mt-2">This may take a few seconds</p>
                </div>
              ) : currentSummary ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {value === 'bullet-points' ? (
                        <div>
                          {currentSummary.content
                            .split('\n')
                            .map((line) => line.trim())
                            .filter((line) => line)
                            .reduce((acc: Array<{ type: 'list' | 'paragraph', items: string[] }>, line) => {
                              const isBullet = line.startsWith('- ') || line.startsWith('* ');
                              const content = isBullet ? line.substring(2) : line;

                              if (isBullet) {
                                // Add to existing list or create new list
                                if (acc.length > 0 && acc[acc.length - 1].type === 'list') {
                                  acc[acc.length - 1].items.push(content);
                                } else {
                                  acc.push({ type: 'list', items: [content] });
                                }
                              } else {
                                // Add as paragraph
                                acc.push({ type: 'paragraph', items: [content] });
                              }
                              return acc;
                            }, [])
                            .map((block, blockIdx) => {
                              if (block.type === 'list') {
                                return (
                                  <ul key={blockIdx} className="list-disc pl-5 my-2">
                                    {block.items.map((item, itemIdx) => (
                                      <li key={itemIdx}>{item}</li>
                                    ))}
                                  </ul>
                                );
                              } else {
                                return (
                                  <p key={blockIdx} className="my-2">
                                    {block.items[0]}
                                  </p>
                                );
                              }
                            })}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{currentSummary.content}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex gap-3">
                      <Badge variant="outline">
                        {currentSummary.metadata.chunkCount} chunks analyzed
                      </Badge>
                      <Badge variant="outline">
                        {currentSummary.metadata.totalTokens} tokens
                      </Badge>
                      <Badge variant="outline">
                        {(currentSummary.metadata.processingTime / 1000).toFixed(1)}s
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p>No summary generated yet</p>
                  <Button
                    onClick={() => generateSummary(value)}
                    className="mt-4"
                    variant="outline"
                  >
                    Generate {value} summary
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
