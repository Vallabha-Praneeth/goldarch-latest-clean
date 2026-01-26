/**
 * Bulk Actions Toolbar
 * Provides multi-select and batch operations for entity lists
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  X,
  Trash2,
  CheckSquare,
  Archive,
  Send,
  Edit,
  Tag,
  MoreHorizontal,
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onUpdateStatus?: (status: string) => void;
  onAssignTag?: () => void;
  onBulkEdit?: () => void;
  entityType: 'deals' | 'projects' | 'tasks' | 'activities' | 'quotes' | 'suppliers';
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDelete,
  onArchive,
  onUpdateStatus,
  onAssignTag,
  onBulkEdit,
  entityType,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground shadow-lg rounded-lg px-4 py-3 flex items-center gap-4 border border-primary/20">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium">
            {selectedCount} {entityType} selected
          </span>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {!allSelected && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSelectAll}
              className="h-8"
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              Select All ({totalCount})
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onDelete}
              className="h-8 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-8">
                <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onBulkEdit && (
                <DropdownMenuItem onClick={onBulkEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </DropdownMenuItem>
              )}
              {onUpdateStatus && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUpdateStatus('active')}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus('completed')}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </DropdownMenuItem>
                </>
              )}
              {onArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </>
              )}
              {onAssignTag && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onAssignTag}>
                    <Tag className="h-4 w-4 mr-2" />
                    Assign Tags
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-primary-foreground/20" />

          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-8 hover:bg-primary-foreground/10"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
