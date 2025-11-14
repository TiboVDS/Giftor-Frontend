import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { testHealth } from '@/services/api/apiClient';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    console.log('🟢 HomeScreen component mounted');
    console.log('🟢 API URL from env:', process.env.EXPO_PUBLIC_API_URL);
  }, []);

  const handleTestHealth = async () => {
    console.log('🔵 Button pressed - starting health check');
    setLoading(true);
    setResult(null);

    console.log('🔵 Calling testHealth() function...');
    const healthResult = await testHealth();
    console.log('🔵 testHealth() returned:', healthResult);

    setResult(healthResult);
    setLoading(false);
    console.log('🔵 Health check complete, loading state set to false');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
      <View className="items-center">
        <Text className="text-3xl font-bold mb-4">Giftor</Text>
        <Text className="text-gray-600 mb-12">Health Check Test</Text>

        <TouchableOpacity
          onPress={handleTestHealth}
          disabled={loading}
          className="bg-blue-500 px-8 py-4 rounded-lg mb-6 w-full"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              Test Health Endpoint
            </Text>
          )}
        </TouchableOpacity>

        {result && (
          <View className="bg-gray-50 p-6 rounded-xl w-full border border-gray-200">
            <Text className="font-bold text-lg mb-4">
              Status: {result.success ? '✅ Success' : '❌ Failed'}
            </Text>

            {result.success ? (
              <>
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Database Status:</Text>
                  <Text className="text-lg font-semibold">{result.data.database}</Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Response Time:</Text>
                  <Text className="text-lg font-semibold">{result.responseTime}ms</Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">API Status:</Text>
                  <Text className="text-lg font-semibold">{result.data.status}</Text>
                </View>

                <View className="mt-4 bg-white p-4 rounded-lg">
                  <Text className="text-gray-600 text-xs mb-2">Full Response:</Text>
                  <Text className="text-xs font-mono">
                    {JSON.stringify(result.data, null, 2)}
                  </Text>
                </View>
              </>
            ) : (
              <View>
                <Text className="text-red-600 font-semibold mb-2">Error Details:</Text>
                <Text className="text-red-800">{result.error}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
