import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { Link } from 'react-router-dom';

const GV_BarcodeScanner: React.FC = () => {
  const [scanningActive, setScanningActive] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{
    product_id: string;
    name: string;
    eco_score: number;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get current user from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const setShoppingLogs = useAppStore(state => state.set_shopping_logs);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera when scanning is activated
  useEffect(() => {
    if (scanningActive &&!cameraError) {
      navigator.mediaDevices.getUserMedia({ video: true })
       .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
       .catch(error => {
          setCameraError('Camera access denied or unavailable');
        });
    }
  }, [scanningActive]);

  // Simulate barcode scanning
  useEffect(() => {
    if (scanningActive &&!scannedProduct) {
      const scanTimeout = setTimeout(() => {
        // Mock successful scan
        setScannedProduct({
          product_id: 'mock-12345',
          name: 'Eco-Friendly Product',
          eco_score: 8.5
        });
      }, 3000);
      
      return () => clearTimeout(scanTimeout);
    }
  }, [scanningActive, scannedProduct]);

  const handleStartScanning = () => {
    setScanningActive(true);
    setScannedProduct(null);
    setCameraError(null);
  };

  const handleCancelScanning = () => {
    setScanningActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmitScannedData = async () => {
    if (!currentUser ||!scannedProduct) return;

    setIsSubmitting(true);
    
    try {
      const ecoFriendly = scannedProduct.eco_score > 7;
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/shopping_logs`,
        {
          user_id: currentUser.id,
          product_id: scannedProduct.product_id,
          eco_friendly: ecoFriendly
        }
      );

      // Transform response to shopping log format
      const shoppingLog = {
        id: response.data.id,
        user_id: response.data.user_id,
        product_name: scannedProduct.name,
        eco_rating: ecoFriendly? 'eco-friendly' : 'not-eco-friendly',
        purchase_date: new Date().toISOString(),
        product_id: scannedProduct.product_id
      };

      // Update global shopping logs
      setShoppingLogs(prev => [...prev, shoppingLog]);

      // Reset scanner state
      setScanningActive(false);
      setScannedProduct(null);
    } catch (error) {
      console.error('Error submitting scanned data:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center min-h-screen">
        {/* Camera View */}
        {scanningActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 object-cover"
            />
            
            {/* Scanner Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="bg-black opacity-50 w-64 h-32 border-4 border-blue-500 rounded-lg"></div>
              <div className="mt-6 space-x-4">
                <button
                  onClick={handleCancelScanning}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitScannedData}
                  disabled={!scannedProduct || isSubmitting}
                  className={`px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors ${
                    isSubmitting? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting? 'Submitting...' : 'Submit Scan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Controls */}
        {!scanningActive &&!cameraError && (
          <div className="absolute bottom-12 mx-auto text-center">
            <button
              onClick={handleStartScanning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Start Scanning
            </button>
            
            <div className="mt-4">
              <Link
                to="/track/shopping"
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Manual Entry
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600">
            <p className="text-lg font-bold mb-4">Camera Access Error</p>
            <p className="text-sm">{cameraError}</p>
            <div className="mt-4">
              <Link
                to="/track/shopping"
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Continue to Manual Entry
              </Link>
            </div>
          </div>
        )}

        {/* Scanned Product Preview */}
        {scannedProduct &&!scanningActive && (
          <div className="absolute bottom-12 mx-auto w-80 bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Scanned Product</h2>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Product ID:</strong> {scannedProduct.product_id}</p>
              <p className="text-gray-700"><strong>Name:</strong> {scannedProduct.name}</p>
              <p className="text-gray-700"><strong>Eco Score:</strong> {scannedProduct.eco_score}/10</p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleSubmitScannedData}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${
                  isSubmitting? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting? 'Saving...' : 'Confirm and Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GV_BarcodeScanner;