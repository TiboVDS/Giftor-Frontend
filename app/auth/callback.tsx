import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/authClient';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Waiting for authentication...');

  useEffect(() => {
    let isHandled = false;

    const handleUrl = async (url: string | null) => {
      if (!url || isHandled) return;

      console.log('Received URL:', url);

      try {
        // Parse the URL to extract hash fragment
        // Supabase sends: exp://host/--/auth/callback#access_token=...&refresh_token=...
        const hashIndex = url.indexOf('#');

        if (hashIndex === -1) {
          console.log('No hash fragment in URL');

          // Wait a bit and check for session (OAuth might have completed in background)
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Session found, redirecting to app');
            isHandled = true;
            router.replace('/(tabs)');
          } else {
            console.log('No session, redirecting to login');
            setStatus('Authentication incomplete - please try again');
            setTimeout(() => {
              if (!isHandled) {
                isHandled = true;
                router.replace('/(auth)/login');
              }
            }, 1500);
          }
          return;
        }

        // Extract hash fragment and parse tokens
        const hash = url.substring(hashIndex + 1);
        console.log('Hash fragment:', hash);

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        console.log('Parsed tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length
        });

        if (accessToken && refreshToken) {
          setStatus('Setting up session...');
          isHandled = true;

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session setup error:', error);
            setStatus(`Error: ${error.message}`);
            setTimeout(() => router.replace('/(auth)/login'), 2000);
          } else {
            console.log('OAuth successful! User:', data.session?.user?.email);
            setStatus('Success! Redirecting...');
            router.replace('/(tabs)');
          }
        } else {
          console.error('Tokens not found in hash');
          setStatus('Authentication failed - invalid response');
          setTimeout(() => {
            if (!isHandled) {
              isHandled = true;
              router.replace('/(auth)/login');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Error processing authentication');
        setTimeout(() => {
          if (!isHandled) {
            isHandled = true;
            router.replace('/(auth)/login');
          }
        }, 2000);
      }
    };

    // Listen for URL events (when app is opened via deep link)
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL event received:', event.url);
      handleUrl(event.url);
    });

    // Also check initial URL (when app starts from deep link)
    Linking.getInitialURL().then((url) => {
      console.log('Initial URL:', url);
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-gray-700 text-center">{status}</Text>
    </View>
  );
}
