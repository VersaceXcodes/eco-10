import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const GV_SettingsPanel: React.FC = () => {
  // Zustand state selectors (CRITICAL: individual selectors)
  const settings = useAppStore(state => state.settings);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const updateSettings = useAppStore(state => state.update_settings);
  const logoutUser = useAppStore(state => state.logout_user);
  
  // Local form state (mirroring store state)
  const [notificationEmail, setNotificationEmail] = useState(settings.notification_preferences?.email?? true);
  const [notificationInApp, setNotificationInApp] = useState(settings.notification_preferences?.in_app?? true);
  const [preferredUnits, setPreferredUnits] = useState(settings.units);
  const [darkModeEnabled, setDarkModeEnabled] = useState(settings.dark_mode);

  // Mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const userId = currentUser?.id;
      if (!userId) throw new Error('User ID not available');
      
      return axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
        {
          notification_preferences: {
            email: notificationEmail,
            in_app: notificationInApp
          },
          preferences: {
            units: preferredUnits,
            dark_mode: darkModeEnabled
          }
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
    },
    onSuccess: () => {
      // Update local state in store
      updateSettings({
        notification_preferences: {
          email: notificationEmail,
          in_app: notificationInApp
        },
        units: preferredUnits,
        dark_mode: darkModeEnabled
      });
    },
    onError: (error) => {
      console.error('Settings save failed:', error);
    }
  });

  // Handle form changes
  const handleNotificationChange = (type: 'email' | 'in_app', value: boolean) => {
    if (type === 'email') {
      setNotificationEmail(value);
    } else {
      setNotificationInApp(value);
    }
  };

  const handleUnitsChange = (units: string) => {
    setPreferredUnits(units);
  };

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkModeEnabled(enabled);
  };

  // Save settings handler
  const handleSaveSettings = async () => {
    await saveSettingsMutation.mutate();
  };

  // Logout handler
  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full md:w-96 lg:w-104 bg-white shadow-xl transition-all duration-300 ease-in-out transform origin-right">
      <div className="flex flex-col h-full">
        <header className="bg-white shadow-lg p-4">
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Notification Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-600">Email Notifications</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={notificationEmail} 
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors duration-200">
                    <div className={`absolute left-0 top-1/2 w-1/3 h-4 bg-blue-600 rounded-full transform -translate-y-1/2 ${notificationEmail? 'translate-x-full' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-gray-600">In-App Notifications</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={notificationInApp} 
                    onChange={(e) => handleNotificationChange('in_app', e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors duration-200">
                    <div className={`absolute left-0 top-1/2 w-1/3 h-4 bg-blue-600 rounded-full transform -translate-y-1/2 ${notificationInApp? 'translate-x-full' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Preferences</h3>
            
            <div className="space-y-4">
              {/* Units */}
              <div>
                <label className="block text-gray-600 mb-2">Measurement Units</label>
                <div className="flex justify-between space-x-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="units" 
                      value="metric" 
                      checked={preferredUnits === 'metric'} 
                      onChange={() => handleUnitsChange('metric')}
                      className="form-radio"
                    />
                    <span className="ml-2 text-gray-700">Metric (kg, km)</span>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="units" 
                      value="imperial" 
                      checked={preferredUnits === 'imperial'} 
                      onChange={() => handleUnitsChange('imperial')}
                      className="form-radio"
                    />
                    <span className="ml-2 text-gray-700">Imperial (lbs, miles)</span>
                  </div>
                </div>
              </div>
              
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <label className="text-gray-600">Dark Mode</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={darkModeEnabled} 
                    onChange={(e) => handleDarkModeChange(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors duration-200">
                    <div className={`absolute left-0 top-1/2 w-1/3 h-4 bg-blue-600 rounded-full transform -translate-y-1/2 ${darkModeEnabled? 'translate-x-full' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="pt-6 border-t border-gray-100">
            <div className="space-y-4">
              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isMutating}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveSettingsMutation.isMutating? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Settings'
                )}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-6 py-3 border border-red-500 text-base font-medium rounded-md text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GV_SettingsPanel;