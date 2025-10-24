import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { GoalEntity } from '@/types/generated/zod';

const SetupStep = {
  PERSONA: 0,
  BASELINE: 1,
  GOAL: 2
};

interface BaselineData {
  energy_provider: string;
  current_waste: number;
  default_transport: string;
}

const GV_SetupWizard: React.FC = () => {
  // Zustand store accessors
  const updateUserProfile = useAppStore(state => state.update_user_profile);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isSetupComplete = useAppStore(state => state.user_impact.daily_score > 0);
  const clearAuthError = useAppStore(state => state.clear_auth_error);
  const setNotification = useAppStore(state => state.add_notification);

  // Local state management
  const [currentStep, setCurrentStep] = useState(SetupStep.PERSONA);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [baselineData, setBaselineData] = useState<BaselineData>({
    energy_provider: '',
    current_waste: 0,
    default_transport: ''
  });
  const [initialGoal, setInitialGoal] = useState({
    title: '',
    target_value: 0,
    timeframe: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Validation schemas
  const personaSchema = z.enum(['individual', 'family', 'business']);
  const baselineSchema = z.object({
    energy_provider: z.string().min(1),
    current_waste: z.number().positive(),
    default_transport: z.string().min(1)
  });
  const goalSchema = z.object({
    title: z.string().min(1),
    target_value: z.number().positive(),
    timeframe: z.string().min(1)
  });

  // Step progression handler
  const handleNextStep = async (step: number) => {
    try {
      if (step === SetupStep.PERSONA) {
        await personaSchema.validate({ value: selectedPersona });
      } else if (step === SetupStep.BASELINE) {
        await baselineSchema.validate(baselineData);
      } else if (step === SetupStep.GOAL) {
        await goalSchema.validate(initialGoal);
      }
      
      setCurrentStep(prev => prev + 1);
    } catch (err) {
      setError('Invalid form data. Please check all fields.');
    }
  };

  // Final submission handler
  const completeSetup = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      
      // Validate final step
      await goalSchema.validate(initialGoal);
      
      // Prepare update payload
      const updateData = {
        user_type: selectedPersona,
        baseline_data: baselineData,
        // Additional fields from user entity if needed
      };
      
      // Update user profile
      await updateUserProfile(updateData);
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage = err instanceof Error? err.message : 'Setup failed';
      setError(errorMessage);
      setNotification({
        id: Date.now().toString(),
        message: 'Onboarding setup failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render logic for each step
  const renderStep = () => {
    switch (currentStep) {
      case SetupStep.PERSONA:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What type of user are you?
            </h2>
            
            <div className="space-y-4">
              {['individual', 'family', 'business'].map(persona => (
                <button
                  key={persona}
                  onClick={() => setSelectedPersona(persona)}
                  className={`group flex items-center w-full px-4 py-3 border-2 ${
                    selectedPersona === persona
                     ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300'
                  } rounded-lg text-left transition-colors hover:border-blue-500`}
                >
                  <span className="flex-1">{persona.charAt(0).toUpperCase() + persona.slice(1)}</span>
                  {selectedPersona === persona && (
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5M5 14l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleNextStep(SetupStep.PERSONA)}
                disabled={!selectedPersona}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        );
      
      case SetupStep.BASELINE:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Current Sustainability Baseline
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="energyProvider" className="block text-sm font-medium text-gray-700">
                  Energy Provider
                </label>
                <input
                  id="energyProvider"
                  value={baselineData.energy_provider}
                  onChange={(e) => setBaselineData(prev => ({...prev, energy_provider: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your energy provider"
                />
              </div>
              
              <div>
                <label htmlFor="currentWaste" className="block text-sm font-medium text-gray-700">
                  Current Weekly Waste (kg)
                </label>
                <input
                  id="currentWaste"
                  type="number"
                  min="0"
                  step="0.1"
                  value={baselineData.current_waste}
                  onChange={(e) => setBaselineData(prev => ({...prev, current_waste: Number(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label htmlFor="defaultTransport" className="block text-sm font-medium text-gray-700">
                  Primary Transportation Mode
                </label>
                <input
                  id="defaultTransport"
                  value={baselineData.default_transport}
                  onChange={(e) => setBaselineData(prev => ({...prev, default_transport: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Car, Bike, Public Transit"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(SetupStep.PERSONA)}
                className="text-blue-600 hover:text-blue-500"
              >
                Back
              </button>
              <button
                onClick={() => handleNextStep(SetupStep.BASELINE)}
                disabled={!baselineData.energy_provider ||!baselineData.default_transport || baselineData.current_waste <= 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        );
      
      case SetupStep.GOAL:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Set Your First Goal
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700">
                  Goal Title
                </label>
                <input
                  id="goalTitle"
                  value={initialGoal.title}
                  onChange={(e) => setInitialGoal(prev => ({...prev, title: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Reduce weekly waste by 20%"
                />
              </div>
              
              <div>
                <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700">
                  Target Value
                </label>
                <input
                  id="goalTarget"
                  type="number"
                  min="0"
                  step="0.1"
                  value={initialGoal.target_value}
                  onChange={(e) => setInitialGoal(prev => ({...prev, target_value: Number(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label htmlFor="goalTimeframe" className="block text-sm font-medium text-gray-700">
                  Timeframe
                </label>
                <input
                  id="goalTimeframe"
                  value={initialGoal.timeframe}
                  onChange={(e) => setInitialGoal(prev => ({...prev, timeframe: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., week, month"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(SetupStep.BASELINE)}
                className="text-blue-600 hover:text-blue-500"
              >
                Back
              </button>
              <button
                onClick={completeSetup}
                disabled={!initialGoal.title || initialGoal.target_value <= 0 ||!initialGoal.timeframe}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Setup...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isSetupComplete) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 sm:pt-0">
          {/* Main modal content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            {/* Progress indicator */}
            <div className="flex justify-between mb-6">
              {[0, 1, 2].map((step, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className={`w-10 h-10 ${currentStep > index? 'bg-blue-600' : 'bg-gray-300'} rounded-full`}>
                    <span className="absolute inset-0 text-white text-center">{index + 1}</span>
                  </div>
                  <div className={`w-full h-1 mt-2 ${index < 2? (currentStep > index? 'bg-blue-600' : 'bg-gray-300') : ''}`}></div>
                </div>
              ))}
            </div>
            
            {/* Step content */}
            {renderStep()}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mt-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-30"></div>
    </>
  );
};

export default GV_SetupWizard;