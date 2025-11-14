import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/stores/authStore';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pb-6 bg-blue-600" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-3xl font-bold text-white mb-2">Settings</Text>
        {user?.email && (
          <Text className="text-blue-100 text-sm">{user.email}</Text>
        )}
      </View>

      {/* Settings Content */}
      <View className="flex-1 px-6 py-6">
        {/* Account Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Account</Text>

          {/* Profile Info */}
          <View className="bg-gray-50 rounded-lg p-4 mb-3">
            <Text className="text-sm text-gray-600 mb-1">Email</Text>
            <Text className="text-base text-gray-900">{user?.email || 'Not logged in'}</Text>
          </View>

          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-sm text-gray-600 mb-1">User ID</Text>
            <Text className="text-base text-gray-900 font-mono text-xs">
              {user?.id || 'N/A'}
            </Text>
          </View>
        </View>

        {/* App Info Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">App Info</Text>

          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-sm text-gray-600 mb-1">Version</Text>
            <Text className="text-base text-gray-900">1.0.0 (Beta)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-600 rounded-lg py-4 items-center"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-base">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
