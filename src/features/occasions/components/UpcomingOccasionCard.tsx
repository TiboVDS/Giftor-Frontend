import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Occasion } from '../../../types/database.types';
import { getDaysUntil, formatDaysUntil } from '../stores/occasionStore';

// Map occasion types to display colors
const OCCASION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Birthday: { bg: '#FEE2E2', text: '#B91C1C' },
  Anniversary: { bg: '#FCE7F3', text: '#BE185D' },
  Holiday: { bg: '#DCFCE7', text: '#15803D' },
  Graduation: { bg: '#E0E7FF', text: '#3730A3' },
  NewJob: { bg: '#FEF3C7', text: '#B45309' },
  Visit: { bg: '#DBEAFE', text: '#1D4ED8' },
  HostGift: { bg: '#F3E8FF', text: '#7C3AED' },
  JustBecause: { bg: '#F0FDFA', text: '#0F766E' },
  Custom: { bg: '#F3F4F6', text: '#374151' },
};

export interface UpcomingOccasionCardProps {
  /** Occasion data to display */
  occasion: Occasion;
  /** Recipient name for display */
  recipientName: string;
  /** Number of gift ideas for this occasion */
  giftIdeasCount: number;
  /** Callback when card is pressed */
  onPress: () => void;
}

/**
 * UpcomingOccasionCard component for displaying upcoming occasions on the Home tab.
 * Shows recipient name, occasion name, date, days until countdown, and gift ideas count.
 *
 * @example
 * <UpcomingOccasionCard
 *   occasion={occasion}
 *   recipientName="John"
 *   giftIdeasCount={3}
 *   onPress={() => navigateToOccasionDetail(occasion.id)}
 * />
 */
export function UpcomingOccasionCard({
  occasion,
  recipientName,
  giftIdeasCount,
  onPress,
}: UpcomingOccasionCardProps) {
  const { name, type, date } = occasion;

  // Get colors for occasion type badge
  const typeColors = OCCASION_TYPE_COLORS[type] || OCCASION_TYPE_COLORS.Custom;

  // Format date and calculate days until
  const formattedDate = date
    ? format(parseISO(date), 'EEEE, MMMM d')
    : 'No date set';
  const daysUntil = date ? getDaysUntil(date) : null;
  const daysUntilText = daysUntil !== null ? formatDaysUntil(daysUntil) : '';

  // Gift ideas text
  const giftIdeasText =
    giftIdeasCount === 0
      ? 'No ideas yet'
      : giftIdeasCount === 1
      ? '1 gift idea ready'
      : `${giftIdeasCount} gift ideas ready`;

  // Accessibility label
  const accessibilityLabel = [
    `${recipientName}'s ${name}`,
    formattedDate,
    daysUntilText,
    giftIdeasText,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view occasion details"
    >
      {/* Header: Recipient name + days until badge */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-600">{recipientName}</Text>
        {daysUntilText && (
          <View
            className="px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: daysUntil === 0 ? '#FEE2E2' : daysUntil === 1 ? '#FEF3C7' : '#DBEAFE',
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: daysUntil === 0 ? '#B91C1C' : daysUntil === 1 ? '#B45309' : '#1D4ED8',
              }}
            >
              {daysUntilText}
            </Text>
          </View>
        )}
      </View>

      {/* Occasion name */}
      <Text className="text-base font-semibold text-gray-900 mb-2">{name}</Text>

      {/* Type badge */}
      <View
        className="self-start px-2.5 py-1 rounded-full mb-3"
        style={{ backgroundColor: typeColors.bg }}
      >
        <Text className="text-xs font-medium" style={{ color: typeColors.text }}>
          {type}
        </Text>
      </View>

      {/* Date and gift ideas */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1.5">{formattedDate}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons
            name="gift-outline"
            size={14}
            color={giftIdeasCount > 0 ? '#10B981' : '#9CA3AF'}
          />
          <Text
            className="text-sm ml-1"
            style={{ color: giftIdeasCount > 0 ? '#10B981' : '#9CA3AF' }}
          >
            {giftIdeasText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
