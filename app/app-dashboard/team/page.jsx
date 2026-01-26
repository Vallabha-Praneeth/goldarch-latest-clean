'use client';

/**
 * Team Management Page
 */

import { useState } from 'react';
import {
  useTeamData,
  useInviteUser,
  useUpdateUserRole,
  useDeleteUser,
  useUserAccessRules,
  useCreateAccessRule,
  useDeleteAccessRule,
  useCategories
} from '../../../lib/hooks/use-team-data';
import { useAuth } from '../../../lib/auth-provider';

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Manager', notes: '' });
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({ role: '', notes: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAccessRulesModal, setShowAccessRulesModal] = useState(false);
  const [accessRulesUser, setAccessRulesUser] = useState(null);
  const [newAccessRule, setNewAccessRule] = useState({
    categories: [],
    regions: [],
    specificSuppliers: [],
    priceMin: '',
    priceMax: '',
    notes: ''
  });
  const [alert, setAlert] = useState(null);

  // Available filter options
  const availableCategories = [
    'Cabinets', 'Countertops', 'Flooring', 'Lighting',
    'Plumbing', 'Hardware', 'Appliances', 'Windows', 'Doors'
  ];

  const availableRegions = [
    'China', 'USA', 'Europe', 'India', 'Vietnam',
    'Mexico', 'Canada', 'Southeast Asia', 'Middle East'
  ];

  // Get current user
  const { user: currentUser } = useAuth();

  // Fetch team data
  const { data: users, isLoading, error } = useTeamData({
    search,
    roleFilter: roleFilter || undefined,
  });

  // Fetch categories for dropdown
  const { data: categories } = useCategories();

  // Fetch access rules for selected user
  const { data: accessRules, isLoading: accessRulesLoading } = useUserAccessRules(accessRulesUser?.id);

  // Mutations
  const inviteUser = useInviteUser();
  const updateUserRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const createAccessRule = useCreateAccessRule();
  const deleteAccessRule = useDeleteAccessRule();

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    try {
      await inviteUser.mutateAsync(inviteForm);
      setAlert({ type: 'success', message: `Invitation sent to ${inviteForm.email}` });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'Manager', notes: '' });

      // Clear alert after 5 seconds
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    setEditRoleForm({ role: user.role || 'Manager', notes: '' });
    setShowEditRoleModal(true);
  };

  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateUserRole.mutateAsync({
        userId: editingUser.id,
        newRole: editRoleForm.role,
        notes: editRoleForm.notes,
      });
      setAlert({ type: 'success', message: `Role updated to ${editRoleForm.role} for ${editingUser.email}` });
      setShowEditRoleModal(false);
      setEditingUser(null);
      setEditRoleForm({ role: '', notes: '' });

      // Clear alert after 5 seconds
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync(userToDelete.id);
      setAlert({ type: 'success', message: `User ${userToDelete.email} has been removed` });
      setShowDeleteConfirm(false);
      setUserToDelete(null);

      // Clear alert after 5 seconds
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
      setShowDeleteConfirm(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleManageAccess = (user) => {
    setAccessRulesUser(user);
    setShowAccessRulesModal(true);
  };

  const toggleCategory = (category) => {
    setNewAccessRule(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleRegion = (region) => {
    setNewAccessRule(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }));
  };

  const handleAddAccessRule = async (e) => {
    e.preventDefault();

    // Validate at least one filter is set
    const hasFilters = newAccessRule.categories.length > 0 ||
                       newAccessRule.regions.length > 0 ||
                       newAccessRule.priceMin ||
                       newAccessRule.priceMax;

    if (!hasFilters) {
      setAlert({ type: 'error', message: 'Please set at least one access filter (category, region, or price)' });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    try {
      // Create rule data object
      const ruleData = {
        categories: newAccessRule.categories,
        regions: newAccessRule.regions,
        priceMin: newAccessRule.priceMin || null,
        priceMax: newAccessRule.priceMax || null,
      };

      await createAccessRule.mutateAsync({
        userId: accessRulesUser.id,
        ruleData: ruleData, // Store as JSONB
        categoryId: null, // Legacy field, keep null
        region: null, // Legacy field, keep null
        notes: newAccessRule.notes || `Categories: [${newAccessRule.categories.join(', ')}], Regions: [${newAccessRule.regions.join(', ')}]`,
      });

      setAlert({ type: 'success', message: 'Access rule added successfully' });
      setNewAccessRule({
        categories: [],
        regions: [],
        specificSuppliers: [],
        priceMin: '',
        priceMax: '',
        notes: ''
      });

      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDeleteAccessRule = async (ruleId) => {
    try {
      await deleteAccessRule.mutateAsync(ruleId);
      setAlert({ type: 'success', message: 'Access rule removed' });
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with Invite Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Invite User
        </button>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`mb-4 p-4 rounded-lg ${
          alert.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Viewer">Viewer</option>
          <option value="Procurement">Procurement</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-bold mb-2">Error loading users</p>
            <p className="text-sm text-gray-600">{error.message}</p>
          </div>
        ) : users?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role ? (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'Viewer' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.role}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">No role</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.role_assigned_at ? new Date(user.role_assigned_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditRole(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleManageAccess(user)}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Manage Access
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold text-red-600">{users?.filter(u => u.role === 'Admin').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600">Managers</p>
          <p className="text-2xl font-bold text-blue-600">{users?.filter(u => u.role === 'Manager').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600">No Role</p>
          <p className="text-2xl font-bold text-gray-600">{users?.filter(u => !u.role).length || 0}</p>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite New User</h2>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pre-Assign Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Procurement">Procurement</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={inviteForm.notes}
                    onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                    placeholder="Add any notes about this user..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteForm({ email: '', role: 'Manager', notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteUser.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300"
                  >
                    {inviteUser.isPending ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit User Role</h2>
              <p className="text-sm text-gray-600 mb-4">
                Editing role for: <span className="font-medium text-gray-900">{editingUser.email}</span>
              </p>

              <form onSubmit={handleEditRoleSubmit} className="space-y-4">
                {/* Current Role Display */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Current Role</p>
                  {editingUser.role ? (
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      editingUser.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      editingUser.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                      editingUser.role === 'Viewer' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {editingUser.role}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No role assigned</span>
                  )}
                </div>

                {/* New Role Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Role
                  </label>
                  <select
                    value={editRoleForm.role}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Procurement">Procurement</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={editRoleForm.notes}
                    onChange={(e) => setEditRoleForm({ ...editRoleForm, notes: e.target.value })}
                    placeholder="Reason for role change..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRoleModal(false);
                      setEditingUser(null);
                      setEditRoleForm({ role: '', notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserRole.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300"
                  >
                    {updateUserRole.isPending ? 'Updating...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Access Rules Modal */}
      {showAccessRulesModal && accessRulesUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Supplier Access</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    User: <span className="font-medium text-gray-900">{accessRulesUser.email}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAccessRulesModal(false);
                    setAccessRulesUser(null);
                    setNewAccessRule({
                      categories: [],
                      regions: [],
                      specificSuppliers: [],
                      priceMin: '',
                      priceMax: '',
                      notes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Existing Access Rules */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Access Rules</h3>
                {accessRulesLoading ? (
                  <p className="text-gray-600 text-sm">Loading access rules...</p>
                ) : accessRules && accessRules.length > 0 ? (
                  <div className="space-y-3">
                    {accessRules.map((rule) => {
                      // Check for rule_data (new format) or parse from category_id (old format)
                      let parsedRule = null;

                      if (rule.rule_data) {
                        // New JSONB format
                        parsedRule = rule.rule_data;
                      } else {
                        // Try parsing from category_id (legacy)
                        try {
                          if (rule.category_id && typeof rule.category_id === 'string' && rule.category_id.startsWith('{')) {
                            parsedRule = JSON.parse(rule.category_id);
                          }
                        } catch (e) {
                          // Old format, keep as is
                        }
                      }

                      return (
                        <div key={rule.id} className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              {parsedRule ? (
                                // New comprehensive format
                                <div className="space-y-2">
                                  {parsedRule.categories && parsedRule.categories.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Allowed Categories:</p>
                                      <div className="flex gap-1 flex-wrap">
                                        {parsedRule.categories.map((cat) => (
                                          <span key={cat} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {cat}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {parsedRule.regions && parsedRule.regions.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Allowed Regions:</p>
                                      <div className="flex gap-1 flex-wrap">
                                        {parsedRule.regions.map((reg) => (
                                          <span key={reg} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                            {reg}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(parsedRule.priceMin || parsedRule.priceMax) && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Price Range:</p>
                                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                        ${parsedRule.priceMin || '0'} - ${parsedRule.priceMax || '∞'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Old simple format
                                <div className="flex gap-2 flex-wrap">
                                  {rule.category_id && (
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                      Category: {rule.category_id}
                                    </span>
                                  )}
                                  {rule.region && !rule.region.startsWith('MULTI:') && (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                      Region: {rule.region}
                                    </span>
                                  )}
                                </div>
                              )}
                              {rule.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">{rule.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteAccessRule(rule.id)}
                              className="ml-3 px-3 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200 text-center">
                    <p className="text-sm font-medium text-yellow-800">⚠️ No access rules set</p>
                    <p className="text-xs text-yellow-700 mt-1">This user can see ALL suppliers without any restrictions</p>
                  </div>
                )}
              </div>

              {/* Add New Access Rule */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Access Rule</h3>
                <form onSubmit={handleAddAccessRule} className="space-y-6">

                  {/* Categories - Multi-select with Checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Categories ({newAccessRule.categories.length} selected)
                    </label>
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {availableCategories.map((category) => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={newAccessRule.categories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-900">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select specific categories this user can access. Leave empty for all categories.</p>
                  </div>

                  {/* Regions - Multi-select with Checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Regions ({newAccessRule.regions.length} selected)
                    </label>
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {availableRegions.map((region) => (
                          <label key={region} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={newAccessRule.regions.includes(region)}
                              onChange={() => toggleRegion(region)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-900">{region}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select specific regions this user can access. Leave empty for all regions.</p>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range Limit (optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          value={newAccessRule.priceMin}
                          onChange={(e) => setNewAccessRule({ ...newAccessRule, priceMin: e.target.value })}
                          placeholder="Min Price ($)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newAccessRule.priceMax}
                          onChange={(e) => setNewAccessRule({ ...newAccessRule, priceMax: e.target.value })}
                          placeholder="Max Price ($)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Limit supplier visibility by price range.</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newAccessRule.notes}
                      onChange={(e) => setNewAccessRule({ ...newAccessRule, notes: e.target.value })}
                      placeholder="e.g., Limited to Chinese cabinet suppliers under $10,000"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Comprehensive Access Control:</strong> Select any combination of categories, regions, and price ranges. Users with no rules can see ALL suppliers. Each rule acts as a filter - only suppliers matching ALL selected criteria will be visible.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccessRulesModal(false);
                        setAccessRulesUser(null);
                        setNewAccessRule({
                          categories: [],
                          regions: [],
                          specificSuppliers: [],
                          priceMin: '',
                          priceMax: '',
                          notes: ''
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={createAccessRule.isPending}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-purple-300"
                    >
                      {createAccessRule.isPending ? 'Adding...' : 'Add Access Rule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Remove User</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to remove this user?
                </p>
                <p className="text-base font-medium text-gray-900">
                  {userToDelete.email}
                </p>
                {userToDelete.role && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current role: <span className="font-medium">{userToDelete.role}</span>
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will permanently delete:
                </p>
                <ul className="text-sm text-yellow-800 mt-1 ml-4 list-disc">
                  <li>User account and login access</li>
                  <li>Assigned role</li>
                  <li>All supplier access rules</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={deleteUser.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-300"
                >
                  {deleteUser.isPending ? 'Removing...' : 'Remove User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
