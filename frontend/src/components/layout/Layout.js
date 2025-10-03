import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin, isTruckOwner } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    ...(isAdmin ? [
      { name: 'Requirements', href: '/requirements', icon: '📋' },
      { name: 'Manage Bids', href: '/bids/manage', icon: '💰' },
      { name: 'Orders', href: '/orders', icon: '📦' },
    ] : []),
    ...(isTruckOwner ? [
      { name: 'Available Jobs', href: '/requirements', icon: '🔍' },
      { name: 'My Bids', href: '/my-bids', icon: '💰' },
      { name: 'My Orders', href: '/orders', icon: '📦' },
      { name: 'My Trucks', href: '/trucks', icon: '🚛' },
    ] : []),
    { name: 'Tracking', href: '/orders/track', icon: '📍' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  const isActiveRoute = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${isSidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="modern-mobile-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <span className="text-white text-xl">×</span>
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-6 py-6 logo-section">
            <div className="flex items-center space-x-3">
              <div className="profitruck-logo">
                <div className="profitruck-logo-text">
                  <span className="profitruck-profi">PROFI</span>
                  <div className="profitruck-wheel">
                    <div className="profitruck-truck"></div>
                    <div className="profitruck-lines"></div>
                  </div>
                  <span className="profitruck-truck-text">TRUCK</span>
                  <span className="profitruck-emoji">🚛</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex-1 h-0 overflow-y-auto px-4">
            <nav className="px-2 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`modern-nav-item ${
                    isActiveRoute(item.href)
                      ? 'modern-nav-active'
                      : 'modern-nav-inactive'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="modern-sidebar-container">
          <div className="modern-sidebar-blur"></div>
          <div className="modern-sidebar-content">
            <div className="flex items-center flex-shrink-0 px-6 py-6 logo-section">
              <div className="flex items-center space-x-3">
                <div className="profitruck-logo">
                  <div className="profitruck-logo-text">
                    <span className="profitruck-profi">PROFI</span>
                    <div className="profitruck-wheel">
                      <div className="profitruck-truck"></div>
                      <div className="profitruck-lines"></div>
                    </div>
                    <span className="profitruck-truck-text">TRUCK</span>
                    <span className="profitruck-emoji">🚛</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 flex-grow flex flex-col px-4">
              <nav className="flex-1 px-2 pb-6 space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`modern-nav-item ${
                      isActiveRoute(item.href)
                        ? 'modern-nav-active'
                        : 'modern-nav-inactive'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="modern-top-header">
          <div className="modern-top-header-blur"></div>
          <div className="modern-top-header-content">
            <button
              className="modern-mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <span className="text-xl">☰</span>
            </button>
            <div className="flex-1 px-6 flex justify-between items-center">
              <div className="flex-1 flex">
                <div className="flex items-center">
                  <h2 className="modern-page-title capitalize">
                    {location.pathname.split('/')[1] || 'Dashboard'}
                  </h2>
                </div>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="modern-user-info">
                      <span className="modern-user-name">
                        {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : ''}
                      </span>
                      <span className="modern-user-role">
                        {user?.role === 'admin' ? 'Admin' : 'Truck Owner'}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="modern-logout-btn"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
