import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { RecipientDto } from '../types/recipient.types';
import { getInitials, getAvatarColor } from '../../../utils/avatar';

export interface RecipientCardProps {
  /** Recipient data to display */
  recipient: RecipientDto;
  /** Number of gift ideas for this recipient */
  giftIdeaCount: number;
  /** Callback when card is tapped */
  onPress: () => void;
  /** Accessibility hint for screen readers (e.g., "Swipe left to delete") */
  accessibilityHint?: string;
}

/**
 * Recipient card component for list display.
 * Shows profile picture (or initials), name, relationship, birthday, and gift idea count.
 *
 * @example
 * <RecipientCard
 *   recipient={recipient}
 *   giftIdeaCount={3}
 *   onPress={() => navigateToDetail(recipient.id)}
 * />
 */
export function RecipientCard({ recipient, giftIdeaCount, onPress, accessibilityHint }: RecipientCardProps) {
  const { name, relationship, profilePictureUrl, birthday } = recipient;

  // Format birthday if available
  const formattedBirthday = birthday
    ? format(parseISO(birthday), 'MMM d')
    : null;

  // Gift idea count text
  const giftIdeaText =
    giftIdeaCount === 0
      ? 'No ideas yet'
      : giftIdeaCount === 1
      ? '1 gift idea'
      : `${giftIdeaCount} gift ideas`;

  // Accessibility label with all info
  const accessibilityLabel = [
    name,
    relationship,
    formattedBirthday ? `Birthday: ${formattedBirthday}` : null,
    giftIdeaText,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white p-4 rounded-lg shadow-sm"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
    >
      {/* Profile Picture or Initials Placeholder */}
      <View className="mr-4">
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            contentFit="cover"
            transition={200}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
            }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            className="w-15 h-15 rounded-full items-center justify-center"
            style={{ backgroundColor: getAvatarColor(name) }}
          >
            <Text className="text-white text-xl font-bold">
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>

      {/* Recipient Info */}
      <View className="flex-1">
        {/* Name */}
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {name}
        </Text>

        {/* Relationship */}
        <Text className="text-sm text-gray-600 mb-1">
          {relationship}
        </Text>

        {/* Birthday Indicator */}
        {formattedBirthday && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="gift-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              Birthday: {formattedBirthday}
            </Text>
          </View>
        )}

        {/* Gift Idea Count */}
        <Text
          className="text-sm"
          style={{ color: giftIdeaCount === 0 ? '#9CA3AF' : '#374151' }}
        >
          {giftIdeaText}
        </Text>
      </View>

      {/* Chevron Icon */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}
