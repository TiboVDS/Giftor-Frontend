import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-6 py-6">
        <Text className="text-3xl font-bold text-gray-900 mb-4">Upcoming Occasions</Text>
        <Text className="text-gray-600 text-base">
          Upcoming occasions will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
}
