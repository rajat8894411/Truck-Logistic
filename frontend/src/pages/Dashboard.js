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
    <div className="space-y-6 animate-fadeIn">
      <div className="card hover:-translate-y-1" style={{ animation: 'slideInUp 0.4s ease-out' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="mt-2 text-base text-gray-600">
              {isAdmin ? 'Admin Dashboard' : 'Truck Owner Dashboard'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="badge bg-blue-100 text-blue-800 capitalize" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {user?.role === 'admin' ? 'Admin' : 'Truck Owner'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ animation: 'slideInUp 0.5s ease-out 0.1s both' }}>
        {isAdmin ? (
          <AdminStats data={dashboardData} />
        ) : (
          <TruckOwnerStats data={dashboardData} />
        )}
      </div>

      <div className="card" style={{ animation: 'slideInUp 0.6s ease-out 0.2s both' }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
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
      {stats.map((stat, index) => (
        <div key={stat.name} className="card transition-all hover:scale-105" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-xl ${stat.color} p-4 transition-transform hover:rotate-6`} style={{ boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
              <span className="text-white text-2xl">{stat.icon}</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  {stat.name}
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
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
      {stats.map((stat, index) => (
        <div key={stat.name} className="card transition-all hover:scale-105" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-xl ${stat.color} p-4 transition-transform hover:rotate-6`} style={{ boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
              <span className="text-white text-2xl">{stat.icon}</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  {stat.name}
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
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
        <a key={action.name} href={action.href} className="relative group block">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 rounded-lg ${action.color} p-3 transition-all group-hover:scale-110`}>
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{action.name}</p>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
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
          <div className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 rounded-lg ${action.color} p-3 transition-all group-hover:scale-110`}>
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{action.name}</p>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Dashboard;
