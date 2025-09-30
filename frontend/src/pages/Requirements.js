import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import truckingService from '../services/truckingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Requirements = () => {
  const { isAdmin, isTruckOwner } = useAuth();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placeBidFor, setPlaceBidFor] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [bidForm, setBidForm] = useState({ truck: '', amount: '', estimated_delivery_time: 'P3D', message: '' });
  const [placing, setPlacing] = useState(false);
  const [filters, setFilters] = useState({
    truck_type: '',
    load_type: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchRequirements();
    if (isTruckOwner) {
      // Load user's trucks for bidding
      truckingService.getTrucks().then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        // Only active & available trucks can bid
        setTrucks(list.filter((t) => t.is_active && t.status === 'available'));
      }).catch(() => {});
    }
  }, []);

  const fetchRequirements = async (filterParams = {}) => {
    try {
      setLoading(true);
      const data = await truckingService.getRequirements({ ...filters, ...filterParams });
      setRequirements(data.results || []);
      setError(null);
    } catch (err) {
      console.error('Requirements error:', err);
      setError('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchRequirements(newFilters);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading requirements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Transport Requirements' : 'Available Jobs'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin 
              ? 'Manage your transport requirements and view bids'
              : 'Browse available transport requirements and place bids'
            }
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/requirements/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Create New Requirement
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="truck_type" className="block text-sm font-medium text-gray-700 mb-1">
              Truck Type
            </label>
            <select
              id="truck_type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filters.truck_type}
              onChange={(e) => handleFilterChange('truck_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="mini">Mini Truck</option>
              <option value="small">Small Truck</option>
              <option value="medium">Medium Truck</option>
              <option value="large">Large Truck</option>
              <option value="trailer">Trailer</option>
            </select>
          </div>

          <div>
            <label htmlFor="load_type" className="block text-sm font-medium text-gray-700 mb-1">
              Load Type
            </label>
            <select
              id="load_type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filters.load_type}
              onChange={(e) => handleFilterChange('load_type', e.target.value)}
            >
              <option value="">All Loads</option>
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="open">Open for Bidding</option>
              <option value="closed">Bidding Closed</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
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
                  onClick={fetchRequirements}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements List */}
      {requirements.length === 0 && !loading && !error ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
          <p className="text-gray-500">
            {isAdmin 
              ? 'Create your first transport requirement to get started.'
              : 'No transport requirements match your current filters.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {requirements.map((requirement) => (
              <li key={requirement.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {requirement.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                        {requirement.status_display}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">From:</span> {requirement.from_location}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {requirement.to_location}
                      </div>
                      <div>
                        <span className="font-medium">Load:</span> {requirement.load_type_display}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Weight:</span> {requirement.weight} tons
                      </div>
                      <div>
                        <span className="font-medium">Truck:</span> {requirement.truck_type_display}
                      </div>
                      <div>
                        <span className="font-medium">Pickup:</span> {formatDate(requirement.pickup_date)}
                      </div>
                      <div>
                        <span className="font-medium">Delivery:</span> {formatDate(requirement.delivery_date)}
                      </div>
                    </div>

                    {requirement.budget_min && requirement.budget_max && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Budget:</span> ${requirement.budget_min} - ${requirement.budget_max}
                      </div>
                    )}

                    {requirement.bids_count > 0 && (
                      <div className="mt-2 text-sm text-blue-600">
                        {requirement.bids_count} bid{requirement.bids_count !== 1 ? 's' : ''} received
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    {isTruckOwner && requirement.status === 'open' && (
                      <button onClick={() => setPlaceBidFor(requirement)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        Place Bid
                      </button>
                    )}
                    {isAdmin && (
                      <div className="flex space-x-2">
                        <button onClick={() => navigate(`/requirements/${requirement.id}/bids`)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                          View Bids ({requirement.bids_count})
                        </button>
                        <button onClick={() => navigate(`/requirements/${requirement.id}/edit`)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Place Bid Modal */}
      {placeBidFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Place Bid — {placeBidFor.title}</h3>
              <button onClick={() => setPlaceBidFor(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {trucks.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                You need to register at least one truck before bidding. Go to <button onClick={() => navigate('/trucks')} className="underline">My Trucks</button>.
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setPlacing(true);
                  await truckingService.createBid({
                    requirement: placeBidFor.id,
                    truck: Number(bidForm.truck),
                    amount: bidForm.amount,
                    estimated_delivery_time: bidForm.estimated_delivery_time,
                    message: bidForm.message,
                  });
                  // Simple toast-style notification
                  const div = document.createElement('div');
                  div.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow';
                  div.textContent = 'Your bid has been placed successfully!';
                  document.body.appendChild(div);
                  setTimeout(() => div.remove(), 2500);
                  setPlaceBidFor(null);
                  setBidForm({ truck: '', amount: '', estimated_delivery_time: 'P3D', message: '' });
                  // Redirect to My Bids after success
                  navigate('/my-bids');
                } catch (e) {
                  const msg = e.response?.data?.non_field_errors || e.response?.data || 'Failed to place bid';
                  const div = document.createElement('div');
                  div.className = 'fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow max-w-md';
                  div.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg);
                  document.body.appendChild(div);
                  setTimeout(() => div.remove(), 3000);
                } finally {
                  setPlacing(false);
                }
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck</label>
                  <select value={bidForm.truck} onChange={(e) => setBidForm((p) => ({ ...p, truck: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select truck</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>{t.registration_number} — {t.truck_type_display}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" step="0.01" min="0.01" value={bidForm.amount} onChange={(e) => setBidForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ETA (ISO 8601 duration)</label>
                  <input value={bidForm.estimated_delivery_time} onChange={(e) => setBidForm((p) => ({ ...p, estimated_delivery_time: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                  <input value={bidForm.message} onChange={(e) => setBidForm((p) => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2">
                  <button type="button" onClick={() => setPlaceBidFor(null)} className="px-4 py-2 rounded-md border border-gray-300">Cancel</button>
                  <button type="submit" disabled={placing} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{placing ? 'Placing...' : 'Place Bid'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;
