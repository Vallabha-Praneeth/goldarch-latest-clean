/**
 * Quick Actions Component
 * Provides cross-section navigation and actions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  FileText,
  CheckSquare,
  Activity,
  Handshake,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface QuickActionsProps {
  entityType: 'deal' | 'project' | 'supplier' | 'quote' | 'task' | 'activity';
  entityId: string;
  entityData?: {
    supplierId?: string;
    projectId?: string;
    dealId?: string;
    supplierName?: string;
    projectName?: string;
  };
  onCreateQuote?: () => void;
  onCreateTask?: () => void;
  onCreateActivity?: () => void;
  onCreateDeal?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function QuickActions({
  entityType,
  entityId,
  entityData,
  onCreateQuote,
  onCreateTask,
  onCreateActivity,
  onCreateDeal,
  onView,
  onEdit,
  onDelete,
}: QuickActionsProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    if (onView) {
      onView();
    } else {
      // Default navigation
      switch (entityType) {
        case 'quote':
          router.push(`/app-dashboard/quotes/${entityId}/review`);
          break;
        case 'deal':
          router.push(`/app-dashboard/deals/${entityId}`);
          break;
        case 'project':
          router.push(`/app-dashboard/projects/${entityId}`);
          break;
        case 'supplier':
          router.push(`/supplier/${entityId}`);
          break;
      }
    }
  };

  const getActionItems = () => {
    const items = [];

    // View action (always available)
    items.push({
      label: 'View Details',
      icon: Eye,
      onClick: handleViewDetails,
    });

    // Edit action
    if (onEdit) {
      items.push({
        label: 'Edit',
        icon: Edit,
        onClick: onEdit,
      });
    }

    // Entity-specific create actions
    switch (entityType) {
      case 'deal':
        if (onCreateQuote) {
          items.push({
            label: 'Create Quote',
            icon: FileText,
            onClick: onCreateQuote,
          });
        }
        if (onCreateTask) {
          items.push({
            label: 'Add Task',
            icon: CheckSquare,
            onClick: onCreateTask,
          });
        }
        if (onCreateActivity) {
          items.push({
            label: 'Log Activity',
            icon: Activity,
            onClick: onCreateActivity,
          });
        }
        break;

      case 'project':
        if (onCreateDeal) {
          items.push({
            label: 'Create Deal',
            icon: Handshake,
            onClick: onCreateDeal,
          });
        }
        if (onCreateTask) {
          items.push({
            label: 'Add Task',
            icon: CheckSquare,
            onClick: onCreateTask,
          });
        }
        break;

      case 'supplier':
        if (onCreateQuote) {
          items.push({
            label: 'Request Quote',
            icon: FileText,
            onClick: onCreateQuote,
          });
        }
        if (onCreateDeal) {
          items.push({
            label: 'Create Deal',
            icon: Handshake,
            onClick: onCreateDeal,
          });
        }
        if (onCreateActivity) {
          items.push({
            label: 'Log Activity',
            icon: Activity,
            onClick: onCreateActivity,
          });
        }
        break;

      case 'quote':
        if (onCreateTask) {
          items.push({
            label: 'Add Follow-up Task',
            icon: CheckSquare,
            onClick: onCreateTask,
          });
        }
        if (onCreateActivity) {
          items.push({
            label: 'Log Activity',
            icon: Activity,
            onClick: onCreateActivity,
          });
        }
        break;
    }

    // Delete action (always last)
    if (onDelete) {
      items.push('separator');
      items.push({
        label: 'Delete',
        icon: Trash2,
        onClick: onDelete,
        danger: true,
      });
    }

    return items;
  };

  const actionItems = getActionItems();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actionItems.map((item, index) => {
          if (item === 'separator') {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }

          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={item.danger ? 'text-destructive focus:text-destructive' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
