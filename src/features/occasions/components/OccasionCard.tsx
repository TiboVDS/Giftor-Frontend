import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInDays, addYears, isBefore } from 'date-fns';
import { Occasion } from '../../../types/database.types';

export interface OccasionCardProps {
  /** Occasion data to display */
  occasion: Occasion;
  /** Callback when card is pressed */
  onPress: () => void;
}

// Map occasion types to display colors
const OCCASION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Birthday: { bg: '#FEE2E2', text: '#B91C1C' },      // red
  Anniversary: { bg: '#FCE7F3', text: '#BE185D' },   // pink
  Holiday: { bg: '#DCFCE7', text: '#15803D' },       // green
  Graduation: { bg: '#E0E7FF', text: '#3730A3' },    // indigo
  NewJob: { bg: '#FEF3C7', text: '#B45309' },        // amber
  Visit: { bg: '#DBEAFE', text: '#1D4ED8' },         // blue
  HostGift: { bg: '#F3E8FF', text: '#7C3AED' },      // purple
  JustBecause: { bg: '#F0FDFA', text: '#0F766E' },   // teal
  Custom: { bg: '#F3F4F6', text: '#374151' },        // gray
};

/**
 * Calculate days until the next occurrence of a date (for recurring events like birthdays)
 */
function getDaysUntilNext(dateString: string): number {
  const date = parseISO(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get this year's occurrence
  let nextOccurrence = new Date(today.getFullYear(), date.getMonth(), date.getDate());

  // If it already passed this year, use next year
  if (isBefore(nextOccurrence, today)) {
    nextOccurrence = addYears(nextOccurrence, 1);
  }

  return differenceInDays(nextOccurrence, today);
}

/**
 * OccasionCard component for displaying occasion information in a list.
 * Shows occasion name, type badge, date, and days until next occurrence.
 *
 * @example
 * <OccasionCard
 *   occasion={occasion}
 *   onPress={() => navigateToOccasionDetail(occasion.id)}
 * />
 */
export function OccasionCard({ occasion, onPress }: OccasionCardProps) {
  const { name, occasionType, date, isRecurring } = occasion;

  // Get colors for occasion type badge
  const typeColors = OCCASION_TYPE_COLORS[occasionType] || OCCASION_TYPE_COLORS.Custom;

  // Format date and calculate days until
  let formattedDate = 'No date set';
  let daysUntilText = '';

  if (date) {
    formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
    const daysUntil = getDaysUntilNext(date);

    if (daysUntil === 0) {
      daysUntilText = 'Today!';
    } else if (daysUntil === 1) {
      daysUntilText = 'Tomorrow';
    } else if (daysUntil <= 30) {
      daysUntilText = `in ${daysUntil} days`;
    } else {
      daysUntilText = `in ${Math.floor(daysUntil / 30)} months`;
    }
  }

  // Accessibility label
  const accessibilityLabel = [
    name,
    occasionType,
    date ? formattedDate : 'No date set',
    daysUntilText,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-100"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view occasion details"
    >
      <View className="flex-row items-start justify-between">
        {/* Main content */}
        <View className="flex-1 mr-3">
          {/* Occasion name */}
          <Text className="text-base font-semibold text-gray-900 mb-2">
            {name}
          </Text>

          {/* Occasion type badge */}
          <View
            className="self-start px-2.5 py-1 rounded-full mb-2"
            style={{ backgroundColor: typeColors.bg }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: typeColors.text }}
            >
              {occasionType}
            </Text>
          </View>

          {/* Date info */}
          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#6B7280"
            />
            <Text className="text-sm text-gray-600 ml-1.5">
              {formattedDate}
            </Text>
          </View>

          {/* Days until (if date is set) */}
          {date && daysUntilText && (
            <Text className="text-sm text-blue-600 font-medium mt-1">
              {daysUntilText}
            </Text>
          )}
        </View>

        {/* Recurring indicator */}
        {isRecurring && (
          <View className="items-center">
            <Ionicons name="repeat" size={18} color="#9CA3AF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
