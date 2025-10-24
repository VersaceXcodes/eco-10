import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_EducationalContent_Impact: React.FC = () => {
  // Authentication state
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Fetch impact explanations (category: impact)
  const { data: impactData, isLoading, isError } = useQuery({
    queryKey: ['impact_explanations'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/tips`, {
        params: { category: 'impact' }
      });
      return response.data;
    },
    select: (data) => ({
      items: data.items
       .filter(item => item.category === 'impact')
       .map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          media_url: item.featured_image_url || 'https://picsum.photos/400'
        }))
    }),
    staleTime: 60000,
    retry: 1,
  });

  // Fetch related tips (category: tips)
  const { data: tipsData, isLoading: tipsLoading, isError: tipsError } = useQuery({
    queryKey: ['related_tips'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/tips`, {
        params: { category: 'tips' }
      });
      return response.data;
    },
    select: (data) => data.items,
    staleTime: 60000,
    retry: 1,
  });

  // Modal state management
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle explanation selection
  const handleExplanationClick = (explanation) => {
    setSelectedExplanation(explanation);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExplanation(null);
  };

  // Combined loading state
  const isLoadingContent = isLoading || tipsLoading;
  const hasError = isError || tipsError;

  return (
    <>
      {/* Main Container */}
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header className="bg-white shadow border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Impact Explained</h1>
              <div className="flex items-center space-x-4">
                {/* Add any header actions if needed */}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Impact Explanations Grid */}
          <section className="space-y-12">
            <h2 className="text-2xl font-semibold text-gray-700">Environmental Impact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {impactData?.items?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow-lg shadow-gray-200/10 rounded-xl overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-102"
                  onClick={() => handleExplanationClick(item)}
                >
                  <div className="relative h-48">
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover rounded-t-xl transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 mt-2 leading-relaxed">{item.content.substring(0, 120)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Related Tips Section */}
          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700">Related Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tipsData?.items?.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white shadow-lg shadow-gray-200/10 rounded-xl p-6 transition-all duration-200 hover:shadow-xl hover:scale-102"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">{tip.title}</h4>
                    <span className="text-sm text-gray-500">⭐️ {Math.floor(Math.random() * 5) + 1}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">{tip.content.substring(0, 150)}...</p>
                  <Link
                    to={`/learn/tips/${tip.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Explanation Detail Modal */}
        {isModalOpen && selectedExplanation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-8">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-700 hover:text-gray-900"
              >
                &times;
              </button>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex-1">{selectedExplanation.title}</h2>
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  🌍
                </div>
              </div>
              
              <img
                src={selectedExplanation.media_url}
                alt={selectedExplanation.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{selectedExplanation.content}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-blue-700 font-semibold">Key Takeaway:</h3>
                  <p className="mt-2 text-gray-800">{selectedExplanation.content.substring(0, 200)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingContent && (
          <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-40">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-transparent border-b-blue-600"></div>
              <span className="text-blue-600 text-lg font-semibold">Loading educational content...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-40">
            <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8A4 4 0 018 12H2a4 4 0 014 0H12a4 4 0 018 0l2 3V17h1.5a1 1 0 100-2H15v-3M4 7a3 3 0 013 3v1m-3-1a3 3 0 013-3V7m0 4v4l.082.03a.75.75 0 001.02 0l.066-.03V4M21 7a3 3 0 013 3v1m-3-1a3 3 0 013-3V7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-700">Failed to load content</h2>
              <p className="text-red-600 mt-2">Please check your connection and try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
              >
                Reload
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_EducationalContent_Impact;