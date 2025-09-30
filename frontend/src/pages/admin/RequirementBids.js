import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import truckingService from '../../services/truckingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

export default function RequirementBids() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isTruckOwner } = useAuth();
  const [requirement, setRequirement] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ truck: '', amount: '', estimated_delivery_time: 'P3D', message: '' });

  const load = async () => {
    try {
      setLoading(true);
      const promises = [
        truckingService.getRequirement(id),
        truckingService.getRequirementBids(id),
      ];
      if (isTruckOwner) {
        promises.push(truckingService.getTrucks());
      }
      const results = await Promise.all(promises);
      const req = results[0];
      const reqBids = results[1];
      const trucksList = results[2];
      setRequirement(req);
      setBids(reqBids);
      if (isTruckOwner) {
        const list = Array.isArray(trucksList) ? trucksList : (trucksList?.results || []);
        setTrucks(list);
      }
      setError(null);
    } catch (e) {
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const respond = async (bidId, status) => {
    try {
      setActionLoading(bidId + '-' + status);
      await truckingService.respondToBid(bidId, { status });
      await load();
    } catch (e) {
      setError('Failed to update bid');
    } finally {
      setActionLoading(null);
    }
  };

  const myExistingBid = useMemo(() => {
    // If API included user_name we can't identify current user reliably here without user.id; keep as informational
    return null;
  }, [bids]);

  const placeBid = async (e) => {
    e.preventDefault();
    try {
      setPlacing(true);
      await truckingService.createBid({
        requirement: Number(id),
        truck: Number(form.truck),
        amount: form.amount,
        estimated_delivery_time: form.estimated_delivery_time,
        message: form.message,
      });
      await load();
    } catch (e) {
      const msg = e.response?.data?.non_field_errors || e.response?.data || 'Failed to place bid';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading bids..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requirement Bids</h1>
          {requirement && (
            <p className="mt-1 text-sm text-gray-600">{requirement.title} — {requirement.from_location} → {requirement.to_location}</p>
          )}
        </div>
        <button onClick={() => navigate('/requirements')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Back</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {bids.map((bid) => (
            <li key={bid.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 text-sm text-gray-700">
                    <span className="font-medium">By:</span>
                    <span>{bid.user_name}</span>
                    <span className="font-medium">Truck:</span>
                    <span>{bid.truck_registration}</span>
                    <span className="font-medium">Bid:</span>
                    <span className="text-green-700 font-semibold">${bid.amount}</span>
                    <span className="font-medium">Status:</span>
                    <span>{bid.status_display}</span>
                  </div>
                  {bid.message && (
                    <p className="mt-2 text-sm text-gray-600">Message: {bid.message}</p>
                  )}
                </div>
                <div className="ml-6 flex-shrink-0 flex space-x-2">
                  <button
                    disabled={actionLoading === bid.id + '-accepted' || bid.status !== 'pending'}
                    onClick={() => respond(bid.id, 'accepted')}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-md text-sm"
                  >
                    {actionLoading === bid.id + '-accepted' ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    disabled={actionLoading === bid.id + '-rejected' || bid.status !== 'pending'}
                    onClick={() => respond(bid.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded-md text-sm"
                  >
                    {actionLoading === bid.id + '-rejected' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </li>
          ))}
          {bids.length === 0 && (
            <li className="p-12 text-center text-gray-500">No bids yet.</li>
          )}
        </ul>
      </div>

      {isTruckOwner && requirement?.status === 'open' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Place a Bid</h3>
          <form onSubmit={placeBid} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Truck</label>
              <select value={form.truck} onChange={(e) => setForm((p) => ({ ...p, truck: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select truck</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{t.registration_number} — {t.truck_type_display}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ETA (ISO 8601 duration)</label>
              <input value={form.estimated_delivery_time} onChange={(e) => setForm((p) => ({ ...p, estimated_delivery_time: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <input value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button type="submit" disabled={placing} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{placing ? 'Placing...' : 'Place Bid'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


