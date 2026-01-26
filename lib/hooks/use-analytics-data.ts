'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import {
  DateRange,
  calculateDealMetrics,
  calculateTrend,
  filterByDateRange,
  getPreviousPeriod,
  generateTimeSeriesData,
  generateCategoricalData,
} from '@/lib/utils/analytics';
import { useMemo } from 'react';

/**
 * Hook to fetch and calculate analytics data
 */
export function useAnalyticsData(dateRange: DateRange) {
  // Fetch deals
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['analytics-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, supplier:suppliers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch quotations
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['analytics-quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['analytics-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['analytics-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!deals || !quotations || !activities || !tasks) {
      return null;
    }

    const previousPeriod = getPreviousPeriod(dateRange);

    // Filter data by date range
    const currentDeals = filterByDateRange(deals, 'created_at', dateRange);
    const previousDeals = filterByDateRange(deals, 'created_at', previousPeriod);

    const currentQuotes = filterByDateRange(quotations, 'created_at', dateRange);
    const previousQuotes = filterByDateRange(quotations, 'created_at', previousPeriod);

    const currentActivities = filterByDateRange(activities, 'created_at', dateRange);
    const previousActivities = filterByDateRange(activities, 'created_at', previousPeriod);

    const currentTasks = filterByDateRange(tasks, 'created_at', dateRange);
    const previousTasks = filterByDateRange(tasks, 'created_at', previousPeriod);

    // Deal metrics
    const currentDealMetrics = calculateDealMetrics(currentDeals);
    const previousDealMetrics = calculateDealMetrics(previousDeals);

    // Quote metrics
    const currentQuoteCount = currentQuotes.length;
    const previousQuoteCount = previousQuotes.length;
    const currentQuoteValue = currentQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const previousQuoteValue = previousQuotes.reduce((sum, q) => sum + (q.total || 0), 0);

    // Active deals (not lost or completed)
    const activeDeals = currentDeals.filter(
      (d) => d.stage !== 'lost' && d.stage !== 'completed'
    );
    const previousActiveDeals = previousDeals.filter(
      (d) => d.stage !== 'lost' && d.stage !== 'completed'
    );

    // Task metrics
    const completedTasks = currentTasks.filter((t) => t.status === 'completed');
    const previousCompletedTasks = previousTasks.filter((t) => t.status === 'completed');

    return {
      // Pipeline metrics
      pipelineValue: currentDealMetrics.totalValue,
      pipelineValueTrend: calculateTrend(
        currentDealMetrics.totalValue,
        previousDealMetrics.totalValue
      ),
      weightedPipeline: currentDealMetrics.weightedValue,
      weightedPipelineTrend: calculateTrend(
        currentDealMetrics.weightedValue,
        previousDealMetrics.weightedValue
      ),

      // Deal metrics
      dealCount: currentDealMetrics.dealCount,
      dealCountTrend: calculateTrend(
        currentDealMetrics.dealCount,
        previousDealMetrics.dealCount
      ),
      avgDealSize: currentDealMetrics.avgDealSize,
      avgDealSizeTrend: calculateTrend(
        currentDealMetrics.avgDealSize,
        previousDealMetrics.avgDealSize
      ),
      winRate: currentDealMetrics.winRate,
      winRateTrend: calculateTrend(
        currentDealMetrics.winRate,
        previousDealMetrics.winRate
      ),
      activeDeals: activeDeals.length,
      activeDealsTrend: calculateTrend(
        activeDeals.length,
        previousActiveDeals.length
      ),

      // Quote metrics
      quoteCount: currentQuoteCount,
      quoteCountTrend: calculateTrend(currentQuoteCount, previousQuoteCount),
      quoteValue: currentQuoteValue,
      quoteValueTrend: calculateTrend(currentQuoteValue, previousQuoteValue),

      // Activity metrics
      activityCount: currentActivities.length,
      activityCountTrend: calculateTrend(
        currentActivities.length,
        previousActivities.length
      ),

      // Task metrics
      taskCount: currentTasks.length,
      taskCountTrend: calculateTrend(
        currentTasks.length,
        previousTasks.length
      ),
      completedTaskCount: completedTasks.length,
      completedTaskCountTrend: calculateTrend(
        completedTasks.length,
        previousCompletedTasks.length
      ),
    };
  }, [deals, quotations, activities, tasks, dateRange]);

  // Chart data
  const chartData = useMemo(() => {
    if (!deals || !quotations || !activities || !tasks) {
      return null;
    }

    const filteredDeals = filterByDateRange(deals, 'created_at', dateRange);
    const filteredQuotes = filterByDateRange(quotations, 'created_at', dateRange);
    const filteredActivities = filterByDateRange(activities, 'created_at', dateRange);

    return {
      // Deal pipeline over time
      dealTimeSeries: generateTimeSeriesData(
        filteredDeals,
        'created_at',
        'estimated_value',
        dateRange,
        'day'
      ),

      // Deals by stage
      dealsByStage: generateCategoricalData(filteredDeals, 'stage'),

      // Quotes by status
      quotesByStatus: generateCategoricalData(filteredQuotes, 'status'),

      // Activities by type
      activitiesByType: generateCategoricalData(filteredActivities, 'activity_type'),

      // Top suppliers by deal value
      topSuppliers: generateCategoricalData(
        filteredDeals.filter((d) => d.supplier),
        'supplier_id',
        'estimated_value'
      )
        .slice(0, 10)
        .map((item) => {
          const deal = filteredDeals.find((d) => d.supplier_id === item.category);
          return {
            ...item,
            category: deal?.supplier?.name || 'Unknown',
          };
        }),
    };
  }, [deals, quotations, activities, tasks, dateRange]);

  return {
    metrics,
    chartData,
    isLoading:
      dealsLoading || quotationsLoading || activitiesLoading || tasksLoading,
  };
}
