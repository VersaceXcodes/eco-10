import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Zustand store selectors (individual to prevent infinite loops)
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoadingAuth = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const errorMessage = useAppStore(state => state.authentication_state.error_message);
  const loginUser = useAppStore(state => state.login_user);
  const registerUser = useAppStore(state => state.register_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  // Local state for modals and forms
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error when modals are closed
  const handleCloseModals = () => {
    clearAuthError();
    setEmail('');
    setPassword('');
    setName('');
  };

  // Login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    try {
      await loginUser(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Signup form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    try {
      await registerUser(email, password, name);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-green-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Track Your Impact, <span className="text-blue-600">EcoTrack</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Start your journey to a sustainable lifestyle with personalized insights, 
              actionable goals, and a supportive community.
            </p>
            <div className="mt-12">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:gap-8">
            <div className="mt-10">
              <div className="flex items-center justify-center">
                <div className="bg-gray-50 p-6 rounded-xl shadow-md w-full max-w-md mx-auto">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M7 12h.01M9 12h.01M11 12h.01M13 12h.01M15 12h.01M17 12h.01M19 12h.01M21 12h.01" />
                    </svg>
                    <h3 className="text-xl font-bold mt-4">Jane Doe</h3>
                    <p className="text-gray-600 mt-2">"EcoTrack helped me reduce my carbon footprint by 30% in just 3 months!"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why EcoTrack?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0111 4h2a9.007 9.007 0 011 2.224l5.146 4.288a9.023 9.023 0 011.02 2.22l-6 5.234a9.032 9.032 0 01-2.1 0l-6-5.234a9.025 9.025 0 01-1.02-2.22l5.146-4.288a9.007 9.007 0 01-1.02-2.224H7a1 1 0 100 2 1 1 0 000-2M7 19h4l1 2h4a1 1 0 100 2 1 1 0 000-2h-4l-1-2H7a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mt-4">Activity Tracking</h3>
                  <p className="text-gray-600 mt-2">Easily log your daily activities and see your environmental impact in real-time.</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 011 18m0-5v3.5a4.5 4.5 0 00-9 0V7a4.5 4.5 0 009 0v3.5M5.5 20a1.5 1.5 0 012 0v-6a1.5 1.5 0 10-3 0v6a1.5 1.5 0 01-2 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold mt-4">Goal Setting</h3>
                  <p className="text-gray-600 mt-2">Create and track personalized sustainability goals with progress visualizations.</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5a1 1 0 002-1v-3M5 3h14a1 1 0 002-1h3a1 1 0 100-2h-3a1 1 0 00-1-1h-6a1 1 0 110-2h6a1 1 0 100 2h3a1 1 0 002-1V5M9 16.08l-6.34 6.34M15 11.42l-2.83 2.83m4-5.34l-2.83-2.83M6 16v-3a2 2 0 11-4 0v3a2 2 0 011 1.34l5.25-5.25a2 2 0 011 1.34v3a2 2 0 01-2 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold mt-4">Community</h3>
                  <p className="text-gray-600 mt-2">Join challenges, share achievements, and connect with like-minded users.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="relative w-full max-w-md mx-auto my-12 bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Login</h2>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAuth? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="relative w-full max-w-md mx-auto my-12 bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Account</h2>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            <form onSubmit={handleSignup}>
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAuth? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      })

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-gray-800">EcoTrack</h3>
              <p className="text-sm text-gray-600 mt-1">Empowering sustainable living</p>
            </div>
            <div className="flex space-x-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600">About</h4>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link to="#" className="text-sm text-gray-500 hover:text-gray-900">Our Mission</Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600">Contact</h4>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="mailto:support@ecotrack.com" className="text-sm text-gray-500 hover:text-gray-900">support@ecotrack.com</a>
                  </li>
                  <li>
                    <a href="https://twitter.com/ecotrack" className="text-sm text-gray-500 hover:text-gray-900">Twitter</a>
                  </li>
                  <li>
                    <a href="https://instagram.com/ecotrack" className="text-sm text-gray-500 hover:text-gray-900">Instagram</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default UV_Landing;