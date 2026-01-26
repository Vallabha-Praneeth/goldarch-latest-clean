'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Target, Activity as ActivityIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ChartCard } from '@/components/analytics/ChartCard';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import { useAnalyticsData } from '@/lib/hooks/use-analytics-data';
import { DateRange, TimePeriod, getDateRangeFromPeriod, formatCurrency, formatPercent } from '@/lib/utils/analytics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPeriod('30d'));
  const [period, setPeriod] = useState<TimePeriod>('30d');

  const { metrics, chartData, isLoading } = useAnalyticsData(dateRange);

  const handleDateRangeChange = (newRange: DateRange, newPeriod: TimePeriod) => {
    setDateRange(newRange);
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground">Business performance insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(metrics?.pipelineValue || 0, true)}
          icon={DollarSign}
          trend={{
            value: metrics?.pipelineValueTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
        <MetricCard
          title="Active Deals"
          value={metrics?.activeDeals || 0}
          icon={Target}
          trend={{
            value: metrics?.activeDealsTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(metrics?.winRate || 0)}
          icon={TrendingUp}
          trend={{
            value: metrics?.winRateTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(metrics?.avgDealSize || 0, true)}
          icon={DollarSign}
          trend={{
            value: metrics?.avgDealSizeTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal Pipeline Trend */}
        <ChartCard
          title="Pipeline Trend"
          description="Deal value over time"
          loading={isLoading}
        >
          {chartData?.dealTimeSeries && chartData.dealTimeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.dealTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  className="text-xs"
                  tickFormatter={(value) => formatCurrency(value, true)}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for this period
            </div>
          )}
        </ChartCard>

        {/* Deals by Stage */}
        <ChartCard
          title="Deals by Stage"
          description="Distribution across pipeline stages"
          loading={isLoading}
        >
          {chartData?.dealsByStage && chartData.dealsByStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="category"
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartData.dealsByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for this period
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quote Status Distribution */}
        <ChartCard
          title="Quote Status"
          description="Quotes by status"
          loading={isLoading}
        >
          {chartData?.quotesByStatus && chartData.quotesByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.quotesByStatus}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.quotesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No quotes in this period
            </div>
          )}
        </ChartCard>

        {/* Activity by Type */}
        <ChartCard
          title="Activity Volume"
          description="Activities by type"
          loading={isLoading}
        >
          {chartData?.activitiesByType && chartData.activitiesByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.activitiesByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis
                  type="category"
                  dataKey="category"
                  className="text-xs"
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No activities in this period
            </div>
          )}
        </ChartCard>

        {/* Task Metrics */}
        <ChartCard
          title="Task Metrics"
          description="Task completion overview"
          loading={isLoading}
        >
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Tasks</span>
              <span className="text-2xl font-bold">{metrics?.taskCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed</span>
              <span className="text-2xl font-bold text-emerald-600">
                {metrics?.completedTaskCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-2xl font-bold">
                {metrics?.taskCount
                  ? formatPercent((metrics.completedTaskCount / metrics.taskCount) * 100, 0)
                  : '0%'
                }
              </span>
            </div>
            {metrics?.completedTaskCountTrend && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">vs previous period</span>
                  <span className={
                    metrics.completedTaskCountTrend.changePercent >= 0
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }>
                    {metrics.completedTaskCountTrend.changePercent >= 0 ? '+' : ''}
                    {formatPercent(metrics.completedTaskCountTrend.changePercent, 1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Top Suppliers */}
      {chartData?.topSuppliers && chartData.topSuppliers.length > 0 && (
        <ChartCard
          title="Top Performing Suppliers"
          description="By deal value"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topSuppliers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <YAxis
                type="category"
                dataKey="category"
                className="text-xs"
                width={150}
              />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Deal Value']} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Quotes"
          value={metrics?.quoteCount || 0}
          icon={ActivityIcon}
          trend={{
            value: metrics?.quoteCountTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
        <MetricCard
          title="Quote Value"
          value={formatCurrency(metrics?.quoteValue || 0, true)}
          icon={DollarSign}
          trend={{
            value: metrics?.quoteValueTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
        <MetricCard
          title="Activities Logged"
          value={metrics?.activityCount || 0}
          icon={CheckCircle2}
          trend={{
            value: metrics?.activityCountTrend.changePercent || 0,
            label: 'vs previous period',
          }}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
