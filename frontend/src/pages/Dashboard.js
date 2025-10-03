import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import truckingService from '../services/truckingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin, isTruckOwner } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      <div className="modern-error-card">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="modern-error-icon">
              <span className="text-white text-2xl">⚠</span>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-red-900">Error Loading Dashboard</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={fetchDashboardData}
              className="modern-error-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <ModernHeader user={user} isAdmin={isAdmin} />
      <ModernStatsGrid data={dashboardData} isAdmin={isAdmin} />
      <ModernQuickActions isAdmin={isAdmin} navigate={navigate} />
    </div>
  );
};

const ModernHeader = ({ user, isAdmin }) => {
  return (
    <div className="modern-header-container">
      <div className="modern-header-blur"></div>
      <div className="modern-header-card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="modern-header-title">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="modern-header-subtitle">
              {isAdmin ? 'Admin Dashboard' : 'Truck Owner Dashboard'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="modern-header-badge">
              <span className="text-white font-bold text-sm">
                {user?.role === 'admin' ? 'ADMIN' : 'TRUCK OWNER'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModernStatsGrid = ({ data, isAdmin }) => {
  const adminStats = [
    {
      name: 'Total Requirements',
      value: data?.total_requirements || 0,
      icon: '📋',
      gradient: 'blue-cyan',
      trend: '+12%',
      trendUp: true
    },
    {
      name: 'Active Orders',
      value: data?.active_orders || 0,
      icon: '📦',
      gradient: 'green-emerald',
      trend: '+8%',
      trendUp: true
    },
    {
      name: 'Pending Bids',
      value: data?.pending_bids || 0,
      icon: '💰',
      gradient: 'yellow-orange',
      trend: '-3%',
      trendUp: false
    },
    {
      name: 'Total Revenue',
      value: `$${data?.total_revenue || 0}`,
      icon: '💵',
      gradient: 'purple-pink',
      trend: '+24%',
      trendUp: true
    }
  ];

  const truckOwnerStats = [
    {
      name: 'My Trucks',
      value: data?.total_trucks || 0,
      icon: '🚛',
      gradient: 'blue-cyan',
      trend: '+2',
      trendUp: true
    },
    {
      name: 'Active Orders',
      value: data?.active_orders || 0,
      icon: '📦',
      gradient: 'green-emerald',
      trend: '+5',
      trendUp: true
    },
    {
      name: 'Pending Bids',
      value: data?.pending_bids || 0,
      icon: '💰',
      gradient: 'yellow-orange',
      trend: '0',
      trendUp: true
    },
    {
      name: 'Total Earnings',
      value: `$${data?.total_earnings || 0}`,
      icon: '💵',
      gradient: 'purple-pink',
      trend: '+18%',
      trendUp: true
    }
  ];

  const stats = isAdmin ? adminStats : truckOwnerStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={stat.name}
          className="modern-stat-card"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`modern-stat-card-inner gradient-${stat.gradient}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`modern-stat-icon gradient-${stat.gradient}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className={`modern-trend-badge ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                {stat.trendUp ? '↑' : '↓'} {stat.trend}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="modern-stat-label">{stat.name}</p>
              <p className={`modern-stat-value gradient-text-${stat.gradient}`}>
                {stat.value}
              </p>
            </div>
            
            <div className="modern-progress-bar">
              <div className={`modern-progress-fill gradient-${stat.gradient}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ModernQuickActions = ({ isAdmin, navigate }) => {
  const adminActions = [
    {
      name: 'Create New Requirement',
      description: 'Post a new transport requirement',
      icon: '➕',
      href: '/requirements/create',
      gradient: 'blue-cyan'
    },
    {
      name: 'Manage Bids',
      description: 'Review and respond to bids',
      icon: '💰',
      href: '/bids/manage',
      gradient: 'green-emerald'
    },
    {
      name: 'Track Orders',
      description: 'Monitor active orders',
      icon: '📍',
      href: '/orders/track',
      gradient: 'purple-pink'
    }
  ];

  const truckOwnerActions = [
    {
      name: 'Browse Jobs',
      description: 'Find available transport requirements',
      icon: '🔍',
      href: '/requirements',
      gradient: 'blue-cyan'
    },
    {
      name: 'My Bids',
      description: 'Check status of your bids',
      icon: '💰',
      href: '/my-bids',
      gradient: 'green-emerald'
    },
    {
      name: 'Manage Trucks',
      description: 'Update your truck information',
      icon: '🚛',
      href: '/trucks',
      gradient: 'purple-pink'
    }
  ];

  const actions = isAdmin ? adminActions : truckOwnerActions;

  return (
    <div className="modern-actions-container">
      <h2 className="modern-actions-title">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <button
            key={action.name}
            onClick={() => navigate(action.href)}
            className="modern-action-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="modern-action-content">
              <div className={`modern-action-icon gradient-${action.gradient}`}>
                <span className="text-3xl">{action.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`modern-action-title gradient-text-${action.gradient}`}>
                  {action.name}
                </h3>
                <p className="modern-action-description">
                  {action.description}
                </p>
              </div>
            </div>
            
            <div className="modern-action-arrow">
              <span className={`gradient-text-${action.gradient}`}>Get Started →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


export default Dashboard;

