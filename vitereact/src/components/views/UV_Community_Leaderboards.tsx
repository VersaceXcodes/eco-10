import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UV_Community_Leaderboards: React.FC = () => {
  // State management
  const [selectedFilter, setSelectedFilter] = useState('global');
  const [showShareModal, setShowShareModal] = useState(false);

  // Query configuration
  const queryKey = ['leaderboard', selectedFilter];
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/v1/leaderboards`, {
        params: { filter: selectedFilter },
      });
      
      // Apply data transformation as per datamap specification
      return {
        items: response.data.items.map((item, index) => ({
          user_id: item.user_id,
          impact_score: parseFloat(item.monthly_score),
          rank: index + 1,
        })),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Filter change handler
  const handleFilterChange = (newFilter: string) => {
    setSelectedFilter(newFilter);
  };

  // Share button handlers
  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-2 border-transparent border-t-blue-700 rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col items-center">
            <svg className="h-10 w-10 text-red-500 mb-4" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m9.28-4.83a47.48 47.48 0 00-11 5.4l-1.4 1.4a8 8 0 013.6 3.6l1.4-1.4a47.48 47.48 0 0111-5.4 1.28 1.28 0 014 0zM7.2 10.2a47.48 47.48 0 01-11 5.4l-1.4 1.4a8 8 0 0112.8 0l1.4-1.4a47.48 47.48 0 0111-5.4zM16 12a4 4 0 00-4 4v4a4 4 0 008 0v-4a4 4 0 00-4-4z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Error Loading Leaderboard</h2>
            <p className="mt-2 text-gray-600 max-w-sm text-center">There was a problem fetching the leaderboard data. Please try again.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Impact Leaderboards</h1>
          </div>
        </header>

        {/* Filter Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={() => handleFilterChange('global')}
              className={`px-6 py-2 rounded-lg ${selectedFilter === 'global'? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Global Filter"
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('friends')}
              className={`px-6 py-2 rounded-lg ${selectedFilter === 'friends'? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Friends Filter"
            >
              Friends
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('local')}
              className={`px-6 py-2 rounded-lg ${selectedFilter === 'local'? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Local Filter"
            >
              Local
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-700">Top Contributors</h2>
            </div>
            
            <ul className="dividing-lines">
              {data?.items?.map((item, index) => (
                <li key={item.user_id} className="relative px-6 py-4 first:pt-6 last:pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center ${index === 0? 'bg-blue-100 text-blue-800' : index === 1? 'bg-silver-100 text-silver-800' : 'bg-gray-100 text-gray-800'}`}>
                        <span className="text-sm font-bold">{item.rank}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{item.user_id}</p>
                        <p className="text-sm text-gray-600">Impact Score: {item.impact_score.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Rank {item.rank}</span>
                      </div>
                    </div>
                  </div>
                  
                  {index < data.items.length - 1 && <hr className="border-gray-100"} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Share Button */}
        <div className="fixed bottom-4 right-4 z-10">
          <button
            onClick={handleShareClick}
            className="bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Share your leaderboard position"
          >
            <svg className="h-5 w-5 inline-flex" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 11V5a2 2 0 00-4 0v6m-6-1a5 5 0 11-10 0 5 5 0 016 0z" />
            </svg>
            <span className="ml-2">Share</span>
          </button>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Share Your Achievement</h2>
                <p className="mt-2 text-gray-600 max-w-sm mx-auto">Share your impact score with friends or on social media platforms.</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseShareModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  aria-label="Cancel sharing"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseShareModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Confirm sharing"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_Community_Leaderboards;