import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { FaTwitter, FaFacebook, FaInstagram, FaCopy } from 'react-icons/fa';
import './GV_ShareModal.css';

const GV_ShareModal: React.FC = () => {
  // Global state
  const userImpact = useAppStore(state => state.user_impact);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [shareContent, setShareContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate share content when component mounts or user impact changes
  useEffect(() => {
    if (currentUser && userImpact) {
      const impactScore = Math.max(
        userImpact.daily_score,
        userImpact.weekly_score,
        userImpact.monthly_score
      );
      
      const shareMessage = `I'm making a difference with EcoTrack! 🌍\n` +
        `My current impact score: ${impactScore}\n` +
        `#EcoTrack #Sustainability #GoGreen`;
      
      setShareContent(shareMessage);
    }
  }, [currentUser, userImpact]);

  // Handle sharing actions
  const handleShare = (platform: string) => {
    setSelectedPlatform(platform);
    
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent)}`
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
        );
        break;
      case 'instagram':
        alert('Instagram sharing requires native app. Copy link instead:');
        handleCopyLink();
        break;
      default:
        return;
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (error) {
      alert('Failed to copy link to clipboard');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Modal Trigger Button (for demonstration purposes) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition 
        duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-blue-500"
      >
        Share Progress
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden 
          p-6 md:p-8 transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Share Your Achievement</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                aria-label="Close modal"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18.75 6.25" />
                </svg>
              </button>
            </div>

            {/* Share Preview */}
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
                <h3 className="text-lg font-semibold text-gray-800">Share Preview</h3>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-gray-700">{shareContent}</p>
                <div className="flex space-x-2">
                  <span className="text-green-500 text-xl">🌱</span>
                  <span className="text-blue-500 text-xl">🌍</span>
                  <span className="text-yellow-500 text-xl">⚡</span>
                </div>
              </div>
            </div>

            {/* Sharing Options */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleShare('twitter')} 
                className="flex flex-col items-center p-4 bg-blue-100 rounded-lg 
                hover:bg-blue-200 transition-colors group"
              >
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center 
                transition-transform duration-200 ease-in-out group-hover:scale-105">
                  <FaTwitter className="text-white text-xl" />
                </div>
                <p className="mt-3 text-sm font-medium text-blue-800 group-hover:text-blue-600">
                  Twitter
                </p>
              </button>

              <button 
                onClick={() => handleShare('facebook')} 
                className="flex flex-col items-center p-4 bg-blue-100 rounded-lg 
                hover:bg-blue-200 transition-colors group"
              >
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center 
                transition-transform duration-200 ease-in-out group-hover:scale-105">
                  <FaFacebook className="text-white text-xl" />
                </div>
                <p className="mt-3 text-sm font-medium text-blue-800 group-hover:text-blue-600">
                  Facebook
                </p>
              </button>

              <button 
                onClick={() => handleShare('instagram')} 
                className="flex flex-col items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 
                rounded-lg hover:from-purple-200 hover:to-pink-200 transition-colors group"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-full 
                flex items-center justify-center transition-transform duration-200 ease-in-out 
                group-hover:scale-105">
                  <FaInstagram className="text-white text-xl" />
                </div>
                <p className="mt-3 text-sm font-medium text-purple-800 group-hover:text-purple-700">
                  Instagram
                </p>
              </button>

              <button 
                onClick={handleCopyLink} 
                className="flex flex-col items-center p-4 bg-gray-100 rounded-lg 
                hover:bg-gray-200 transition-colors group"
              >
                <div className="bg-gray-600 w-12 h-12 rounded-full flex items-center justify-center 
                transition-transform duration-200 ease-in-out group-hover:scale-105">
                  <FaCopy className="text-white text-xl" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-800 group-hover:text-gray-600">
                  {copied? 'Copied!' : 'Copy Link'}
                </p>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium 
                hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GV_ShareModal;