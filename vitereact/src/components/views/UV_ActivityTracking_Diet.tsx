import React, { useState, useRef } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Define meal type options
const MEAL_TYPES = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'other', label: 'Other' }
];

// Impact score calculation (simplified example)
const calculateImpactScore = (mealType: string): number => {
  const impactMap = {
    vegan: 1.0,
    vegetarian: 1.5,
    pescatarian: 2.0,
    omnivore: 3.0,
    other: 2.5
  };
  return impactMap[mealType] || 2.5;
};

// Diet log schema
const DietLogSchema = z.object({
  id: z.string(),
  meal_type: z.string(),
  date: z.string().datetime(),
  impact_score: z.number(),
  receipt_url: z.string().nullable()
});

type DietLog = z.infer<typeof DietLogSchema>;

// Form input schema
const DietLogInputSchema = z.object({
  meal_type: z.string(),
  date: z.string().datetime(),
  receipt_url: z.string().nullable()
});

type DietLogInput = z.infer<typeof DietLogInputSchema>;

const queryClient = new QueryClient();

const UV_ActivityTracking_Diet: React.FC = () => {
  // Zustand store access
  const user_id = useAppStore(state => state.authentication_state.current_user?.id);
  const setDietLogs = useAppStore(state => state.set_diet_logs);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  // Local form state
  const [newDietLog, setNewDietLog] = useState<DietLogInput>({
    meal_type: 'vegetarian',
    date: '',
    receipt_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch diet logs
  const { data: dietLogs, isLoading, isError, refetch } = useQuery({
    queryKey: ['diet_logs', user_id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/diet_logs`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`
        }
      });
      return response.data.map((log: any) => ({
        id: log.log_id,
        meal_type: log.meal_type,
        date: log.date,
        impact_score: log.impact_score,
        receipt_url: log.receipt_url || null
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create diet log mutation
  const createDietLogMutation = useMutation({
    mutationFn: (newLog: DietLogInput) => {
      const formData = new FormData();
      formData.append('user_id', user_id!);
      formData.append('meal_type', newLog.meal_type);
      formData.append('date', newLog.date);
      
      if (selectedFile) {
        formData.append('receipt', selectedFile);
      }

      return axios.post(
        '/api/v1/diet_logs',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`
          }
        }
      );
    },
    onSuccess: (data, variables, context) => {
      setNewDietLog({ meal_type: 'vegetarian', date: '', receipt_url: ''});
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.setQueryData(['diet_logs', user_id], (oldData) => {
        return oldData? [...oldData, {
          id: data.data.id,
          meal_type: variables.meal_type,
          date: variables.date,
          impact_score: calculateImpactScore(variables.meal_type),
          receipt_url: data.data.receipt_url
        }] : []);
      });
    },
    onError: (error, variables, context) => {
      toast.error('Failed to log diet activity');
    }
  });

  // Delete diet log mutation
  const deleteDietLogMutation = useMutation({
    mutationFn: (logId: string) => {
      return axios.delete(`/api/v1/diet_logs/${logId}`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`
        }
      });
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      DietLogInputSchema.parse(newDietLog);
    } catch (error) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    createDietLogMutation.mutate(newDietLog);
  };

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length > 0) {
      setSelectedFile(e.target.files[0]);
      setNewDietLog(prev => ({
       ...prev,
        receipt_url: URL.createObjectURL(e.target.files[0])
      }));
    }
  };

  // Impact score color helper
  const getImpactScoreColor = (score: number) => {
    if (score <= 1.5) return 'bg-green-100 text-green-800';
    if (score <= 2.0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Diet Tracking</h1>
            <Link 
              to="/profile"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          {/* Form Section */}
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900">Log Your Meal</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Meal Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="meal_type" className="block text-sm font-medium text-gray-700">
                    Meal Type
                  </label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    value={newDietLog.meal_type}
                    onChange={(e) => setNewDietLog(prev => ({...prev, meal_type: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {MEAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={newDietLog.date}
                    onChange={(e) => setNewDietLog(prev => ({...prev, date: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="group">
                <label htmlFor="receipt" className="font-medium text-gray-700">
                  Upload Receipt (Optional)
                </label>
                <div className="mt-1 flex flex-col sm:flex-row items-center">
                  <div className="flex-1 sm:mr-4">
                    <input
                      id="receipt"
                      name="receipt"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-700"
                      accept="image/*, application/pdf"
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-2 sm:mt-0 sm:ml-4">
                      <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setNewDietLog(prev => ({...prev, receipt_url: '' }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-red-600 hover:text-red-500 text-sm font-medium mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createDietLogMutation.isMutating}
                  className="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDietLogMutation.isMutating? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Meal'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Logged Entries */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Meal History</h2>
            
            {isLoading? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dietLogs?.map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{new Date(log.date).toLocaleDateString()}</p>
                        <p className="mt-1 text-lg font-medium text-gray-900">{log.meal_type}</p>
                      </div>
                      <div className="ml-4 flex items-center">
                        <span 
                          className={`px-3 py-1 rounded-full text-white text-xs ${
                            getImpactScoreColor(log.impact_score)
                          }`}
                        >
                          Score: {log.impact_score}
                        </span>
                      </div>
                    </div>
                    
                    {log.receipt_url && (
                      <div className="mt-4">
                        <img 
                          src={log.receipt_url} 
                          alt="Receipt"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => deleteDietLogMutation.mutate(log.id)}
                        disabled={deleteDietLogMutation.isMutating}
                        className="text-red-600 hover:text-red-500 text-sm font-medium transition-colors"
                      >
                        {deleteDietLogMutation.isMutating? 'Deleting...' : 'Delete Entry'}
                      </button>
                    </div>
                  </div>
                ))}
                {dietLogs?.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-600">No meal logs found. Start tracking your diet impact!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UV_ActivityTracking_Diet;