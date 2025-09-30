import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import truckingService from '../../services/truckingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

export default function OrdersList() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await truckingService.getOrders();
      const list = Array.isArray(data) ? data : (data.results || []);
      setOrders(list);
      setError(null);
    } catch (e) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter ? o.status === statusFilter : true;
      const hay = `${o.order_number || ''} ${o.requirement_title || ''} ${o.user_name || ''}`.toLowerCase();
      const matchesSearch = search ? hay.includes(search.toLowerCase()) : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Orders' : 'My Orders'}</h1>
          <p className="mt-1 text-sm text-gray-600">Manage orders and track progress.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            placeholder="Search by order, requirement, user"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="loaded">Loaded</option>
            <option value="on_the_way">On The Way</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <td className="px-4 py-3 text-sm text-gray-900">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.requirement_title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.user_name}</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-semibold">${o.bid_amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.status_display}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-gray-500" colSpan={6}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


