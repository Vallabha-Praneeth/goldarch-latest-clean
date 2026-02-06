/**
 * MODULE-1C: Quote Approval Workflow
 * File: hooks/use-quote-approval.ts
 *
 * React Query hooks for quote approval operations.
 * Reads use direct Supabase client queries (RLS is currently disabled for dev).
 * Mutations go through API routes (server-side role/ownership enforcement).
 *
 * NOTE: RLS is disabled on quotes/quote_lines tables for local development.
 * Production should re-enable RLS or move reads to server-side routes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase-client';

// Types
import type {
  Quote,
  QuoteStatus,
  ApproveQuoteRequest,
  RejectQuoteRequest,
  SubmitQuoteRequest,
  AcceptQuoteRequest,
} from '../types/quote-approval.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const quoteQueryKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteQueryKeys.all, 'list'] as const,
  list: (filters?: QuoteFilters) => [...quoteQueryKeys.lists(), filters] as const,
  details: () => [...quoteQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteQueryKeys.details(), id] as const,
  pending: () => [...quoteQueryKeys.all, 'pending'] as const,
  myQuotes: () => [...quoteQueryKeys.all, 'my-quotes'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

interface QuoteFilters {
  status?: QuoteStatus;
  supplierId?: string;
  projectId?: string;
  createdBy?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

const apiClient = {
  getQuotes: async (filters?: QuoteFilters): Promise<Quote[]> => {
    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return (data ?? []) as Quote[];
  },

  getQuoteDetails: async (id: string): Promise<Quote> => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Quote;
  },

  submitQuote: async (data: SubmitQuoteRequest): Promise<void> => {
    const response = await fetch(`/api/quotes/${data.quote_id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: data.notes }),
    });
    if (!response.ok) {
      let message = 'Failed to submit quote';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch { /* non-JSON response body */ }
      throw new Error(message);
    }
  },

  approveQuote: async (data: ApproveQuoteRequest): Promise<void> => {
    const response = await fetch(`/api/quotes/${data.quote_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: data.notes }),
    });
    if (!response.ok) {
      let message = 'Failed to approve quote';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch { /* non-JSON response body */ }
      throw new Error(message);
    }
  },

  rejectQuote: async (data: RejectQuoteRequest): Promise<void> => {
    const response = await fetch(`/api/quotes/${data.quote_id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: data.reason }),
    });
    if (!response.ok) {
      let message = 'Failed to reject quote';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch { /* non-JSON response body */ }
      throw new Error(message);
    }
  },

  acceptQuote: async (data: AcceptQuoteRequest): Promise<void> => {
    const response = await fetch(`/api/quotes/${data.quote_id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: data.notes }),
    });
    if (!response.ok) {
      let message = 'Failed to accept quote';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch { /* non-JSON response body */ }
      throw new Error(message);
    }
  },

  declineQuote: async (quoteId: string): Promise<void> => {
    const response = await fetch(`/api/quotes/${quoteId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      let message = 'Failed to decline quote';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch { /* non-JSON response body */ }
      throw new Error(message);
    }
  },
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all quotes with optional filters
 */
export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: quoteQueryKeys.list(filters),
    queryFn: () => apiClient.getQuotes(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch quotes pending approval
 * Only for managers/admins
 */
export function usePendingQuotes() {
  return useQuotes({ status: 'pending' });
}

/**
 * Fetch user's own quotes
 *
 * TODO: Currently returns all quotes. Should filter by createdBy using
 * the current user's ID from auth context once integrated.
 * For now, RLS policies (when enabled) should handle access control.
 */
export function useMyQuotes() {
  return useQuery({
    queryKey: quoteQueryKeys.myQuotes(),
    queryFn: () => apiClient.getQuotes(),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch specific quote details
 */
export function useQuoteDetails(quoteId: string | null) {
  return useQuery({
    queryKey: quoteQueryKeys.detail(quoteId || ''),
    queryFn: () => {
      if (!quoteId) throw new Error('Quote ID required');
      return apiClient.getQuoteDetails(quoteId);
    },
    enabled: !!quoteId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Submit quote for approval
 */
export function useSubmitQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitQuoteRequest) => apiClient.submitQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Approve quote
 */
export function useApproveQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveQuoteRequest) => apiClient.approveQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Reject quote
 */
export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RejectQuoteRequest) => apiClient.rejectQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Accept approved quote
 */
export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcceptQuoteRequest) => apiClient.acceptQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Decline approved quote
 */
export function useDeclineQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => apiClient.declineQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/**
 * Invalidate all quote queries
 */
export function useInvalidateQuotes() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
  };
}
