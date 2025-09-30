import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import truckingService from '../../services/truckingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialState = {
  title: '',
  description: '',
  load_type: '',
  weight: '',
  truck_type: '',
  from_location: '',
  to_location: '',
  pickup_date: '',
  delivery_date: '',
  budget_min: '',
  budget_max: '',
  special_instructions: '',
  bidding_end_date: '',
  status: 'open',
};

export default function RequirementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        setLoadingInitial(true);
        const data = await truckingService.getRequirement(id);
        setForm({
          title: data.title || '',
          description: data.description || '',
          load_type: data.load_type || '',
          weight: String(data.weight ?? ''),
          truck_type: data.truck_type || '',
          from_location: data.from_location || '',
          to_location: data.to_location || '',
          pickup_date: data.pickup_date ? data.pickup_date.slice(0, 16) : '',
          delivery_date: data.delivery_date ? data.delivery_date.slice(0, 16) : '',
          budget_min: data.budget_min != null ? String(data.budget_min) : '',
          budget_max: data.budget_max != null ? String(data.budget_max) : '',
          special_instructions: data.special_instructions || '',
          bidding_end_date: data.bidding_end_date ? data.bidding_end_date.slice(0, 16) : '',
          status: data.status || 'open',
        });
      } catch (e) {
        setError('Failed to load requirement');
      } finally {
        setLoadingInitial(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
        budget_min: form.budget_min !== '' ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max !== '' ? parseFloat(form.budget_max) : null,
        pickup_date: form.pickup_date ? new Date(form.pickup_date).toISOString() : null,
        delivery_date: form.delivery_date ? new Date(form.delivery_date).toISOString() : null,
        bidding_end_date: form.bidding_end_date ? new Date(form.bidding_end_date).toISOString() : null,
      };

      if (isEdit) {
        await truckingService.updateRequirement(id, payload);
      } else {
        await truckingService.createRequirement(payload);
      }
      navigate('/requirements');
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save requirement');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner text="Loading requirement..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Requirement' : 'Create Requirement'}</h1>
        <p className="mt-1 text-sm text-gray-600">Fill in the details below.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load Type</label>
            <select name="load_type" value={form.load_type} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="food_items">Food Items</option>
              <option value="construction">Construction Materials</option>
              <option value="automotive">Automotive Parts</option>
              <option value="textiles">Textiles</option>
              <option value="chemicals">Chemicals</option>
              <option value="machinery">Machinery</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (tons)</label>
            <input name="weight" type="number" step="0.01" value={form.weight} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
            <select name="truck_type" value={form.truck_type} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select</option>
              <option value="mini">Mini Truck</option>
              <option value="small">Small Truck</option>
              <option value="medium">Medium Truck</option>
              <option value="large">Large Truck</option>
              <option value="trailer">Trailer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input name="from_location" value={form.from_location} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input name="to_location" value={form.to_location} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
            <input name="pickup_date" type="datetime-local" value={form.pickup_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
            <input name="delivery_date" type="datetime-local" value={form.delivery_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label>
            <input name="budget_min" type="number" step="0.01" value={form.budget_min} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label>
            <input name="budget_max" type="number" step="0.01" value={form.budget_max} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea name="special_instructions" value={form.special_instructions} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bidding End</label>
            <input name="bidding_end_date" type="datetime-local" value={form.bidding_end_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="open">Open for Bidding</option>
                <option value="closed">Bidding Closed</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => navigate('/requirements')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Requirement')}
          </button>
        </div>
      </form>
    </div>
  );
}


