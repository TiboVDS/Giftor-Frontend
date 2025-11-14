import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.development file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Use PKCE flow for mobile
  },
});

// Handle deep links for OAuth
Linking.addEventListener('url', async ({ url }) => {
  console.log('Deep link received in authClient:', url);

  // Extract session from URL if present
  if (url.includes('access_token') || url.includes('code')) {
    console.log('OAuth tokens/code detected in URL');

    // For PKCE flow with code
    if (url.includes('code=')) {
      const urlParams = new URL(url.replace('exp://', 'http://')).searchParams;
      const code = urlParams.get('code');

      if (code) {
        console.log('Exchanging code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Code exchange error:', error);
        } else {
          console.log('Session created from code:', data.session?.user?.email);
        }
      }
    }

    // For implicit flow with access_token in hash
    if (url.includes('#access_token')) {
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Setting session from hash tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('Session set error:', error);
          } else {
            console.log('Session created from hash');
          }
        }
      }
    }
  }
});

// Handle app state changes to refresh session
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
