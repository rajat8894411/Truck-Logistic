import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useTracking from '../hooks/useTracking';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LeafletMap from '../components/common/LeafletMap';
import SimulationPanel from '../components/SimulationPanel';

export default function Tracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get('orderId');
  const [orderId, setOrderId] = useState(orderIdFromQuery || '');
  
  const {
    isConnected,
    currentLocation,
    locations,
    order,
    error,
    isLoading,
    connect,
    disconnect,
    requestLocations
  } = useTracking(orderId);

  useEffect(() => {
    if (orderIdFromQuery) {
      setOrderId(orderIdFromQuery);
    }
  }, [orderIdFromQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!orderId) return;
    navigate(`/tracking?orderId=${orderId}`);
  };

  // Fixed path logic - only show locations for current order
  const path = useMemo(() => {
    if (!locations || locations.length === 0) return [];
    
    return locations
      .slice()
      .reverse()
      .map(loc => ({
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude),
        ...loc
      }))
      .filter(loc => !isNaN(loc.lat) && !isNaN(loc.lng))
      .slice(0, 1); // Limit to last 50 locations for performance
  }, [locations]);

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live Tracking Active
        </div>
      );
    } else if (error) {
      return (
        <div className="flex items-center text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Connection Error
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
          Connecting...
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time location tracking for your orders
          </p>
        </div>
        {orderId && (
          <div className="flex items-center space-x-4">
            {getConnectionStatus()}
            <button
              onClick={requestLocations}
              disabled={!isConnected}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="bg-white shadow rounded-lg p-4 flex items-center space-x-2">
        <input
          placeholder="Enter Order ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
          Track
        </button>
      </form>

      {isLoading && <LoadingSpinner text="Connecting to live tracking..." />}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={connect}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && orderId && order && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-medium">Order #:</span> {order.order_number}</div>
              <div><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  order.status === 'on_the_way' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status_display}
                </span>
              </div>
              <div><span className="font-medium">Route:</span> {order.requirement.from_location} → {order.requirement.to_location}</div>
              <div><span className="font-medium">Driver:</span> {order.driver_name || '—'}</div>
              <div><span className="font-medium">Truck:</span> {order.truck_registration || '—'}</div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Current Location</h3>
            {!currentLocation ? (
              <div className="text-sm text-gray-600">No current location available.</div>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="font-medium">Coordinates:</span> {currentLocation.latitude}, {currentLocation.longitude}</div>
                <div><span className="font-medium">Address:</span> {currentLocation.address || '—'}</div>
                <div><span className="font-medium">Speed:</span> {currentLocation.speed || '—'} km/h</div>
                <div><span className="font-medium">Last Update:</span> {new Date(currentLocation.timestamp).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && orderId && order && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Location History</h3>
            <div className="max-h-96 overflow-auto divide-y divide-gray-100">
              {path.map((loc, index) => (
                <div key={loc.id || index} className="py-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div>{loc.latitude}, {loc.longitude}</div>
                    <div className="text-gray-500">{new Date(loc.timestamp).toLocaleString()}</div>
                  </div>
                  {loc.address && (
                    <div className="text-gray-500">{loc.address}</div>
                  )}
                  {loc.speed && (
                    <div className="text-xs text-blue-600">Speed: {loc.speed} km/h</div>
                  )}
                </div>
              ))}
              {path.length === 0 && (
                <div className="py-6 text-center text-gray-500">No location history available</div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Live Map</h3>
            {currentLocation ? (
              <LeafletMap
              center={{ 
                lat: parseFloat(currentLocation.latitude), 
                lng: parseFloat(currentLocation.longitude) 
              }}
              path={path}
              order={order}   // 👉 yeh naya addition hai
              height="400px"
            />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No location data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add simulation panel for testing */}
      {orderId && process.env.NODE_ENV === 'development' && (
        <SimulationPanel orderId={orderId} />
      )}
    </div>
  );
}