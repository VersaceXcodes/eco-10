import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { ForumEntity } from '@/types/generated';
import { z } from 'zod';
import axios from 'axios';

// ======================
// === SCHEMA DEFINITIONS ===
// ======================
const ForumSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  content: z.string(),
  user_id: z.string(),
  created_at: z.coerce.date(),
});

const PostSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
});

type Forum = z.infer<typeof ForumSchema>;
type Post = z.infer<typeof PostSchema>;

// ======================
// === CUSTOM HOOKS ===
// ======================
const useForums = (category?: string) => {
  return useQuery({
    queryKey: ['forums', category],
    queryFn: async () => {
      const response = await axios.get<Forum[]>(`${import.meta.env.VITE_API_BASE_URL}/api/v1/forums`, {
        params: { category },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

const useForumPosts = (forumId: string) => {
  return useQuery({
    queryKey: ['posts', forumId],
    queryFn: async () => {
      const response = await axios.get<Post[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/forums/${forumId}/posts`
      );
      return response.data;
    },
    enabled:!!forumId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

const createForumMutation = (queryClient: ReturnType<typeof useQueryClient>) => {
  return useMutation({
    mutationFn: (newForum) => {
      return axios.post<Forum>(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/forums`,
        newForum
      );
    },
    onMutate: (newForum) => {
      queryClient.setQueryData(['forums', newForum.category], (oldForums) => {
        return [...(oldForums || []), newForum];
      });
    },
    onError: (error, newForum, context) => {
      // Handle error rollback if needed
    },
    onSettled: () => {
      queryClient.invalidateQueries(['forums', newForum.category]);
    },
  });
};

const createPostMutation = (queryClient: ReturnType<typeof useQueryClient>) => {
  return useMutation({
    mutationFn: (payload) => {
      return axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/forums/${payload.forumId}/posts`,
        { content: payload.content }
      );
    },
    onMutate: (payload) => {
      queryClient.setQueryData(['posts', payload.forumId], (oldPosts) => {
        return [...(oldPosts || []), {
          id: `temp-${Math.random().toString(36).substr(2, 9)}`,
          user_id: payload.userId,
          content: payload.content,
          created_at: new Date(),
        }];
      });
    },
    onError: (error, payload, context) => {
      queryClient.setQueryData(['posts', payload.forumId], context?.oldData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['posts', payload.forumId]);
    },
  });
};

// ======================
// === COMPONENT ===
// ======================
const UV_Community_Forums: React.FC = () => {
  const [category, setCategory] = useState<string>('general');
  const [selectedForum, setSelectedForum] = useState<string>('');
  const [newForumTitle, setNewForumTitle] = useState<string>('');
  const [newForumContent, setNewForumContent] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  
  // Zustand store access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  // React Query hooks
  const queryClient = useQueryClient();
  const { data: forums, isLoading: forumsLoading, error: forumsError } = useForums(category);
  const { data: posts, isLoading: postsLoading, error: postsError } = useForumPosts(selectedForum);
  
  // Mutations
  const { mutate: createForum, isLoading: creatingForum } = createForumMutation(queryClient);
  const { mutate: createPost, isLoading: creatingPost } = createPostMutation(queryClient);

  // ======================
  // === EVENT HANDLERS ===
  // ======================
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSelectedForum('');
  };

  const handleForumSelection = (forumId: string) => {
    setSelectedForum(forumId);
    setNewPostContent('');
  };

  const handleCreateForum = () => {
    if (!currentUser) return;
    createForum({
      category,
      title: newForumTitle,
      content: newForumContent,
      user_id: currentUser.id,
    });
    setNewForumTitle('');
    setNewForumContent('');
  };

  const handleCreatePost = () => {
    if (!currentUser ||!selectedForum) return;
    createPost({
      forumId: selectedForum,
      content: newPostContent,
      userId: currentUser.id,
    });
    setNewPostContent('');
  };

  // ======================
  // === RENDER LOGIC ===
  // ======================
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Community Forums</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Category Filter */}
          <div className="md:col-span-1 hidden md:block">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General Discussion</option>
                <option value="zero-waste">Zero-Waste Living</option>
                <option value="sustainable-energy">Sustainable Energy</option>
                <option value="eco-business">Eco-Friendly Business</option>
              </select>
            </div>
          </div>

          {/* Forums List */}
          <div className="md:col-span-3">
            {/* Create Forum Form */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Forum</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Forum title"
                  value={newForumTitle}
                  onChange={(e) => setNewForumTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Forum content"
                  value={newForumContent}
                  onChange={(e) => setNewForumContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateForum}
                  disabled={creatingForum ||!newForumTitle ||!newForumContent}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingForum? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                          fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" 
                                stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Forum...
                    </span>
                  ) : (
                    'Create Forum'
                  )}
                </button>
              </div>
            </div>

            {/* Forums List */}
            {forumsLoading? (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ) : forumsError? (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="text-red-600">
                  Error loading forums: {forumsError.message}
                </div>
              </div>
            ) : forums?.length === 0? (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="text-gray-600">
                  No forums found in this category. Be the first to create one!
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Forums</h3>
                <div className="space-y-6">
                  {forums.map(forum => (
                    <div 
                      key={forum.id} 
                      className="cursor-pointer border-2 border-transparent hover:border-blue-500 p-4 rounded-lg transition-all"
                      onClick={() => handleForumSelection(forum.id)}
                    >
                      <h4 className="text-xl font-semibold text-gray-800">{forum.title}</h4>
                      <p className="text-gray-600 mt-1">{forum.content}</p>
                      <div className="mt-2 text-gray-500 text-sm">
                        {new Date(forum.created_at).toLocaleDateString()} • 
                        <span className="mx-2">•</span>
                        {forum.user_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Forum Posts */}
            {selectedForum && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Posts in {forums?.find(f => f.id === selectedForum)?.title || 'Selected Forum'}
                </h3>

                {/* Post Form */}
                <div className="mb-8">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Write your post..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreatePost}
                    disabled={creatingPost ||!newPostContent.trim()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingPost? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                              fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" 
                                  stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </span>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>

                {/* Posts List */}
                {postsLoading? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded p-2"></div>
                    <div className="h-8 bg-gray-200 rounded p-2"></div>
                    <div className="h-8 bg-gray-200 rounded p-2"></div>
                  </div>
                ) : postsError? (
                  <div className="text-red-600">
                    Error loading posts: {postsError.message}
                  </div>
                ) : posts?.length === 0? (
                  <div className="text-gray-600">
                    Be the first to post in this forum!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map(post => (
                      <div key={post.id} className="border border-gray-200 p-4 rounded-lg">
                        <div className="text-gray-800">{post.content}</div>
                        <div className="text-gray-500 text-sm mt-2">
                          {new Date(post.created_at).toLocaleDateString()} • 
                          <span className="mx-2">•</span>
                          User {post.user_id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Empty Spacer for Mobile */}
          <div className="md:hidden"></div>
        </div>
      </main>
    </div>
  );
};

export default UV_Community_Forums;