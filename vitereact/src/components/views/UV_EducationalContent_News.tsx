import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const UV_EducationalContent_News: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const fetchNewsArticles = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v1/tips`, {
        params: { category: 'news' }
      });
      
      if (!response.data?.items ||!Array.isArray(response.data.items)) {
        throw new Error('Invalid response format from API');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch news articles: ${error.message}`);
    }
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news-articles'],
    queryFn: fetchNewsArticles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    keepPreviousData: true,
  });

  // Transform API response to news article structure
  const newsArticles = data?.items
   ? data.items
       .filter(item => item.category === 'news')
       .map(item => ({
          id: item.id,
          title: item.title,
          excerpt: item.content?.substring(0, 150) + "...",
          source: "EcoWatch",
          url: `https://example.com/news/${item.id}`
        }))
    : [];

  // Filter articles by search keyword
  const filteredArticles = newsArticles.filter(article =>
    article.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Eco News Feed
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative group focus-within:ring-2 focus-within:ring-blue-500">
          <label htmlFor="search" className="sr-only">
            Search news articles
          </label>
          <input
            id="search"
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
            }}
            placeholder="Search by keyword..."
            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900"
            aria-label="Search news articles"
          />
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            🔍
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && (
          <div className="flex justify-center items-center min-h-64">
            <div className="flex items-center space-x-4">
              <svg className="animate-spin h-8 w-8 text-gray-500" 
                  viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" 
                    stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    fill="currentColor"></path>
              </svg>
              <p className="text-gray-600">Loading news articles...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="text-center text-red-600 py-8">
            <div className="lg:text-xl text-lg">
              Error loading news articles. Please try again later.
            </div>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading &&!isError && filteredArticles.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <div className="lg:text-xl text-lg">
              No articles found matching your search.
            </div>
            <button
              onClick={() => setSearchKeyword('')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Show All Articles
            </button>
          </div>
        )}

        {!isLoading &&!isError && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map(article => (
              <div 
                key={article.id} 
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {article.title}
                  </a>
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {article.excerpt}
                </p>
                
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Source:</span> {article.source}
                </div>
                
                <div className="mt-4">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Read More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UV_EducationalContent_News;