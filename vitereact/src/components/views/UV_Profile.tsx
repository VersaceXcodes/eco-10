import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Profile: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logoutUser = useAppStore(state => state.logout_user);
  const updateCurrentUser = useAppStore(state => state.update_user_profile);

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/users/${currentUser?.id}`,
        {
          headers: {
            Authorization: `Bearer ${currentUser?.auth_token}`,
          },
        }
      );
      return response.data;
    },
  });

  // Mutation to update user profile
  const [updateProfile, { isLoading: isUpdating, error: updateError }] = useMutation({
    mutationFn: async (newData) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/users/${currentUser?.id}`,
        newData,
        {
          headers: {
            Authorization: `Bearer ${currentUser?.auth_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      updateCurrentUser(data);
    },
  });

  // Form state
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    location: userProfile?.location || '',
    eco_interests: Array.isArray(userProfile?.eco_interests) 
     ? userProfile?.eco_interests 
      : userProfile?.eco_interests 
       ? [userProfile?.eco_interests] 
        : [],
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatarUrl || null);
  const [newInterest, setNewInterest] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: value }));
    setErrors(null);
  };

  const handleInterestAdd = () => {
    if (newInterest.trim()) {
      setForm(prev => ({
       ...prev,
        eco_interests: [...prev.eco_interests, newInterest.trim()]
      }));
      setNewInterest('');
      setErrors(null);
    }
  };

  const handleInterestRemove = (index: number) => {
    setForm(prev => ({
     ...prev,
      eco_interests: prev.eco_interests.filter((_, i) => i!== index)
    }));
    setErrors(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({...prev, avatar: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const updatedData = {
      name: form.name,
      location: form.location,
      eco_interests: form.eco_interests,
    };

    try {
      await updateProfile(updatedData);
      // Reset avatar and preview
      setForm(prev => ({...prev, avatar: null }));
      setAvatarPreview(null);
    } catch (error) {
      setErrors(error.message || 'Failed to update profile');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutUser();
  };

  // Loading state
  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">User not found</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/settings"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Profile Form */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>
            {profileError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
                <p className="text-sm text-red-700">{profileError.message}</p>
              </div>
            )}
            {updateError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
                <p className="text-sm text-red-700">{updateError.message}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="relative w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleInputChange}
                  className="relative w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Eco Interests */}
              <div>
                <label htmlFor="eco_interests" className="block text-sm font-medium text-gray-700 mb-2">
                  Eco Interests
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.eco_interests.map((interest, index) => (
                    <div key={index} className="flex items-center bg-gray-200 rounded-full px-3 py-1">
                      <span className="text-sm text-gray-700">{interest}</span>
                      <button
                        type="button"
                        onClick={() => handleInterestRemove(index)}
                        className="ml-1 text-red-500 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newInterest.trim()) {
                        handleInterestAdd();
                      }
                    }}
                    placeholder="Add new interest..."
                    className="flex-1 relative w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleInterestAdd}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ➕
                  </button>
                </div>
              </div>

              {/* Avatar */}
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  {avatarPreview? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  <label
                    htmlFor="avatar"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Upload
                  </label>
                  <input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {isUpdating? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Badges Section */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Badges</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">No badges earned yet.</p>
            </div>
          </div>

          {/* Activity History Section */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">No recent activity found.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_Profile;