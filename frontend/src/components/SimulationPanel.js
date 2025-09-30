import React, { useState } from 'react';
import api from '../services/api';

const SimulationPanel = ({ orderId }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const startSimulation = async () => {
    if (!orderId) return;
    
    setIsSimulating(true);
    
    // Send location update every 5 seconds
    const id = setInterval(async () => {
      try {
        await api.post(`/orders/${orderId}/simulate-location/`);
      } catch (error) {
        console.error('Simulation error:', error);
      }
    }, 5000);
    
    setIntervalId(id);
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsSimulating(false);
  };

  const updateOrderStatus = async (status) => {
    try {
      await api.post(`/orders/${orderId}/update-status/`, { status });
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  if (!orderId) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-yellow-800 mb-3">Testing Panel</h4>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={isSimulating ? stopSimulation : startSimulation}
            className={`px-3 py-1 text-xs rounded ${
              isSimulating 
                ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Location Simulation'}
          </button>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => updateOrderStatus('on_the_way')}
            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            Set On The Way
          </button>
          <button
            onClick={() => updateOrderStatus('delivered')}
            className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded"
          >
            Set Delivered
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
