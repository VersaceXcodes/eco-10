import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

// Local type extension for notification with action button
interface EnhancedNotification extends Notification {
  action_button?: {
    text: string;
    url: string;
  };
}

const GV_NotificationBanner: React.FC = () => {
  // Get notifications from store
  const notifications = useAppStore(state => state.notifications);
  const clearNotifications = useAppStore(state => state.clear_notifications);

  // Return null if no notifications
  if (notifications.length === 0) return null;

  // Get the most recent notification (last in array)
  const currentNotification = notifications[notifications.length - 1] as EnhancedNotification;

  // Handle dismissal
  const handleDismiss = () => {
    clearNotifications();
  };

  // Handle action button click
  const handleAction = () => {
    if (currentNotification.action_button?.url) {
      window.location.href = currentNotification.action_button.url;
    }
    handleDismiss(); // Clear notification after action
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200 px-4 py-3 transition-all duration-300 ease-out">
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        <div className="flex-grow">
          <p className="text-sm text-gray-800">{currentNotification.message}</p>
          {currentNotification.action_button && (
            <button
              onClick={handleAction}
              className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              {currentNotification.action_button.text}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default GV_NotificationBanner;