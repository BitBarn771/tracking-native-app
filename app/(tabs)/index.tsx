import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [userId, setUserId] = useState('');

  const handleEnter = () => {
    if (userId.trim()) {
      // Navigate to the first blank screen
      router.push('/(tabs)/blank1');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 px-6">
      <View className="w-full max-w-sm">
        <Text className="text-2xl font-bold text-center text-gray-800 mb-8">
          Welcome
        </Text>
        
        <Text className="text-lg text-center text-gray-600 mb-6">
          Please enter your ID to continue
        </Text>
        
        <TextInput
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg mb-6"
          placeholder="Enter your ID"
          value={userId}
          onChangeText={setUserId}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleEnter}
        />
        
        <TouchableOpacity
          className={`w-full py-3 rounded-lg ${
            userId.trim() ? 'bg-blue-500' : 'bg-gray-400'
          }`}
          onPress={handleEnter}
          disabled={!userId.trim()}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Enter
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

