import React from 'react';
import { DollarSign, FileText, Briefcase, TrendingUp, Plus, CheckCircle2 } from 'lucide-react';
import { KPICard } from '../KPICard';
import { Timeline } from '../Timeline';

export const DashboardMobile: React.FC = () => {
  const stats = [
    { label: 'Revenue', value: '$2.4M', change: '+12%', color: '#2563EB' },
    { label: 'Projects', value: '24', change: '+8%', color: '#10B981' },
    { label: 'Documents', value: '156', change: '+15%', color: '#F59E0B' },
    { label: 'Pipeline', value: '$8.2M', change: '+23%', color: '#8B5CF6' },
  ];

  const activities = [
    {
      id: '1',
      title: 'Contract signed',
      description: 'BuildCo supplier agreement',
      time: '2h ago',
      type: 'success' as const,
    },
    {
      id: '2',
      title: 'Document uploaded',
      description: 'Blueprint_Final_v3.pdf',
      time: '4h ago',
      type: 'info' as const,
    },
    {
      id: '3',
      title: 'Deal updated',
      description: 'Downtown Complex - $1.2M',
      time: '5h ago',
      type: 'default' as const,
    },
  ];

  const tasks = [
    { id: 1, text: 'Review contract terms', done: false, due: 'Today' },
    { id: 2, text: 'Call supplier about delivery', done: false, due: 'Tomorrow' },
    { id: 3, text: 'Update project timeline', done: true, due: 'Yesterday' },
  ];

  return (
    <div className="pb-20">
      {/* Quick Stats */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280] mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-[#111827] mb-1">{stat.value}</p>
              <p className="text-xs font-medium" style={{ color: stat.color }}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Recent Activity</h2>
          <button className="text-sm text-[#2563EB] font-medium">View All</button>
        </div>
        <Timeline items={activities} />
      </div>

      {/* Today's Tasks */}
      <div className="bg-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Today's Tasks</h2>
          <span className="text-sm text-[#6B7280]">{tasks.filter(t => !t.done).length} pending</span>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 bg-[#F9FAFB] rounded-lg">
              <input
                type="checkbox"
                checked={task.done}
                className="mt-1 w-5 h-5 rounded border-[#D1D5DB] text-[#2563EB]"
                readOnly
              />
              <div className="flex-1">
                <p className={`text-sm ${task.done ? 'line-through text-[#9CA3AF]' : 'text-[#111827]'}`}>
                  {task.text}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Due: {task.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-lg flex items-center justify-center z-40">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
