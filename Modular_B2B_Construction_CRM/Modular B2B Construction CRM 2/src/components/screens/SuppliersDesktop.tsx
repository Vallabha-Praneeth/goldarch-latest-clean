import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { DataTable, DataTableFilters, EmptyState } from '../DataTable';
import { StatusBadge } from '../Badge';
import { Button } from '../Button';

export const SuppliersDesktop: React.FC = () => {
  const [showEmpty, setShowEmpty] = useState(false);

  const columns = [
    {
      key: 'name',
      label: 'Supplier Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#4B5563]" />
          </div>
          <div>
            <p className="font-semibold text-[#111827]">{value}</p>
            <p className="text-xs text-[#6B7280]">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
    },
    {
      key: 'contact',
      label: 'Contact',
      sortable: false,
      render: (value: string, row: any) => (
        <div>
          <p className="text-[#111827]">{value}</p>
          <p className="text-xs text-[#6B7280]">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <span className="text-[#F59E0B]">★</span>
          <span className="font-medium text-[#111827]">{value}</span>
          <span className="text-xs text-[#9CA3AF]">/5.0</span>
        </div>
      ),
    },
    {
      key: 'projects',
      label: 'Projects',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-[#111827]">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const data = [
    {
      name: 'BuildCo Materials Inc.',
      category: 'Construction Materials',
      location: 'San Francisco, CA',
      contact: 'John Smith',
      email: 'john@buildco.com',
      rating: 4.8,
      projects: 12,
      status: 'Active',
    },
    {
      name: 'Concrete Solutions LLC',
      category: 'Concrete & Cement',
      location: 'Oakland, CA',
      contact: 'Sarah Johnson',
      email: 'sarah@concretesolutions.com',
      rating: 4.5,
      projects: 8,
      status: 'Active',
    },
    {
      name: 'Steel & Iron Works',
      category: 'Steel Fabrication',
      location: 'San Jose, CA',
      contact: 'Mike Chen',
      email: 'mike@steelworks.com',
      rating: 4.9,
      projects: 15,
      status: 'Active',
    },
    {
      name: 'Elite Electrical Systems',
      category: 'Electrical',
      location: 'Berkeley, CA',
      contact: 'Emily Brown',
      email: 'emily@eliteelectrical.com',
      rating: 4.7,
      projects: 10,
      status: 'Active',
    },
    {
      name: 'Premium Plumbing Co.',
      category: 'Plumbing',
      location: 'Palo Alto, CA',
      contact: 'David Lee',
      email: 'david@premiumplumbing.com',
      rating: 4.6,
      projects: 9,
      status: 'Pending',
    },
    {
      name: 'Bay Area HVAC',
      category: 'HVAC Systems',
      location: 'San Mateo, CA',
      contact: 'Lisa Wang',
      email: 'lisa@bayareahvac.com',
      rating: 4.4,
      projects: 7,
      status: 'Active',
    },
    {
      name: 'Eco Insulation Experts',
      category: 'Insulation',
      location: 'Fremont, CA',
      contact: 'Tom Wilson',
      email: 'tom@ecoinsulation.com',
      rating: 4.3,
      projects: 5,
      status: 'Inactive',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 text-[#111827] mb-2">Suppliers</h1>
            <p className="text-sm text-[#6B7280]">
              Manage your supplier relationships and track performance
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="h-5 w-5" />}
          >
            Add Supplier
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm text-[#6B7280] mb-1">Total Suppliers</p>
            <p className="text-2xl font-bold text-[#111827]">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm text-[#6B7280] mb-1">Active</p>
            <p className="text-2xl font-bold text-[#10B981]">
              {data.filter(s => s.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm text-[#6B7280] mb-1">Avg Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#111827]">4.6</span>
              <span className="text-[#F59E0B] text-xl">★</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm text-[#6B7280] mb-1">Total Projects</p>
            <p className="text-2xl font-bold text-[#111827]">
              {data.reduce((sum, s) => sum + s.projects, 0)}
            </p>
          </div>
        </div>

        {/* Toggle Empty State for Demo */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmpty(!showEmpty)}
          >
            {showEmpty ? 'Show Data' : 'Show Empty State'}
          </Button>
        </div>

        {/* Filters */}
        <DataTableFilters onExport={() => console.log('Export')} />
      </div>

      {/* Table or Empty State */}
      {showEmpty ? (
        <div className="bg-white rounded-lg border border-[#E5E7EB] py-16">
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-[#9CA3AF]" />}
            title="No suppliers found"
            description="Get started by adding your first supplier to track materials and services for your projects."
            action={
              <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
                Add Supplier
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            selectable
            onRowClick={(row) => console.log('Clicked:', row)}
          />
        </div>
      )}
    </div>
  );
};
