import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';

// Schema for shopping log input
const shoppingLogInputSchema = z.object({
  product_name: z.string().min(1),
  purchase_date: z.string().date(),
  receipt_url: z.string().uri().optional(),
  eco_rating: z.string().optional(),
});

// Interface for shopping log entity
interface ShoppingLogEntity {
  id: string;
  user_id: string;
  product_name: string;
  eco_rating: string | null;
  purchase_date: string;
  receipt_url: string | null;
}

// Mock product lookup response
const mockProductLookup = {
  product_name: 'Organic Cotton T-Shirt',
  eco_rating: 'eco-friendly',
};

const UV_ActivityTracking_Shopping: React.FC = () => {
  // Zustand state and methods
  const user_id = useAppStore(state => state.authentication_state.current_user?.id);
  const shopping_logs = useAppStore(state => state.shopping_logs);
  const set_shopping_logs = useAppStore(state => state.set_shopping_logs);
  
  // Local form state
  const [form, setForm] = useState({
    product_name: '',
    purchase_date: '',
    receipt_url: '',
    eco_rating: 'unknown',
  });
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutation for creating shopping log
  const createShoppingLogMutation = useMutation({
    mutationFn: newLog => {
      return axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/shopping_logs`,
        newLog
      );
    },
    onSuccess: (data) => {
      set_shopping_logs(prev => [...prev, data.data]);
      setForm({ product_name: '', purchase_date: '', receipt_url: '', eco_rating: 'unknown' });
      setError(null);
    },
    onError: (error) => {
      setError('Failed to save shopping log');
    },
  });

  // Mutation for barcode scan (simulated)
  const scanBarcodeMutation = useMutation({
    mutationFn: () => {
      // Simulate barcode scan result
      return Promise.resolve(mockProductLookup);
    },
    onSuccess: (result) => {
      setForm(prev => ({
       ...prev,
        product_name: result.product_name,
        eco_rating: result.eco_rating || 'unknown'
      }));
      setBarcodeScanning(false);
    },
    onError: () => {
      setError('Barcode scan failed');
    },
  });

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Validate form data
      const parsed = shoppingLogInputSchema.parse(form);
      
      // Prepare API payload
      const newLog = {
        user_id,
       ...parsed,
        eco_rating: parsed.eco_rating || 'unknown'
      };
      
      // Execute mutation
      await createShoppingLogMutation.mutate(newLog);
    } catch (err) {
      setError('Invalid form data');
    }
  };

  // Barcode scan handler
  const handleBarcodeScan = () => {
    setBarcodeScanning(true);
    scanBarcodeMutation.mutate();
  };

  // Form change handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  // Date picker change handler
  const handleDateChange = (date: string) => {
    setForm(prev => ({...prev, purchase_date: date }));
  };

  // Eco-rating change handler
  const handleEcoRatingChange = (rating: string) => {
    setForm(prev => ({...prev, eco_rating: rating }));
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Activity Tracking</h1>
            <p className="mt-2 text-gray-600">
              Record your purchases to track their environmental impact
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* Form Section */}
          <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6 lg:p-8 mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Log New Purchase</h2>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  id="product_name"
                  name="product_name"
                  type="text"
                  value={form.product_name}
                  onChange={handleFormChange}
                  required
                  className="relative w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className="relative w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Receipt URL */}
              <div>
                <label htmlFor="receipt_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt URL (optional)
                </label>
                <input
                  id="receipt_url"
                  name="receipt_url"
                  type="url"
                  value={form.receipt_url}
                  onChange={handleFormChange}
                  className="relative w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Eco Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eco Rating
                </label>
                <div className="flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="eco_rating"
                      value="eco-friendly"
                      checked={form.eco_rating === 'eco-friendly'}
                      onChange={() => handleEcoRatingChange('eco-friendly')}
                      className="mr-0.5"
                    />
                    Eco-friendly
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="eco_rating"
                      value="non-eco"
                      checked={form.eco_rating === 'non-eco'}
                      onChange={() => handleEcoRatingChange('non-eco')}
                      className="mr-0.5"
                    />
                    Non-Eco
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="eco_rating"
                      value="unknown"
                      checked={form.eco_rating === 'unknown'}
                      onChange={() => handleEcoRatingChange('unknown')}
                      className="mr-0.5"
                    />
                    Unknown
                  </label>
                </div>
              </div>

              {/* Submit and Barcode Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  disabled={barcodeScanning}
                  className="px-6 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  {barcodeScanning? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </span>
                  ) : (
                    'Scan Barcode'
                  )}
                </button>
                
                <button
                  type="submit"
                  disabled={createShoppingLogMutation.isLoading}
                  className="px-6 py-2 border border-transparent text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  {createShoppingLogMutation.isLoading? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Purchase'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Shopping History */}
          <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6 lg:p-8 mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase History</h2>
            
            {shopping_logs.length === 0? (
              <div className="text-center py-8">
                <p className="text-gray-600">No purchases logged yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shopping_logs.map(log => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-grow">
                      <h3 className="text-sm font-medium text-gray-900">{log.product_name}</h3>
                      <p className="text-sm text-gray-600">{new Date(log.purchase_date).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="ml-4 flex items-center">
                      {/* Eco Rating Indicator */}
                      {log.eco_rating === 'eco-friendly'? (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Eco-friendly
                        </span>
                      ) : log.eco_rating === 'non-eco'? (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Non-Eco
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Unknown
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_ActivityTracking_Shopping;