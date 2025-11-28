import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { GiftIdea } from '../../../types/database.types';

export interface GiftIdeaCardProps {
  /** Gift idea data to display */
  giftIdea: GiftIdea;
  /** Callback when card is pressed */
  onPress: () => void;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: number | undefined, currency: string): string {
  if (price === undefined || price === null) {
    return 'Price unavailable';
  }

  // Use currency symbol based on currency code
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * GiftIdeaCard component for displaying gift idea information in a list.
 * Shows product image (or placeholder), title, price, and capture date.
 *
 * @example
 * <GiftIdeaCard
 *   giftIdea={giftIdea}
 *   onPress={() => navigateToGiftIdeaDetail(giftIdea.id)}
 * />
 */
export function GiftIdeaCard({ giftIdea, onPress }: GiftIdeaCardProps) {
  const {
    giftText,
    productTitle,
    estimatedPrice,
    currency,
    productImageUrl,
    capturedAt,
    isPurchased,
  } = giftIdea;

  // Display title - prefer productTitle, fallback to giftText
  const displayTitle = productTitle || giftText;

  // Format relative date
  const relativeDate = formatDistanceToNow(parseISO(capturedAt), {
    addSuffix: true,
  });

  // Accessibility label
  const accessibilityLabel = [
    displayTitle,
    formatPrice(estimatedPrice, currency),
    `Captured ${relativeDate}`,
    isPurchased ? 'Purchased' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-100 flex-row"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view gift idea details"
    >
      {/* Product Image or Placeholder */}
      <View className="mr-3">
        {productImageUrl ? (
          <Image
            source={{ uri: productImageUrl }}
            contentFit="cover"
            transition={200}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
            }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            className="items-center justify-center bg-gray-100 rounded-lg"
            style={{ width: 60, height: 60 }}
          >
            <Ionicons name="gift-outline" size={24} color="#9CA3AF" />
          </View>
        )}

        {/* Purchased badge overlay */}
        {isPurchased && (
          <View
            className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
          >
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 justify-center">
        {/* Title - max 2 lines with ellipsis */}
        <Text
          className="text-base font-semibold text-gray-900 mb-1"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayTitle}
        </Text>

        {/* Price */}
        <Text
          className="text-sm font-medium mb-0.5"
          style={{
            color: estimatedPrice !== undefined ? '#059669' : '#9CA3AF',
          }}
        >
          {formatPrice(estimatedPrice, currency)}
        </Text>

        {/* Capture date */}
        <Text className="text-xs text-gray-500">
          {relativeDate}
        </Text>
      </View>

      {/* Chevron */}
      <View className="justify-center ml-2">
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}
