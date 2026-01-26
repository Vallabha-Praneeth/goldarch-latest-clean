'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type DocumentType = 'quote' | 'invoice' | 'contract' | 'proposal' | 'purchase_order' | 'receipt' | 'other';

const documentTypeLabels: Record<DocumentType, string> = {
  quote: 'Quote',
  invoice: 'Invoice',
  contract: 'Contract',
  proposal: 'Proposal',
  purchase_order: 'Purchase Order',
  receipt: 'Receipt',
  other: 'Other',
};

export interface DocumentFilters {
  dateFrom?: Date;
  dateTo?: Date;
  documentTypes: DocumentType[];
  projectId?: string;
  supplierId?: string;
}

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  projects?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
}

export function DocumentFiltersComponent({
  filters,
  onFiltersChange,
  projects = [],
  suppliers = [],
}: DocumentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.documentTypes.length > 0 ? 1 : 0) +
    (filters.projectId ? 1 : 0) +
    (filters.supplierId ? 1 : 0);

  const handleDocumentTypeToggle = (type: DocumentType) => {
    const newTypes = filters.documentTypes.includes(type)
      ? filters.documentTypes.filter((t) => t !== type)
      : [...filters.documentTypes, type];
    onFiltersChange({ ...filters, documentTypes: newTypes });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      dateFrom: undefined,
      dateTo: undefined,
      documentTypes: [],
      projectId: undefined,
      supplierId: undefined,
    });
  };

  const handleRemoveFilter = (filterType: string) => {
    const newFilters = { ...filters };
    switch (filterType) {
      case 'dateFrom':
        newFilters.dateFrom = undefined;
        break;
      case 'dateTo':
        newFilters.dateTo = undefined;
        break;
      case 'documentTypes':
        newFilters.documentTypes = [];
        break;
      case 'projectId':
        newFilters.projectId = undefined;
        break;
      case 'supplierId':
        newFilters.supplierId = undefined;
        break;
    }
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !filters.dateFrom && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, 'PP') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) =>
                          onFiltersChange({ ...filters, dateFrom: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal',
                          !filters.dateTo && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, 'PP') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) =>
                          onFiltersChange({ ...filters, dateTo: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Document Types */}
              <div className="space-y-2">
                <Label>Document Types</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(Object.entries(documentTypeLabels) as [DocumentType, string][]).map(
                    ([type, label]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.documentTypes.includes(type)}
                          onCheckedChange={() => handleDocumentTypeToggle(type)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {label}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Project Filter */}
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={filters.projectId || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      projectId: value === 'all' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={filters.supplierId || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      supplierId: value === 'all' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {filters.dateFrom && (
          <Badge variant="secondary" className="gap-1">
            From: {format(filters.dateFrom, 'PP')}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveFilter('dateFrom')}
            />
          </Badge>
        )}
        {filters.dateTo && (
          <Badge variant="secondary" className="gap-1">
            To: {format(filters.dateTo, 'PP')}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveFilter('dateTo')}
            />
          </Badge>
        )}
        {filters.documentTypes.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            Types: {filters.documentTypes.length}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveFilter('documentTypes')}
            />
          </Badge>
        )}
        {filters.projectId && (
          <Badge variant="secondary" className="gap-1">
            Project: {projects.find((p) => p.id === filters.projectId)?.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveFilter('projectId')}
            />
          </Badge>
        )}
        {filters.supplierId && (
          <Badge variant="secondary" className="gap-1">
            Supplier: {suppliers.find((s) => s.id === filters.supplierId)?.name}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemoveFilter('supplierId')}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
