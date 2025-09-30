import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import truckingService from '../services/truckingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin, isTruckOwner } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = isAdmin 
        ? await truckingService.getAdminDashboard()
        : await truckingService.getTruckOwnerDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isAdmin ? 'Admin Dashboard' : 'Truck Owner Dashboard'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {user?.role === 'admin' ? 'Admin' : 'Truck Owner'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <AdminStats data={dashboardData} />
        ) : (
          <TruckOwnerStats data={dashboardData} />
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAdmin ? <AdminQuickActions /> : <TruckOwnerQuickActions />}
        </div>
      </div>
    </div>
  );
};

const AdminStats = ({ data }) => {
  const stats = [
    {
      name: 'Total Requirements',
      value: data?.total_requirements || 0,
      icon: '📋',
      color: 'bg-blue-500'
    },
    {
      name: 'Active Orders',
      value: data?.active_orders || 0,
      icon: '📦',
      color: 'bg-green-500'
    },
    {
      name: 'Pending Bids',
      value: data?.pending_bids || 0,
      icon: '💰',
      color: 'bg-yellow-500'
    },
    {
      name: 'Total Revenue',
      value: `$${data?.total_revenue || 0}`,
      icon: '💵',
      color: 'bg-purple-500'
    }
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md ${stat.color} p-3`}>
              <span className="text-white text-xl">{stat.icon}</span>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const TruckOwnerStats = ({ data }) => {
  const stats = [
    {
      name: 'My Trucks',
      value: data?.total_trucks || 0,
      icon: '🚛',
      color: 'bg-blue-500'
    },
    {
      name: 'Active Orders',
      value: data?.active_orders || 0,
      icon: '📦',
      color: 'bg-green-500'
    },
    {
      name: 'Pending Bids',
      value: data?.pending_bids || 0,
      icon: '💰',
      color: 'bg-yellow-500'
    },
    {
      name: 'Total Earnings',
      value: `$${data?.total_earnings || 0}`,
      icon: '💵',
      color: 'bg-purple-500'
    }
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md ${stat.color} p-3`}>
              <span className="text-white text-xl">{stat.icon}</span>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const AdminQuickActions = () => {
  const actions = [
    {
      name: 'Create New Requirement',
      description: 'Post a new transport requirement',
      icon: '➕',
      href: '/requirements/create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Manage Bids',
      description: 'Review and respond to bids',
      icon: '💰',
      href: '/bids/manage',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Track Orders',
      description: 'Monitor active orders',
      icon: '📍',
      href: '/orders/track',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <>
      {actions.map((action) => (
        <a key={action.name} href={action.href} className="relative group">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 rounded-md ${action.color} p-2 transition-colors`}>
                <span className="text-white text-lg">{action.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          </div>
        </a>
      ))}
    </>
  );
};

const TruckOwnerQuickActions = () => {
  const actions = [
    {
      name: 'Browse Jobs',
      description: 'Find available transport requirements',
      icon: '🔍',
      href: '/requirements',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'My Bids',
      description: 'Check status of your bids',
      icon: '💰',
      href: '/my-bids',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Manage Trucks',
      description: 'Update your truck information',
      icon: '🚛',
      href: '/trucks',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <>
      {actions.map((action) => (
        <div key={action.name} className="relative group">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 rounded-md ${action.color} p-2 transition-colors`}>
                <span className="text-white text-lg">{action.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Dashboard;
