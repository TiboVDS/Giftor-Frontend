import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase/authClient';
import apiClient from '@/services/api/apiClient';
import type { AuthStore } from '../types/auth.types';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => {
      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session) {
          set({
            user: session.user,
            session: session,
            isAuthenticated: true,
            isLoading: false,
          });

          // Call backend to create/retrieve user record in database
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              console.log('Calling /api/users/me to ensure user exists in database');
              console.log('API Base URL:', process.env.EXPO_PUBLIC_API_URL);
              const response = await apiClient.get('/api/users/me');
              console.log('User record confirmed:', response.data);
            } catch (error: any) {
              console.error('Error calling /api/users/me:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error status:', error.response?.status);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });

      return {
        // State
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },

      restoreSession: async () => {
        set({ isLoading: true });
        try {
          const { data } = await supabase.auth.getSession();

          if (data.session) {
            set({
              user: data.session.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Session restore error:', error);
          set({ isLoading: false });
        }
      },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
