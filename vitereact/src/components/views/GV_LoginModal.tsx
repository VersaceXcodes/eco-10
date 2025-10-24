import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const GV_LoginModal: React.FC = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Store selectors (individual to prevent loops)
  const loginError = useAppStore(state => state.authentication_state.error_message);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const loginUser = useAppStore(state => state.login_user);
  const registerUser = useAppStore(state => state.register_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  // Clear error on input change
  const handleInputChange = () => {
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    if (!email ||!password) {
      console.error('Email and password are required');
      return;
    }

    if (isRegisterMode &&!name) {
      console.error('Name is required for registration');
      return;
    }

    try {
      if (isRegisterMode) {
        await registerUser(email, password, name);
      } else {
        await loginUser(email, password);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    clearAuthError();
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {isRegisterMode? 'Create Account' : 'Sign In'}
            </h2>
            <button 
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700"
              aria-label={isRegisterMode? 'Back to Login' : 'Create Account'}
            >
              {isRegisterMode? '← Back to Login' : '→ Create Account'}
            </button>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-700 mr-3" fill="none" viewBox="0 0 24 24">
                  <path d="M12 0C5.372 0 0 5.372 0 12c0 5.628 5.372 12 12 12s12-5.372 12-12C24 5.372 18.628 0 12 0z"></path>
                  <path d="M12 8.354l1.468 1.468 3.541-3.542m5.331 1.332C18.925 7.756 15.467 5 12 5c-5.192 0-7.601 3.801-6.464 8.944l7.332 2.114C19.601 15.1 22 12.702 22 9c0-3.303-4.997-6-9.3-6z"></path>
                </svg>
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    handleInputChange();
                  }}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInputChange();
                }}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegisterMode? "new-password" : "current-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                required
                minLength={8}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex justify-center py-2 px-4 border border-transparent rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isRegisterMode? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  isRegisterMode? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>

            <div className="text-sm flex justify-between">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500"
                onClick={toggleMode}
              >
                {isRegisterMode? 'Back to Login' : 'Need an account?'}
              </button>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500"
                disabled
                title="Coming soon - Social login not implemented"
              >
                Forgot Password?
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GV_LoginModal;