import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// ======================
// === TYPES ===
// ======================

// Auth
interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  location?: string;
  eco_interests?: any;
  created_at: string;
}

interface AuthState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

// Impact
interface CategoryBreakdown {
  transportation: number;
  energy: number;
  waste: number;
  diet: number;
  shopping: number;
}

interface UserImpact {
  daily_score: number;
  weekly_score: number;
  monthly_score: number;
  category_breakdown: CategoryBreakdown;
}

// Goals
interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_value: number;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
}

// Challenges
interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  rules?: string;
}

interface UserChallenge {
  challenge_id: string;
  progress: number;
  join_date: string;
  status: string;
}

// Settings
interface Settings {
  units: 'metric' | 'imperial';
  dark_mode: boolean;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
}

// Activity Logs
interface TransportationLog {
  id: string;
  user_id: string;
  mode: string;
  distance: number;
  date: string;
  start_location?: string;
  end_location?: string;
}

interface EnergyLog {
  id: string;
  user_id: string;
  energy_type: string;
  usage_amount: number;
  unit: string;
  date: string;
}

interface WasteLog {
  id: string;
  user_id: string;
  waste_type: string;
  quantity: number;
  photo_url?: string;
  date: string;
}

interface DietLog {
  id: string;
  user_id: string;
  meal_type: string;
  date: string;
  impact_score: number;
  receipt_url?: string;
}

interface ShoppingLog {
  id: string;
  user_id: string;
  product_name: string;
  eco_rating: string;
  purchase_date: string;
  receipt_url?: string;
}

// Community
interface Forum {
  id: string;
  category: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface ForumPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Business
interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  created_at: string;
}

interface SupplyChainLog {
  id: string;
  business_profile_id: string;
  supplier_name: string;
  sustainability_rating: string;
  log_date: string;
}

// Notifications
interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

// ======================
// === STORE IMPLEMENTATION ===
// ======================

export interface AppStore {
  // Auth State
  auth_state: AuthState;
  login_user: (email: string, password: string) => Promise<void>;
  register_user: (email: string, password: string, name: string) => Promise<void>;
  logout_user: () => void;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
  update_user_profile: (userData: Partial<User>) => void;

  // Impact State
  user_impact: UserImpact;
  set_user_impact: (impact: UserImpact) => void;

  // Goals State
  goals: Goal[];
  add_goal: (goal: Goal) => void;
  update_goal: (id: string, updates: Partial<Goal>) => void;
  delete_goal: (id: string) => void;

  // Challenges State
  available_challenges: Challenge[];
  user_challenges: UserChallenge[];
  set_available_challenges: (challenges: Challenge[]) => void;
  set_user_challenges: (challenges: UserChallenge[]) => void;
  join_challenge: (challenge_id: string) => void;

  // Settings State
  settings: Settings;
  update_settings: (updates: Partial<Settings>) => void;

  // Activity Logs
  transportation_logs: TransportationLog[];
  energy_logs: EnergyLog[];
  waste_logs: WasteLog[];
  diet_logs: DietLog[];
  shopping_logs: ShoppingLog[];
  set_transportation_logs: (logs: TransportationLog[]) => void;
  set_energy_logs: (logs: EnergyLog[]) => void;
  set_waste_logs: (logs: WasteLog[]) => void;
  set_diet_logs: (logs: DietLog[]) => void;
  set_shopping_logs: (logs: ShoppingLog[]) => void;

  // Community State
  forums: Forum[];
  forum_posts: { [key: string]: ForumPost[] };
  set_forums: (forums: Forum[]) => void;
  set_forum_posts: (forum_id: string, posts: ForumPost[]) => void;

  // Business State
  business_profile: BusinessProfile | null;
  supply_chain_logs: SupplyChainLog[];
  set_business_profile: (profile: BusinessProfile | null) => void;
  set_supply_chain_logs: (logs: SupplyChainLog[]) => void;

  // Notifications State
  notifications: Notification[];
  add_notification: (notification: Notification) => void;
  clear_notifications: () => void;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const useAppStore = create(
  persist(
    (set) => ({
      // Auth State
      auth_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },

      // Impact State
      user_impact: {
        daily_score: 0,
        weekly_score: 0,
        monthly_score: 0,
        category_breakdown: {
          transportation: 0,
          energy: 0,
          waste: 0,
          diet: 0,
          shopping: 0,
        },
      },

      // Goals State
      goals: [],
      add_goal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      update_goal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === id? {...g,...updates } : g)
      })),
      delete_goal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id!== id)
      })),

      // Challenges State
      available_challenges: [],
      user_challenges: [],
      set_available_challenges: (challenges) => set({ available_challenges: challenges }),
      set_user_challenges: (challenges) => set({ user_challenges: challenges }),
      join_challenge: (challenge_id) => {
        // This would typically trigger an API call in component, then update state
        set((state) => ({
          user_challenges: [...state.user_challenges, {
            challenge_id,
            progress: 0,
            join_date: new Date().toISOString(),
            status: 'active'
          }]
        }));
      },

      // Settings State
      settings: {
        units: 'metric',
        dark_mode: false,
        notification_preferences: {
          email: true,
          in_app: true,
        },
      },
      update_settings: (updates) => set((state) => ({
        settings: {...state.settings,...updates }
      )),

      // Activity Logs
      transportation_logs: [],
      set_transportation_logs: (logs) => set({ transportation_logs: logs }),
      energy_logs: [],
      set_energy_logs: (logs) => set({ energy_logs: logs }),
      waste_logs: [],
      set_waste_logs: (logs) => set({ waste_logs: logs }),
      diet_logs: [],
      set_diet_logs: (logs) => set({ diet_logs: logs }),
      shopping_logs: [],
      set_shopping_logs: (logs) => set({ shopping_logs: logs }),

      // Community State
      forums: [],
      set_forums: (forums) => set({ forums }),
      forum_posts: {},
      set_forum_posts: (forum_id, posts) => set({ forum_posts: {...state.forum_posts, [forum_id]: posts } }),

      // Business State
      business_profile: null,
      set_business_profile: (profile) => set({ business_profile: profile }),
      supply_chain_logs: [],
      set_supply_chain_logs: (logs) => set({ supply_chain_logs: logs }),

      // Notifications State
      notifications: [],
      add_notification: (notification) => set((state) => ([...state.notifications, notification])),
      clear_notifications: () => set({ notifications: [] }),

      // Auth Actions
      login_user: async (email, password) => {
        try {
          const response = await axios.post(
            `${apiBaseUrl}/api/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { user, token } = response.data;
          
          set({
            auth_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          });
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set((state) => ({
            auth_state: {
             ...state.auth_state,
              authentication_status: {
               ...state.auth_state.authentication_status,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      register_user: async (email, password, name) => {
        try {
          const response = await axios.post(
            `${apiBaseUrl}/api/auth/signup`,
            { email, password, name, user_type: 'individual' },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { user, token } = response.data;
          
          set({
            auth_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          });
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set((state) => ({
            auth_state: {
             ...state.auth_state,
              authentication_status: {
               ...state.auth_state.authentication_status,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      logout_user: () => {
        set({
          auth_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        });
      },

      initialize_auth: async () => {
        const { auth_token } = this.auth_state;
        if (!auth_token) {
          this.set_auth_state({ is_loading: false });
          return;
        }

        try {
          const response = await axios.get(
            `${apiBaseUrl}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${auth_token}` } }
          );

          const { user } = response.data;
          
          set({
            auth_state: {
              current_user: user,
              auth_token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          });
        } catch (error) {
          this.logout_user();
        }
      },

      clear_auth_error: () => set((state) => ({
        auth_state: {
         ...state.auth_state,
          error_message: null,
        },
      })),

      update_user_profile: (userData) => {
        set((state) => ({
          auth_state: {
           ...state.auth_state,
            current_user: state.auth_state.current_user
             ? {...state.auth_state.current_user,...userData }
              : null,
          },
        }));
      },

      // Other state actions are already defined above
    }),
    {
      name: 'eco_track_app_store',
      partialize: (state) => ({
        auth_state: {
          current_user: state.auth_state.current_user,
          auth_token: state.auth_state.auth_token,
          authentication_status: {
            is_authenticated: state.auth_state.authentication_status.is_authenticated,
          },
        },
        settings: state.settings,
      }),
    }
  )
);

// Export types for component usage
export type { AppStore, User, UserImpact, Goal, Challenge, UserChallenge, Settings, 
  TransportationLog, EnergyLog, WasteLog, DietLog, ShoppingLog, Forum, ForumPost, 
  BusinessProfile, SupplyChainLog, Notification };