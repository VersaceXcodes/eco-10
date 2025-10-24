import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UV_ActivityTracking_Energy: React.FC = () => {
  // Get energy logs and setter from store
  const energyLogs = useAppStore(state => state.energy_logs);
  const setEnergyLogs = useAppStore(state => state.set_energy_logs);

  // Get current user and auth token for API calls
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const auth_token = useAppStore(state => state.authentication_state.auth_token);

  // Form state for new energy log
  const [newEnergyLog, setNewEnergyLog] = useState({
    energy_type: '',
    usage_amount: 0,
    unit: '',
    date: new Date().toISOString().split('T')[0], // Default to today
  });

  const [error, setError] = useState<string | null>(null);

  // Mutation to log energy usage
  const { mutate, isLoading, error: apiError } = useMutation({
    mutationFn: (newLog) => {
      return axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/energy_logs`,
        {
          user_id: currentUser?.id,
         ...newLog,
        },
        {
          headers: {
            Authorization: `Bearer ${auth_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    // Basic validation
    if (!newEnergyLog.energy_type || newEnergyLog.usage_amount <= 0 ||!newEnergyLog.unit) {
      setError('Please fill all required fields with valid values.');
      return;
    }

    // Prepare the data
    const logData = {
      energy_type: newEnergyLog.energy_type,
      usage_amount: newEnergyLog.usage_amount,
      unit: newEnergyLog.unit,
      date: newEnergyLog.date,
    };

    mutate(logData, {
      onSuccess: (response) => {
        // Update local state by appending the new log
        setEnergyLogs(prev => [...prev, response.data]);
        // Reset form
        setNewEnergyLog({
          energy_type: '',
          usage_amount: 0,
          unit: '',
          date: new Date().toISOString().split('T')[0],
        });
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to log energy usage.');
      },
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEnergyLog(prev => ({
     ...prev,
      [name]: value,
    }));
    setError(null); // Clear error on input change
  };

  // Handle number input specifically
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value);
    setNewEnergyLog(prev => ({
     ...prev,
      [name]: numericValue,
    }));
    setError(null);
  };

  // Smart meter sync handler (placeholder)
  const handleSmartMeterSync = () => {
    // TODO: Implement when endpoint is available
    console.log('Smart meter sync not implemented yet.');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Energy Usage Tracking</h2>
          
          {/* Form Section */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Log Energy Usage</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error || apiError? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-6">
                  <p>{error || apiError?.message}</p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="energy_type" className="block text-sm font-medium text-gray-700">
                    Energy Type
                  </label>
                  <select
                    id="energy_type"
                    name="energy_type"
                    value={newEnergyLog.energy_type}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select energy type</option>
                    <option value="electricity">Electricity</option>
                    <option value="gas">Gas</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="usage_amount" className="block text-sm font-medium text-gray-700">
                    Usage Amount
                  </label>
                  <input
                    id="usage_amount"
                    name="usage_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEnergyLog.usage_amount}
                    onChange={handleNumberChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 150.50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <input
                    id="unit"
                    name="unit"
                    type="text"
                    value={newEnergyLog.unit}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., kWh"
                  />
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={newEnergyLog.date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Energy Log'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleSmartMeterSync}
                  disabled={true}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md font-medium text-sm cursor-not-allowed opacity-50"
                >
                  Sync Smart Meter
                </button>
              </div>
            </form>
          </div>
          
          {/* Historical Logs Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Energy Usage History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emissions (kg CO2e)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {energyLogs.length === 0? (
                    <tr>
                      <td colSpan={5} className="text-center py-6">
                        <p>No energy logs found. Start by logging your first entry above.</p>
                      </td>
                    </tr>
                  ) : (
                    energyLogs.map((log, index) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.energy_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.usage_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {/* Placeholder emissions calculation */}
                          {log.energy_type === 'electricity'? 
                            (log.usage_amount * 0.5).toFixed(2) : // Example factor for electricity
                            (log.usage_amount * 0.2).toFixed(2) // Example factor for gas
                          } kg CO2e
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ActivityTracking_Energy;