import React from 'react';
import { DollarSign, FileText, Briefcase, TrendingUp, Plus } from 'lucide-react';
import { KPICard } from '../KPICard';
import { Timeline } from '../Timeline';
import { DealCard } from '../Card';
import { Button } from '../Button';

export const DashboardDesktop: React.FC = () => {
  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$2.4M',
      change: 12.5,
      changeLabel: 'vs last month',
      icon: <DollarSign className="h-6 w-6" />,
      iconColor: '#2563EB',
    },
    {
      title: 'Active Projects',
      value: '24',
      change: 8.2,
      changeLabel: '3 new this week',
      icon: <Briefcase className="h-6 w-6" />,
      iconColor: '#10B981',
    },
    {
      title: 'Documents',
      value: '156',
      change: 15.3,
      changeLabel: '12 added today',
      icon: <FileText className="h-6 w-6" />,
      iconColor: '#F59E0B',
    },
    {
      title: 'Pipeline Value',
      value: '$8.2M',
      change: 23.1,
      changeLabel: '15 active deals',
      icon: <TrendingUp className="h-6 w-6" />,
      iconColor: '#8B5CF6',
    },
  ];

  const timelineData = [
    {
      id: '1',
      title: 'Contract signed with BuildCo',
      description: 'New supplier contract finalized for Q1 2026',
      time: '2 hours ago',
      type: 'success' as const,
    },
    {
      id: '2',
      title: 'Document uploaded',
      description: 'Blueprint_Final_v3.pdf processed by AI',
      time: '4 hours ago',
      type: 'info' as const,
    },
    {
      id: '3',
      title: 'Deal moved to negotiation',
      description: 'Downtown Office Complex - $1.2M',
      time: '5 hours ago',
      type: 'default' as const,
    },
    {
      id: '4',
      title: 'Payment overdue',
      description: 'Invoice #1234 from Concrete Solutions',
      time: '1 day ago',
      type: 'warning' as const,
    },
  ];

  const pipelineColumns = [
    { title: 'Lead', count: 5, deals: [
      { company: 'Metro Plaza', value: '$450K', probability: 30, contact: 'John Smith', nextAction: 'Send proposal' },
      { company: 'Harbor View', value: '$680K', probability: 25, contact: 'Sarah Lee', nextAction: 'Schedule call' },
    ]},
    { title: 'Qualified', count: 4, deals: [
      { company: 'Park Avenue', value: '$820K', probability: 50, contact: 'Mike Chen', nextAction: 'Site visit' },
    ]},
    { title: 'Proposal', count: 6, deals: [
      { company: 'Downtown Complex', value: '$1.2M', probability: 65, contact: 'Emily Brown', nextAction: 'Follow up' },
      { company: 'Riverside Tower', value: '$950K', probability: 60, contact: 'David Park', nextAction: 'Revise quote' },
    ]},
    { title: 'Negotiation', count: 3, deals: [
      { company: 'Tech Campus', value: '$2.1M', probability: 80, contact: 'Lisa Wang', nextAction: 'Contract review' },
    ]},
    { title: 'Closed Won', count: 2, deals: [
      { company: 'Green Building', value: '$1.5M', probability: 100, contact: 'Tom Wilson', nextAction: 'Kickoff meeting' },
    ]},
  ];

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <div className="col-span-2 bg-white rounded-lg border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h3 text-[#111827]">Recent Activity</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <Timeline items={timelineData} />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-h3 text-[#111827] mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button variant="primary" size="lg" icon={<Plus className="h-5 w-5" />} className="w-full">
              New Deal
            </Button>
            <Button variant="secondary" size="lg" icon={<FileText className="h-5 w-5" />} className="w-full">
              Upload Document
            </Button>
            <Button variant="secondary" size="lg" icon={<Briefcase className="h-5 w-5" />} className="w-full">
              Add Project
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[#D1D5DB] text-[#2563EB]" />
                <div className="flex-1">
                  <p className="text-sm text-[#111827]">Review contract terms</p>
                  <p className="text-xs text-[#9CA3AF]">Due today</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[#D1D5DB] text-[#2563EB]" />
                <div className="flex-1">
                  <p className="text-sm text-[#111827]">Call supplier about delivery</p>
                  <p className="text-xs text-[#9CA3AF]">Due tomorrow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Pipeline */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h3 text-[#111827]">Deal Pipeline</h2>
          <div className="text-sm text-[#6B7280]">
            Total value: <span className="font-bold text-[#111827]">$8.2M</span>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {pipelineColumns.map((column, index) => (
            <div key={index} className="flex-shrink-0 w-[280px]">
              <div className="bg-[#F9FAFB] rounded-t-lg px-4 py-3 border border-[#E5E7EB] border-b-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#111827]">{column.title}</h3>
                  <span className="bg-[#E5E7EB] text-[#374151] px-2 py-0.5 rounded-full text-xs font-medium">
                    {column.count}
                  </span>
                </div>
              </div>
              <div className="bg-[#F9FAFB] rounded-b-lg p-2 border border-[#E5E7EB] border-t-0 min-h-[200px]">
                {column.deals.map((deal, dealIndex) => (
                  <DealCard key={dealIndex} {...deal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
