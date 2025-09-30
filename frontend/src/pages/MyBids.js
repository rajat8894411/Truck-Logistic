import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import truckingService from '../services/truckingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MyBids() {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ amount: '', message: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await truckingService.getBids();
      const list = Array.isArray(data) ? data : (data.results || []);
      setBids(list);
      setError(null);
    } catch (e) {
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return bids.filter((b) => {
      const matchesStatus = statusFilter ? b.status === statusFilter : true;
      const hay = `${b.requirement_title || ''} ${b.truck_registration || ''}`.toLowerCase();
      const matchesSearch = search ? hay.includes(search.toLowerCase()) : true;
      return matchesStatus && matchesSearch;
    });
  }, [bids, statusFilter, search]);

  const statusBadge = (status, label) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
    );
  };

  const startEdit = (b) => {
    setEditing(b);
    setForm({ amount: String(b.amount), message: b.message || '' });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      await truckingService.patchBid(editing.id, { amount: form.amount, message: form.message });
      setEditing(null);
      await load();
      const div = document.createElement('div');
      div.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow';
      div.textContent = 'Bid updated';
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    } catch (e) {
      setError('Failed to update bid');
      const div = document.createElement('div');
      div.className = 'fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow';
      div.textContent = 'Failed to update bid';
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (b) => {
    if (!window.confirm('Withdraw this bid?')) return;
    try {
      await truckingService.patchBid(b.id, { status: 'withdrawn' });
      await load();
      const div = document.createElement('div');
      div.className = 'fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded shadow';
      div.textContent = 'Bid withdrawn';
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    } catch (e) {
      setError('Failed to withdraw bid');
      const div = document.createElement('div');
      div.className = 'fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow';
      div.textContent = 'Failed to withdraw bid';
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    }
  };

  if (loading) return <LoadingSpinner text="Loading my bids..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
          <p className="mt-1 text-sm text-gray-600">Track and manage the bids you have placed.</p>
        </div>
        <button onClick={() => navigate('/requirements')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Browse Jobs</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            placeholder="Search by requirement or truck"
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
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{b.requirement_title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{b.truck_registration}</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-semibold">${b.amount}</td>
                  <td className="px-4 py-3 text-sm">{statusBadge(b.status, b.status_display)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        disabled={b.status !== 'pending'}
                        onClick={() => startEdit(b)}
                        className={`px-3 py-1.5 rounded-md text-sm ${b.status === 'pending' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-80'}`}
                      >
                        Edit
                      </button>
                      <button
                        disabled={b.status !== 'pending'}
                        onClick={() => withdraw(b)}
                        className={`px-3 py-1.5 rounded-md text-sm text-white ${b.status === 'pending' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed opacity-80'}`}
                      >
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-gray-500" colSpan={5}>No bids found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Edit Bid for {editing.requirement_title} ({editing.truck_registration})</h3>
          <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <input value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex items-end space-x-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-md border border-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}



