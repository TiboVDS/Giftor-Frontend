import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { OccasionForm, OccasionFormData } from '../../src/features/occasions/components/OccasionForm';
import { useOccasionStore } from '../../src/features/occasions/stores/occasionStore';
import { useRecipientStore } from '../../src/features/recipients/stores/recipientStore';
import { useGiftIdeaStore } from '../../src/features/gift-ideas/stores/giftIdeaStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { OCCASION_TYPE_LABELS } from '../../src/features/occasions/components/OccasionTypeDropdown';

// Map occasion types to display colors (same as OccasionCard)
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

/**
 * OccasionDetailScreen - View and edit occasion details.
 * Implements Story 2.7 AC-6 (Edit occasion opens pre-filled form) and AC-7 (Auto-created birthday occasions can be edited).
 */
export default function OccasionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { occasions, updateOccasion, deleteOccasion } = useOccasionStore();
  const { recipients } = useRecipientStore();
  const { giftIdeas } = useGiftIdeaStore();
  const { isOnline } = useNetworkStatus();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find the occasion
  const occasion = useMemo(() => {
    return occasions.find((o) => o.id === id);
  }, [occasions, id]);

  // Find the recipient
  const recipient = useMemo(() => {
    if (!occasion) return null;
    return recipients.find((r) => r.id === occasion.recipientId);
  }, [occasion, recipients]);

  // Count gift ideas for this occasion
  const giftIdeasCount = useMemo(() => {
    if (!occasion) return 0;
    return giftIdeas.filter((g) => g.occasionId === occasion.id).length;
  }, [giftIdeas, occasion]);

  const handleBack = useCallback(() => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      router.back();
    }
  }, [router, isEditMode]);

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleSubmit = useCallback(
    async (data: OccasionFormData) => {
      if (!occasion) return;

      try {
        await updateOccasion(
          {
            ...occasion,
            name: data.name,
            type: data.type,
            date: data.date || undefined,
            reminderIntervals: data.reminderIntervals,
          },
          isOnline
        );

        Alert.alert('Success', 'Occasion updated');
        setIsEditMode(false);
      } catch (error: any) {
        console.error('Failed to update occasion:', error);
        Alert.alert(
          'Error',
          error.message || 'Could not update occasion. Please try again.'
        );
        throw error;
      }
    },
    [occasion, isOnline, updateOccasion]
  );

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleDelete = useCallback(() => {
    const recipientName = recipient?.name || 'this occasion';
    Alert.alert(
      'Delete this occasion?',
      `Gift ideas for ${recipientName} won't be deleted - they'll become unscheduled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!occasion) return;

            setIsDeleting(true);
            try {
              await deleteOccasion(occasion.id, isOnline);
              Alert.alert('Success', 'Occasion deleted', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              console.error('Failed to delete occasion:', error);
              Alert.alert(
                'Error',
                error.message || 'Could not delete occasion. Please try again.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [occasion, recipient, isOnline, deleteOccasion, router]);

  const handleNavigateToRecipient = useCallback(() => {
    if (recipient) {
      router.push(`/recipient/${recipient.id}`);
    }
  }, [recipient, router]);

  // Loading state
  if (!occasion) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Occasion Detail</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Occasion not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Edit mode
  if (isEditMode) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="mr-3"
            accessibilityLabel="Cancel editing"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Edit Occasion</Text>
        </View>
        <OccasionForm
          recipientId={occasion.recipientId}
          recipientName={recipient?.name}
          occasion={occasion}
          onSubmit={handleSubmit}
          onCancel={handleCancelEdit}
          testID="edit-occasion-form"
        />
      </SafeAreaView>
    );
  }

  // Get colors for occasion type badge
  const typeColors = OCCASION_TYPE_COLORS[occasion.type] || OCCASION_TYPE_COLORS.Custom;
  const typeLabel = OCCASION_TYPE_LABELS[occasion.type] || occasion.type;

  // Format date
  const formattedDate = occasion.date
    ? format(parseISO(occasion.date), 'EEEE, MMMM d, yyyy')
    : 'No date set';

  // Format reminder intervals
  const formatIntervals = (intervals: number[]): string => {
    if (!intervals || intervals.length === 0) return 'No reminders set';
    return intervals
      .map((d) => {
        if (d === 1) return '1 day';
        if (d === 7) return '1 week';
        if (d === 14) return '2 weeks';
        if (d === 30) return '1 month';
        return `${d} days`;
      })
      .join(', ');
  };

  // View mode
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="mr-3"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Occasion Detail</Text>
        </View>
        <Pressable
          onPress={handleEdit}
          className="px-3 py-1.5"
          accessibilityLabel="Edit occasion"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Occasion Name */}
        <Text className="text-2xl font-bold text-gray-900 mb-4">{occasion.name}</Text>

        {/* Occasion Type Badge */}
        <View
          className="self-start px-3 py-1.5 rounded-full mb-6"
          style={{ backgroundColor: typeColors.bg }}
        >
          <Text className="text-sm font-medium" style={{ color: typeColors.text }}>
            {typeLabel}
          </Text>
        </View>

        {/* Date */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 mb-1">Date</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text className="text-base text-gray-900 ml-2">{formattedDate}</Text>
          </View>
        </View>

        {/* Reminder Intervals */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 mb-1">Reminders</Text>
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text className="text-base text-gray-900 ml-2">
              {formatIntervals(occasion.reminderIntervals)}
            </Text>
          </View>
        </View>

        {/* Recipient */}
        {recipient && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 mb-1">Recipient</Text>
            <Pressable
              onPress={handleNavigateToRecipient}
              className="flex-row items-center"
              accessibilityLabel={`View ${recipient.name}'s profile`}
              accessibilityRole="link"
            >
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
              <Text className="text-base text-blue-600 ml-2">{recipient.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" className="ml-1" />
            </Pressable>
          </View>
        )}

        {/* Gift Ideas Count */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 mb-1">Gift Ideas</Text>
          <View className="flex-row items-center">
            <Ionicons name="gift-outline" size={20} color="#6B7280" />
            <Text className="text-base text-gray-900 ml-2">
              {giftIdeasCount === 0
                ? 'No gift ideas yet'
                : giftIdeasCount === 1
                ? '1 gift idea for this occasion'
                : `${giftIdeasCount} gift ideas for this occasion`}
            </Text>
          </View>
        </View>

        {/* Recurring indicator */}
        {occasion.isRecurring && (
          <View className="mb-6">
            <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg self-start">
              <Ionicons name="repeat" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">Recurring annually</Text>
            </View>
          </View>
        )}

        {/* Delete Button */}
        <View className="mt-8 mb-8">
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="flex-row items-center justify-center py-3 border border-red-300 rounded-lg"
            accessibilityLabel="Delete occasion"
            accessibilityRole="button"
          >
            {isDeleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text className="text-red-500 font-medium ml-2">Delete Occasion</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
