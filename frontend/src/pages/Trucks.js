import React, { useEffect, useMemo, useState } from 'react';
import truckingService from '../services/truckingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    id: null,
    truck_type: '',
    capacity: '',
    registration_number: '',
    make_model: '',
    year: '',
    status: 'available',
    current_location: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await truckingService.getTrucks();
      const list = Array.isArray(data) ? data : (data.results || []);
      setTrucks(list);
      setError(null);
    } catch (e) {
      setError('Failed to load trucks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const hay = (t) => `${t.registration_number} ${t.make_model} ${t.truck_type_display}`.toLowerCase();
    return trucks.filter((t) => hay(t).includes(search.toLowerCase()));
  }, [trucks, search]);

  const startCreate = () => {
    setForm({ id: null, truck_type: '', capacity: '', registration_number: '', make_model: '', year: '', status: 'available', current_location: '' });
  };

  const startEdit = (t) => {
    setForm({
      id: t.id,
      truck_type: t.truck_type,
      capacity: String(t.capacity),
      registration_number: t.registration_number,
      make_model: t.make_model,
      year: String(t.year),
      status: t.status,
      current_location: t.current_location || '',
    });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        truck_type: form.truck_type,
        capacity: form.capacity,
        registration_number: form.registration_number,
        make_model: form.make_model,
        year: form.year,
        status: form.status,
        current_location: form.current_location,
      };
      if (form.id) {
        await truckingService.updateTruck(form.id, payload);
      } else {
        await truckingService.createTruck(payload);
      }
      await load();
      startCreate();
    } catch (e) {
      setError(e.response?.data?.registration_number || 'Failed to save truck');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this truck?')) return;
    try {
      await truckingService.deleteTruck(id);
      await load();
    } catch (e) {
      setError('Failed to delete truck');
    }
  };

  if (loading) return <LoadingSpinner text="Loading trucks..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trucks</h1>
          <p className="mt-1 text-sm text-gray-600">Register and manage your trucks.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{String(error)}</div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
            <select value={form.truck_type} onChange={(e) => setForm((p) => ({ ...p, truck_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select</option>
              <option value="mini">Mini Truck</option>
              <option value="small">Small Truck</option>
              <option value="medium">Medium Truck</option>
              <option value="large">Large Truck</option>
              <option value="trailer">Trailer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (tons)</label>
            <input value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input value={form.registration_number} onChange={(e) => setForm((p) => ({ ...p, registration_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make / Model</label>
            <input value={form.make_model} onChange={(e) => setForm((p) => ({ ...p, make_model: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
            <input value={form.current_location} onChange={(e) => setForm((p) => ({ ...p, current_location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{saving ? 'Saving...' : (form.id ? 'Update Truck' : 'Add Truck')}</button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <input placeholder="Search trucks" className="w-64 px-3 py-2 border border-gray-300 rounded-md" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={startCreate} className="px-3 py-2 rounded-md border border-gray-300">New</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{t.registration_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.truck_type_display}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.capacity} tons</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.status_display}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => startEdit(t)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">Edit</button>
                      <button onClick={() => remove(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-gray-500" colSpan={5}>No trucks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



