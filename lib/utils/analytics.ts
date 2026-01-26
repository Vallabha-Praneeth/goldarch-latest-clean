/**
 * Analytics Utility Functions
 * Helper functions for data aggregation, trend calculation, and chart data transformation
 */

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimePeriod = '7d' | '30d' | '90d' | 'ytd' | 'all' | 'custom';

export type TrendData = {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isIncrease: boolean;
};

/**
 * Get date range based on time period
 */
export function getDateRangeFromPeriod(period: TimePeriod, customRange?: DateRange): DateRange {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from = new Date();

  switch (period) {
    case '7d':
      from = new Date(to);
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from = new Date(to);
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from = new Date(to);
      from.setDate(from.getDate() - 90);
      break;
    case 'ytd':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customRange) {
        return customRange;
      }
      // fallback to 30d
      from = new Date(to);
      from.setDate(from.getDate() - 30);
      break;
    case 'all':
      from = new Date(2020, 0, 1); // arbitrary start date
      break;
  }

  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(dateRange: DateRange): DateRange {
  const duration = dateRange.to.getTime() - dateRange.from.getTime();
  const from = new Date(dateRange.from.getTime() - duration);
  const to = new Date(dateRange.to.getTime() - duration);
  return { from, to };
}

/**
 * Calculate trend between current and previous values
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous;
  const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : ((change / previous) * 100);

  return {
    current,
    previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
    isIncrease: change >= 0,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with compact notation
 */
export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
  }
  return value.toLocaleString('en-US');
}

/**
 * Group data by date period (day, week, month, quarter, year)
 */
export type GroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';

export function groupByPeriod<T>(
  data: T[],
  dateField: keyof T,
  groupBy: GroupBy = 'day'
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  data.forEach((item) => {
    const date = new Date(item[dateField] as any);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = `${date.getFullYear()}`;
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(converted: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((converted / total) * 1000) / 10; // Round to 1 decimal
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate median
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T>(
  data: T[],
  dateField: keyof T,
  dateRange: DateRange
): T[] {
  return data.filter((item) => {
    const date = new Date(item[dateField] as any);
    return date >= dateRange.from && date <= dateRange.to;
  });
}

/**
 * Generate chart data for time series
 */
export function generateTimeSeriesData<T>(
  data: T[],
  dateField: keyof T,
  valueField: keyof T,
  dateRange: DateRange,
  groupBy: GroupBy = 'day'
): Array<{ date: string; value: number }> {
  const filteredData = filterByDateRange(data, dateField, dateRange);
  const grouped = groupByPeriod(filteredData, dateField, groupBy);

  const result: Array<{ date: string; value: number }> = [];

  grouped.forEach((items, date) => {
    const value = items.reduce((sum, item) => {
      const val = item[valueField];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    result.push({ date, value });
  });

  // Sort by date
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

/**
 * Generate chart data for categorical grouping
 */
export function generateCategoricalData<T>(
  data: T[],
  categoryField: keyof T,
  valueField?: keyof T
): Array<{ category: string; value: number }> {
  const grouped = new Map<string, T[]>();

  data.forEach((item) => {
    const category = String(item[categoryField]);
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(item);
  });

  const result: Array<{ category: string; value: number }> = [];

  grouped.forEach((items, category) => {
    let value: number;

    if (valueField) {
      value = items.reduce((sum, item) => {
        const val = item[valueField];
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    } else {
      value = items.length;
    }

    result.push({ category, value });
  });

  // Sort by value descending
  result.sort((a, b) => b.value - a.value);

  return result;
}

/**
 * Calculate deal pipeline metrics
 */
export type DealMetrics = {
  totalValue: number;
  weightedValue: number;
  avgDealSize: number;
  dealCount: number;
  winRate: number;
  avgCycleTime: number;
};

export function calculateDealMetrics(deals: any[]): DealMetrics {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.estimated_value || 0), 0);
  const weightedValue = deals.reduce((sum, deal) => {
    const value = deal.estimated_value || 0;
    const probability = deal.probability || 0;
    return sum + (value * probability / 100);
  }, 0);

  const dealCount = deals.length;
  const avgDealSize = dealCount > 0 ? totalValue / dealCount : 0;

  const wonDeals = deals.filter(d => d.is_won === true);
  const closedDeals = deals.filter(d => d.is_won !== null);
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;

  // Calculate average cycle time
  const dealsWithDates = deals.filter(d => d.created_at && d.expected_close_date);
  const cycleTimes = dealsWithDates.map(d => {
    const start = new Date(d.created_at);
    const end = new Date(d.expected_close_date);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
  });
  const avgCycleTime = cycleTimes.length > 0 ? calculateAverage(cycleTimes) : 0;

  return {
    totalValue: Math.round(totalValue),
    weightedValue: Math.round(weightedValue),
    avgDealSize: Math.round(avgDealSize),
    dealCount,
    winRate: Math.round(winRate * 10) / 10,
    avgCycleTime: Math.round(avgCycleTime),
  };
}

/**
 * Format date for display
 */
export function formatChartDate(dateStr: string, groupBy: GroupBy = 'day'): string {
  const date = new Date(dateStr);

  switch (groupBy) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    case 'quarter':
      return dateStr; // Already formatted as YYYY-QX
    case 'year':
      return dateStr;
    default:
      return dateStr;
  }
}
