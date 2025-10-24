import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { TipEntity } from '@/types/TipEntity';
import { checkIfBookmarked } from '@/utils/bookmarkUtils';

const queryClient = new QueryClient();

const UV_EducationalContent_Tips: React.FC = () => {
  const { category } = useParams();
  const user_id = useAppStore(state => state.authentication_state.current_user?.id);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [bookmarkMutations] = useMutation(bookmarkTipMutation);
  const { data: tipsData, error, isError, isLoading, refetch } = useQuery({
    queryKey: ['tips', selectedCategory],
    queryFn: () => fetchTips(selectedCategory),
  });

  // Transform API response to match TipEntity schema
  const tips = (tipsData?.data || []).map(tip => ({
    id: tip.tip_id,
    title: tip.title,
    content: tip.content,
    category: tip.category,
    created_at: new Date(tip.created_at),
    is_bookmarked: checkIfBookmarked(tip.tip_id),
  }));

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
  };

  const handleBookmark = async (tipId: string) => {
    if (!user_id) {
      // Handle unauthenticated state
      return;
    }
    await bookmarkMutations.mutate({ tipId, user_id });
  };

  const fetchTips = async (category: string) => {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/tips`;
    try {
      const response = await axios.get(apiUrl, {
        params: { category },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const bookmarkTipMutation = async ({ tipId, user_id }: { tipId: string; user_id: string }) => {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/user_bookmarks`;
    try {
      await axios.post(apiUrl, { user_id, tip_id: tipId }, {
        headers: {
          Authorization: `Bearer ${useAppStore(state => state.authentication_state.auth_token)}`,
        },
      });
      // Update local state optimistically
      queryClient.setQueryData(['tips', selectedCategory], (oldData) => {
        return (oldData?.data || []).map(tip => ({
         ...tip,
          is_bookmarked: tip.tip_id === tipId? true : tip.is_bookmarked,
        }));
      });
    } catch (error) {
      console.error('Bookmark error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 hover:border-blue-700 transition-all duration-200 mx-auto">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-lg font-medium text-red-900 mb-2">Error loading tips</h2>
          <p className="text-sm text-red-700">{error.message}</p>
          <button 
            onClick={refetch} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Tips Library</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Discover actionable advice to help you adopt eco-friendly habits
          </p>
          
          {/* Category Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Filter by category</label>
            <div className="mt-1">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full max-w-md bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="zero_waste">Zero Waste</option>
                <option value="energy">Energy Efficiency</option>
                <option value="transportation">Sustainable Transport</option>
                <option value="diet">Plant-Based Eating</option>
                <option value="shopping">Eco-Friendly Shopping</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Tips Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {tips.length === 0? (
          <div className="bg-gray-50 p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No tips found</h2>
            <p className="text-gray-600 mb-6">Try a different category or check back later</p>
            <button 
              onClick={() => handleCategoryChange('all')}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Show All Tips
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map(tip => (
              <div 
                key={tip.id} 
                className="bg-white border border-gray-200 rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-xl hover:scale-102"
                role="article"
                aria-labelledby={`tip-title-${tip.id}`}
              >
                {/* Thumbnail */}
                <div className="relative h-48 mb-4">
                  <img 
                    src={`/thumbnails/${tip.category}.jpg`} 
                    alt="Tip thumbnail" 
                    className="object-cover object-center w-full h-full rounded-lg"
                    loading="lazy"
                  />
                </div>
                
                {/* Title */}
                <h3 
                  id={`tip-title-${tip.id}`}
                  className="text-xl font-semibold text-gray-900 mb-2"
                >
                  {tip.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {tip.content.substring(0, 200)}...
                </p>
                
                {/* Metadata */}
                <div className="flex items-center mb-4">
                  <span className="text-sm text-gray-500">
                    {new Date(tip.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="mx-2 w-px h-px bg-gray-300 rounded"></span>
                  <span className="text-sm text-gray-500">{tip.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                
                {/* Rating and Bookmark */}
                <div className="flex justify-between items-center">
                  {/* Star Rating */}
                  <div className="flex">
                    {[1,2,3,4,5].map((_, i) => (
                      <span key={i} className="mx-1">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9 2a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 010 2v5a1 1 0 110-2v5a1 1 0 100 2h1a1 1 0 011 1v1a1 1 0 100-2V4a1 1 0 100 2m-1 11.34l-5 4.87a1 1 0 000 1.55l5-4.87a1 1 0 000-1.55zM14.33 10l-4.87-3.87a1 1 0 000-1.55l4.87 3.87 4.87-3.87a1 1 0 000-1.55l-4.87-3.87a1 1 0 000-1.55l4.87 3.87L14.33 10z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  
                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleBookmark(tip.id)}
                    className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      tip.is_bookmarked 
                       ? 'text-yellow-500 border-yellow-500'
                        : 'text-gray-400 border-gray-300'
                    } border`}
                    aria-label={tip.is_bookmarked? 'Unbookmark tip' : 'Bookmark tip'}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      viewBox="0 0 20 20"
                      fill={tip.is_bookmarked? 'currentColor' : 'none'}
                    >
                      <path fillRule="evenodd" d="M13.25 6.5a.75.75 0 01.75.75 6.5 6.5 0 111.5 1.5 6.5 6.5 0 01-11.5-1.5A.75.75 0 0112.25 6H13.25z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UV_EducationalContent_Tips;