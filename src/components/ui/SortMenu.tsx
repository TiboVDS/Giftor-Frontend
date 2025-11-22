import React, { useState } from 'react';
import { Platform, ActionSheetIOS, Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SortOption {
  label: string;
  value: string;
}

export interface SortMenuProps {
  /** Available sort options */
  options: SortOption[];
  /** Currently selected option value */
  selectedValue: string;
  /** Callback when option is selected */
  onSelect: (value: string) => void;
}

/**
 * Platform-specific sort menu component.
 * - iOS: Uses native ActionSheet
 * - Android: Uses Modal with list of options
 *
 * @example
 * <SortMenu
 *   options={[
 *     { label: 'Name (A-Z)', value: 'name-asc' },
 *     { label: 'Name (Z-A)', value: 'name-desc' }
 *   ]}
 *   selectedValue={sortOption}
 *   onSelect={handleSortChange}
 * />
 */
export function SortMenu({ options, selectedValue, onSelect }: SortMenuProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      // iOS: Use native ActionSheet
      const optionLabels = options.map(opt => opt.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...optionLabels, 'Cancel'],
          cancelButtonIndex: optionLabels.length,
        },
        (buttonIndex) => {
          if (buttonIndex < optionLabels.length) {
            onSelect(options[buttonIndex].value);
          }
        }
      );
    } else {
      // Android: Use Modal
      setIsModalVisible(true);
    }
  };

  const handleSelectOption = (value: string) => {
    onSelect(value);
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Sort Button */}
      <TouchableOpacity
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Sort options"
        accessibilityRole="button"
      >
        <Ionicons name="filter" size={24} color="#374151" />
      </TouchableOpacity>

      {/* Android Modal */}
      {Platform.OS === 'android' && (
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setIsModalVisible(false)}
          >
            <View className="bg-white rounded-t-2xl p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Sort by</Text>

              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelectOption(option.value)}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  accessibilityLabel={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedValue === option.value }}
                >
                  <Text className="text-base text-gray-900">{option.label}</Text>
                  {selectedValue === option.value && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="mt-2 py-3 items-center"
              >
                <Text className="text-base text-gray-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
