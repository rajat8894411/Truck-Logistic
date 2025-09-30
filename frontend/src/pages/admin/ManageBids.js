import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import truckingService from '../../services/truckingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ManageBids() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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

  useEffect(() => {
    load();
  }, []);

  const filteredBids = useMemo(() => {
    return bids.filter((b) => {
      const matchesStatus = statusFilter ? b.status === statusFilter : true;
      const hay = `${b.requirement_title || ''} ${b.user_name || ''} ${b.truck_registration || ''}`.toLowerCase();
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

  const respond = async (bidId, status) => {
    try {
      setActionLoading(bidId + '-' + status);
      await truckingService.respondToBid(bidId, { status });
      await load();
      // toast
      const div = document.createElement('div');
      div.className = `fixed top-4 right-4 z-50 ${status === 'accepted' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-2 rounded shadow`;
      div.textContent = status === 'accepted' ? 'Bid accepted' : 'Bid rejected';
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    } catch (e) {
      setError('Failed to update bid');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading bids..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Manage Bids' : 'My Bids'}</h1>
          <p className="mt-1 text-sm text-gray-600">{isAdmin ? 'Review and take actions on all bids placed by users.' : 'Review and manage your bids.'}</p>
        </div>
        <button onClick={() => navigate('/requirements')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">{isAdmin ? 'View Requirements' : 'Browse Jobs'}</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            placeholder="Search by requirement, user, truck"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBids.map((bid) => (
                <tr key={bid.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{bid.requirement_title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{bid.user_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{bid.truck_registration}</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-semibold">${bid.amount}</td>
                  <td className="px-4 py-3 text-sm">{statusBadge(bid.status, bid.status_display)}</td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          disabled={actionLoading === bid.id + '-accepted' || bid.status !== 'pending'}
                          onClick={() => respond(bid.id, 'accepted')}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white shadow ${bid.status === 'pending' ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500' : 'bg-green-400 cursor-not-allowed opacity-80'}`}
                          title={bid.status === 'pending' ? 'Accept bid' : 'Only pending bids can be accepted'}
                        >
                          <span>✅</span>
                          <span>{actionLoading === bid.id + '-accepted' ? 'Accepting…' : 'Accept'}</span>
                        </button>
                        <button
                          disabled={actionLoading === bid.id + '-rejected' || bid.status !== 'pending'}
                          onClick={() => respond(bid.id, 'rejected')}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white shadow ${bid.status === 'pending' ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500' : 'bg-red-400 cursor-not-allowed opacity-80'}`}
                          title={bid.status === 'pending' ? 'Reject bid' : 'Only pending bids can be rejected'}
                        >
                          <span>✖</span>
                          <span>{actionLoading === bid.id + '-rejected' ? 'Rejecting…' : 'Reject'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          disabled={bid.status !== 'pending'}
                          onClick={() => navigate(`/my-bids/${bid.id}/edit`)}
                          className={`px-3 py-1.5 rounded-md text-sm ${bid.status === 'pending' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-80'}`}
                        >
                          Edit
                        </button>
                        <button
                          disabled={bid.status !== 'pending'}
                          onClick={() => navigate(`/my-bids/${bid.id}/withdraw`)}
                          className={`px-3 py-1.5 rounded-md text-sm text-white ${bid.status === 'pending' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed opacity-80'}`}
                        >
                          Withdraw
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBids.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-gray-500" colSpan={6}>No bids found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


