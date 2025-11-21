import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  maxTags?: number;
  testID?: string;
}

/**
 * TagInput component
 * Allows users to add and remove tags (interests/hobbies)
 */
export default function TagInput({
  label,
  value,
  onChange,
  placeholder = 'Type and press Enter to add...',
  error,
  maxTags = 20,
  testID,
}: TagInputProps) {
  const [inputText, setInputText] = useState('');

  const addTag = () => {
    const trimmed = inputText.trim();

    // Validate: non-empty, not duplicate, under max limit
    if (
      trimmed &&
      !value.includes(trimmed) &&
      value.length < maxTags
    ) {
      onChange([...value, trimmed]);
      setInputText(''); // Clear input after adding
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>

      {/* Input Field */}
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white"
        value={inputText}
        onChangeText={setInputText}
        placeholder={placeholder}
        onSubmitEditing={addTag}
        returnKeyType="done"
        blurOnSubmit={false} // Keep keyboard open after adding tag
        accessibilityLabel={label}
      />

      {/* Tag Pills */}
      {value.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 8 }}
        >
          {value.map((tag, index) => (
            <View
              key={index}
              className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center"
              testID={`tag-${index}`}
            >
              <Text className="text-blue-800 text-sm mr-1">{tag}</Text>
              <Pressable
                onPress={() => removeTag(tag)}
                className="ml-1"
                accessibilityLabel={`Remove ${tag}`}
                accessibilityRole="button"
              >
                <Text className="text-blue-600 text-base font-bold">×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tag Count Indicator */}
      {value.length > 0 && (
        <Text className="text-xs text-gray-500 mt-1">
          {value.length} {value.length === 1 ? 'tag' : 'tags'}
          {value.length >= maxTags && ` (maximum reached)`}
        </Text>
      )}

      {/* Error Message */}
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
