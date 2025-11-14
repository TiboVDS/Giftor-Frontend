import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { supabase } from '@/services/supabase/authClient';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuthStore();
  const router = useRouter();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup(email, password);
      // Check if email confirmation is required
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Email confirmation required
        setError('');
        // Show success message
        alert('Success! Please check your email to confirm your account.');
        router.replace('/(auth)/login');
      } else {
        // Auto-logged in, go to app
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Signup error:', err);

      // Handle specific Supabase errors
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('This email is already registered');
      } else if (err.message?.includes('password')) {
        setError('Password must be at least 8 characters');
      } else if (err.message?.includes('email')) {
        setError('Please enter a valid email address');
      } else if (err.message?.includes('network')) {
        setError('Cannot connect. Check your internet connection');
      } else {
        setError('Signup failed. Please try again');
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
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
        },
      });

      if (error) {
        setError('Google signup failed. Please try again');
        console.error('Google OAuth error:', error);
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
      console.error('Google signup error:', err);
      setError('Google signup failed');
    }
  };

  const handleAppleSignup = async () => {
    setError('');
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
        setError('Apple signup failed. Please try again');
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
      console.error('Apple signup error:', err);
      setError('Apple signup failed');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
          <Text className="text-base text-gray-600">Sign up to get started with Giftor</Text>
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
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            editable={!isLoading}
          />
          <Text className="text-xs text-gray-500 mt-1">Must be at least 8 characters</Text>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
            editable={!isLoading}
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center mb-4 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="px-4 text-sm text-gray-500">or sign up with</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* OAuth Buttons */}
        <View className="space-y-3 mb-6">
          {/* Google Button */}
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg py-3 items-center flex-row justify-center mb-3"
            onPress={handleGoogleSignup}
            disabled={isLoading}
          >
            <Text className="text-gray-700 font-medium text-base">Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple Button - iOS only */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              className="bg-black rounded-lg py-3 items-center flex-row justify-center"
              onPress={handleAppleSignup}
              disabled={isLoading}
            >
              <Text className="text-white font-medium text-base">Continue with Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Terms and Privacy */}
        <Text className="text-xs text-gray-500 text-center mb-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>

        {/* Login Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600 text-base">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading}>
            <Text className="text-blue-600 font-semibold text-base">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
