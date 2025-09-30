import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Requirements from './pages/Requirements';
import RequirementForm from './pages/admin/RequirementForm';
import RequirementBids from './pages/admin/RequirementBids';
import ManageBids from './pages/admin/ManageBids';
import OrdersList from './pages/orders/OrdersList';
import OrderDetail from './pages/orders/OrderDetail';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import LoadingSpinner from './components/common/LoadingSpinner';
import Trucks from './pages/Trucks';
import MyBids from './pages/MyBids';

// Placeholder components for routes that will be implemented
const Orders = () => <div className="p-6"><h1 className="text-2xl font-bold">Orders Page - Coming Soon</h1></div>;
// trucks and my-bids placeholders removed; real pages imported

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading application..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requirements" element={<Requirements />} />
        <Route path="requirements/create" element={
          <ProtectedRoute adminOnly>
            <RequirementForm />
          </ProtectedRoute>
        } />
        <Route path="requirements/:id/edit" element={
          <ProtectedRoute adminOnly>
            <RequirementForm />
          </ProtectedRoute>
        } />
        <Route path="requirements/:id/bids" element={
          <ProtectedRoute adminOnly>
            <RequirementBids />
          </ProtectedRoute>
        } />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="orders/track" element={<Tracking />} />
        
        {/* Admin only routes */}
        <Route path="bids/manage" element={
          <ProtectedRoute adminOnly>
            <ManageBids />
          </ProtectedRoute>
        } />
        
        {/* Truck owner only routes */}
        <Route path="trucks" element={
          <ProtectedRoute userOnly>
            <Trucks />
          </ProtectedRoute>
        } />
        <Route path="my-bids" element={
          <ProtectedRoute userOnly>
            <MyBids />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
