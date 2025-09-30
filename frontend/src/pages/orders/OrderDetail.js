import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import truckingService from '../../services/truckingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: '', driver_name: '', driver_phone: '', driver_license: '', notes: '' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await truckingService.getOrder(id);
      setOrder(data);
      setForm({
        status: data.status,
        driver_name: data.driver_name || '',
        driver_phone: data.driver_phone || '',
        driver_license: data.driver_license || '',
        notes: data.notes || '',
      });
      setError(null);
    } catch (e) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await truckingService.updateOrderStatus(id, {
        status: form.status,
        driver_name: form.driver_name,
        driver_phone: form.driver_phone,
        driver_license: form.driver_license,
        notes: form.notes,
      });
      await load();
    } catch (e) {
      setError('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading order..." />;

  const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '-');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
          <p className="text-sm text-gray-600">{order.requirement_title} — {order.user_name} — ${order.bid_amount}</p>
        </div>
        <button onClick={() => navigate('/orders')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Back</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Requirement</h3>
            <div className="text-sm text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><span className="font-medium">From:</span> {order.requirement_details.from_location}</div>
                <div><span className="font-medium">To:</span> {order.requirement_details.to_location}</div>
                <div><span className="font-medium">Pickup:</span> {formatDateTime(order.requirement_details.pickup_date)}</div>
                <div><span className="font-medium">Delivery:</span> {formatDateTime(order.requirement_details.delivery_date)}</div>
                <div><span className="font-medium">Truck:</span> {order.truck_registration}</div>
                <div><span className="font-medium">Load:</span> {order.requirement_details.load_type_display}</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div><span className="font-medium">Current Status:</span> {order.status_display}</div>
              <div><span className="font-medium">Current Location:</span> {order.current_location ? `${order.current_location.latitude}, ${order.current_location.longitude}` : '—'}</div>
              <div><span className="font-medium">Last Update:</span> {order.current_location ? formatDateTime(order.current_location.timestamp) : '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input name="driver_name" value={form.driver_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label>
                <input name="driver_phone" value={form.driver_phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver License</label>
                <input name="driver_license" value={form.driver_license} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-between">
                <div className="space-x-2">
                  {/* Quick status updates for users */}
                  {!isAdmin && (
                    <>
                      <button onClick={() => setForm((p) => ({ ...p, status: 'on_the_way' }))} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">On The Way</button>
                      <button onClick={() => setForm((p) => ({ ...p, status: 'delivered' }))} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">Delivered</button>
                    </>
                  )}
                </div>
                <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-md">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


