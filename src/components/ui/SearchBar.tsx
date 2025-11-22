import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchBarProps {
  /** Current search text value */
  value: string;
  /** Callback when search text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text (default: "Search...") */
  placeholder?: string;
}

/**
 * Reusable search bar component with search icon and clear button.
 * Follows NativeWind styling patterns and includes accessibility support.
 *
 * @example
 * <SearchBar
 *   value={searchText}
 *   onChangeText={setSearchText}
 *   placeholder="Search by name..."
 * />
 */
export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
      {/* Search Icon */}
      <Ionicons name="search" size={20} color="#9CA3AF" className="mr-2" />

      {/* Text Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-base text-gray-900"
        accessibilityLabel="Search"
        accessibilityRole="search"
      />

      {/* Clear Button (only shown when text exists) */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
