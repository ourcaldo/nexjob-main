import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Filter, MoreVertical, Shield, User, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'super_admin';
  created_at: string;
  last_sign_in_at?: string;
}

const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'super_admin'>('all');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        showToast('error', 'Failed to load users');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateUserRole = async (userId: string, newRole: 'user' | 'super_admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        showToast('error', 'Failed to update user role');
        return;
      }

      showToast('success', 'User role updated successfully');
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('error', 'Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <User className="h-3 w-3 mr-1" />
        User
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-3 text-primary-600" />
            User Management
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage user accounts and permissions.
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Total Users</div>
                  <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Regular Users</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'user').length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Super Admins</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'super_admin').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.role === 'user' ? (
                        <button
                          onClick={() => updateUserRole(user.id, 'super_admin')}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserRole(user.id, 'user')}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have registered yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;