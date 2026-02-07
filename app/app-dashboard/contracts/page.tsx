/**
 * PRODUCTION PAGE: Contracts List
 * Module A - Minimal Stub
 *
 * A minimal working contracts page without sandbox-only components.
 */

import { createClient } from '@/lib/supabase/server';

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  status: string;
  total_value?: number;
  currency: string;
  created_at: string;
}

export default async function ContractsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Unauthorized. Please log in.</div>
      </div>
    );
  }

  // Fetch contracts
  const { data: contracts, error } = await supabase
    .from('sandbox_contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading contracts: {error.message}</div>
      </div>
    );
  }

  const contractList = contracts as Contract[] || [];

  // Calculate stats
  const totalCount = contractList.length;
  const draftCount = contractList.filter(c => c.status === 'draft').length;
  const pendingCount = contractList.filter(c => c.status === 'pending_approval').length;
  const activeCount = contractList.filter(c => c.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Contracts</h1>
        <p className="text-gray-600 mt-1">
          Manage contracts with approval workflows
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="text-sm text-gray-600">Total Contracts</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-2xl font-bold">{draftCount}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-2xl font-bold">{activeCount}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="border rounded-lg bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">All Contracts</h2>
        </div>
        <div className="p-4">
          {contractList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No contracts yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Use the API at /api/contracts to create contracts
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contractList.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-500">
                        {contract.contract_number}
                      </span>
                      <span className="font-medium">{contract.title}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {contract.status}
                      </span>
                    </div>
                    {contract.total_value && (
                      <div className="text-sm text-gray-600 mt-1">
                        Value: {contract.currency} {contract.total_value.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
