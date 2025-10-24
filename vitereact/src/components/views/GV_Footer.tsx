import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Facebook } from 'lucide-react';

const GV_Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">EcoTrack</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="block text-gray-300 hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="block text-gray-300 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="block text-gray-300 hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social Media Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex justify-start space-x-6">
              <a
                href="https://twitter.com/eco_track"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors duration-200"
              >
                <Twitter size={24} />
              </a>
              
              <a
                href="https://instagram.com/eco_track"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pink-300 transition-colors duration-200"
              >
                <Instagram size={24} />
              </a>
              
              <a
                href="https://facebook.com/eco_track"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-500 transition-colors duration-200"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GV_Footer;