import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { supabase } from '@/services/supabase/authClient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific Supabase errors
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email or password incorrect');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address');
      } else if (err.message?.includes('network')) {
        setError('Cannot connect. Check your internet connection');
      } else {
        setError('Login failed. Please try again');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setOauthLoading(true);
    try {
      // Get the dev server URL from Constants
      const debuggerHost = Constants.expoConfig?.hostUri ||
                          Constants.manifest?.debuggerHost ||
                          Constants.manifest2?.extra?.expoGo?.debuggerHost;

      // Construct redirect URL for Expo Go
      const redirectUrl = debuggerHost
        ? `exp://${debuggerHost}/--/auth/callback`
        : 'giftor://auth/callback';

      console.log('OAuth redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('OAuth response:', { data, error });

      if (error) {
        setError('Google login failed. Please try again');
        console.error('Google OAuth error:', error);
      } else if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        // For React Native, we need to open the OAuth URL in a browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          setError('Cannot open OAuth browser');
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setOauthLoading(true);
    try {
      // Get the dev server URL from Constants
      const debuggerHost = Constants.expoConfig?.hostUri ||
                          Constants.manifest?.debuggerHost ||
                          Constants.manifest2?.extra?.expoGo?.debuggerHost;

      // Construct redirect URL for Expo Go
      const redirectUrl = debuggerHost
        ? `exp://${debuggerHost}/--/auth/callback`
        : 'giftor://auth/callback';

      console.log('OAuth redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        setError('Apple login failed. Please try again');
        console.error('Apple OAuth error:', error);
      } else if (data?.url) {
        // For React Native, we need to open the OAuth URL in a browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          setError('Cannot open OAuth browser');
        }
      }
    } catch (err) {
      console.error('Apple login error:', err);
      setError('Apple login failed');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
        <Text className="text-base text-gray-600">Sign in to continue to Giftor</Text>
      </View>

      {/* Error Message */}
      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <Text className="text-red-800 text-sm">{error}</Text>
        </View>
      ) : null}

      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
        <TextInput
          className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!isLoading}
        />
      </View>

      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
        <TextInput
          className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!isLoading}
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity
        className={`bg-blue-600 rounded-lg py-4 items-center mb-4 ${isLoading ? 'opacity-50' : ''}`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="px-4 text-sm text-gray-500">or continue with</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* OAuth Buttons */}
      <View className="space-y-3 mb-6">
        {/* Google Button */}
        <TouchableOpacity
          className={`bg-white border border-gray-300 rounded-lg py-3 items-center flex-row justify-center mb-3 ${oauthLoading ? 'opacity-50' : ''}`}
          onPress={handleGoogleLogin}
          disabled={isLoading || oauthLoading}
        >
          <Text className="text-gray-700 font-medium text-base">Continue with Google</Text>
        </TouchableOpacity>

        {/* Apple Button - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className={`bg-black rounded-lg py-3 items-center flex-row justify-center ${oauthLoading ? 'opacity-50' : ''}`}
            onPress={handleAppleLogin}
            disabled={isLoading || oauthLoading}
          >
            <Text className="text-white font-medium text-base">Continue with Apple</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sign Up Link */}
      <View className="flex-row justify-center">
        <Text className="text-gray-600 text-base">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={isLoading}>
          <Text className="text-blue-600 font-semibold text-base">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
