import React from 'react';
import { Filter, Plus, DollarSign } from 'lucide-react';
import { Button } from '../Button';
import { DealCard } from '../Card';
import { Badge } from '../Badge';

export const DealsDesktop: React.FC = () => {
  const pipelineData = [
    {
      title: 'Lead',
      count: 8,
      value: '$2.1M',
      deals: [
        { company: 'Metro Plaza Development', value: '$450K', probability: 30, contact: 'John Smith', nextAction: 'Send proposal by Jan 18' },
        { company: 'Harbor View Residences', value: '$680K', probability: 25, contact: 'Sarah Lee', nextAction: 'Schedule discovery call' },
        { company: 'Central Park Towers', value: '$520K', probability: 20, contact: 'Mark Johnson', nextAction: 'Research requirements' },
      ],
    },
    {
      title: 'Qualified',
      count: 5,
      value: '$3.2M',
      deals: [
        { company: 'Park Avenue Commercial', value: '$820K', probability: 50, contact: 'Mike Chen', nextAction: 'Schedule site visit' },
        { company: 'Lakeside Complex', value: '$1.1M', probability: 45, contact: 'Anna Davis', nextAction: 'Send detailed quote' },
      ],
    },
    {
      title: 'Proposal',
      count: 6,
      value: '$4.8M',
      deals: [
        { company: 'Downtown Office Complex', value: '$1.2M', probability: 65, contact: 'Emily Brown', nextAction: 'Follow up on proposal' },
        { company: 'Riverside Tower', value: '$950K', probability: 60, contact: 'David Park', nextAction: 'Revise pricing' },
        { company: 'Tech Hub Campus', value: '$1.5M', probability: 55, contact: 'Rachel Green', nextAction: 'Present to board' },
      ],
    },
    {
      title: 'Negotiation',
      count: 4,
      value: '$5.6M',
      deals: [
        { company: 'Silicon Valley Campus', value: '$2.1M', probability: 80, contact: 'Lisa Wang', nextAction: 'Contract review meeting' },
        { company: 'Medical Center West', value: '$1.8M', probability: 75, contact: 'Dr. James Wilson', nextAction: 'Final terms discussion' },
      ],
    },
    {
      title: 'Closed Won',
      count: 3,
      value: '$4.2M',
      deals: [
        { company: 'Green Building Initiative', value: '$1.5M', probability: 100, contact: 'Tom Wilson', nextAction: 'Kickoff meeting Jan 20' },
        { company: 'Urban Renewal Project', value: '$1.2M', probability: 100, contact: 'Sandra Martinez', nextAction: 'Resource allocation' },
      ],
    },
  ];

  const totalValue = pipelineData.reduce((sum, stage) => {
    return sum + parseFloat(stage.value.replace('$', '').replace('M', ''));
  }, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 text-[#111827] mb-2">Deal Pipeline</h1>
            <p className="text-sm text-[#6B7280]">
              Track and manage your sales opportunities
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="h-5 w-5" />}
          >
            New Deal
          </Button>
        </div>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
          <div className="grid grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm text-[#6B7280] mb-1">Total Pipeline</p>
              <p className="text-2xl font-bold text-[#111827]">${totalValue.toFixed(1)}M</p>
            </div>
            {pipelineData.map((stage, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-[#6B7280] mb-1">{stage.title}</p>
                <p className="text-xl font-bold text-[#2563EB]">{stage.value}</p>
                <p className="text-xs text-[#9CA3AF]">{stage.count} deals</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>
            Status
          </Button>
          <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>
            Value Range
          </Button>
          <Button variant="secondary" size="md" icon={<Filter className="h-4 w-4" />}>
            Owner
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-[#6B7280]">
            Showing <span className="font-semibold text-[#111827]">{pipelineData.reduce((sum, s) => sum + s.count, 0)}</span> deals
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineData.map((stage, index) => (
          <div key={index} className="flex-shrink-0 w-[320px]">
            {/* Column Header */}
            <div className="bg-[#F9FAFB] rounded-t-lg px-4 py-3 border border-[#E5E7EB] border-b-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#111827]">{stage.title}</h3>
                <Badge variant="default">{stage.count}</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4 text-[#6B7280]" />
                <span className="font-bold text-[#2563EB]">{stage.value}</span>
              </div>
            </div>

            {/* Column Content */}
            <div className="bg-[#F9FAFB] rounded-b-lg p-3 border border-[#E5E7EB] border-t-0 min-h-[600px] space-y-3">
              {stage.deals.map((deal, dealIndex) => (
                <DealCard key={dealIndex} {...deal} />
              ))}
              
              <button className="w-full py-3 border-2 border-dashed border-[#D1D5DB] rounded-lg text-sm text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#374151] hover:bg-white transition-all">
                + Add Deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
