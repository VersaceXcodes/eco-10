import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_ActivityTracking_Waste: React.FC = () => {
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const wasteLogs = useAppStore(state => state.waste_logs);
  const setWasteLogs = useAppStore(state => state.set_waste_logs);

  // Local form state
  const [wasteType, setWasteType] = useState('recycling');
  const [quantity, setQuantity] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation for submitting waste log
  const { mutate, isLoading, error: queryError } = useMutation({
    mutationFn: (newLog) => {
      const token = currentUser?.auth_token;
      return axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/waste_logs`,
        newLog,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    },
  }, {
    onSuccess: (data) => {
      setWasteLogs(prev => [...prev, data]);
      setWasteType('recycling');
      setQuantity('');
      setPhoto(null);
      setDate(new Date().toISOString().split('T')[0]);
      setError(null);
    },
    onError: (err) => {
      setError('Failed to save waste log. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!wasteType ||!quantity) {
      setError('Please select waste type and enter quantity.');
      return;
    }

    const newLog = {
      user_id: currentUser?.id || '',
      waste_type: wasteType,
      quantity: Number(quantity),
      photo_url: photo? URL.createObjectURL(photo) : null,
      date: date,
    };

    mutate(newLog);
    setIsSubmitting(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhoto(e.target.files[0]);
    } else {
      setPhoto(null);
    }
  };

  const handleInputChange = () => {
    if (error) setError(null);
  };

  // Filter logs for the current week
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

  const weeklyLogs = wasteLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= currentWeekStart && logDate < currentWeekEnd;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Waste</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Waste Type Selection */}
          <div className="space-y-2">
            <legend className="text-lg font-semibold text-gray-700">Waste Type</legend>
            <div className="space-x-4">
              {['recycling', 'compost', 'landfill'].map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="wasteType"
                    value={type}
                    checked={wasteType === type}
                    onChange={(e) => {
                      if (e.target.checked) setWasteType(type);
                      handleInputChange();
                    }}
                    className="sr-only"
                  />
                  <span className={`px-4 py-2 rounded-md border border-gray-300 bg-white shadow-sm text-sm font-medium text-gray-800 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity (kg)
            </label>
            <input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                handleInputChange();
              }}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter quantity"
            />
          </div>

          {/* Photo Upload */}
          <div className="border border-gray-300 p-4 rounded-md">
            <legend className="text-sm font-medium text-gray-700">Photo (Optional)</legend>
            <div className="mt-1 flex items-center space-x-4">
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="photo"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {photo? photo.name : 'Upload Photo'}
              </label>
              <span className="text-sm text-gray-500">JPG, PNG, up to 5MB</span>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                handleInputChange();
              }}
              max={new Date().toISOString().split('T')[0]}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading ||!currentUser}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                'Save Waste Log'
              )}
            </button>
          </div>

          {/* Error Display */}
          {(error || queryError) && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
              {error || queryError?.message || 'An error occurred. Please try again.'}
            </div>
          )}
        </form>

        {/* Weekly Summary */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Quantity (kg)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklyLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${log.waste_type === 'recycling'? 'bg-blue-100 text-blue-800' : log.waste_type === 'compost'? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.waste_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.quantity}</td>
                  </tr>
                ))}
                {weeklyLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-gray-500">
                      No logs found for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UV_ActivityTracking_Waste;