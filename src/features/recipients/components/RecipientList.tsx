import React, { ReactNode } from 'react';
import { FlatList, View, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { RecipientDto } from '../types/recipient.types';
import { RecipientCard } from './RecipientCard';

export interface RecipientListProps {
  /** Array of recipients to display */
  recipients: RecipientDto[];
  /** Callback when recipient card is tapped */
  onRecipientPress: (id: string) => void;
  /** Callback when delete button is tapped (swipe-to-delete) */
  onDelete?: (id: string, name: string) => void;
  /** Function to get gift idea count for a recipient */
  getGiftIdeaCount: (recipientId: string) => number;
  /** Component to show when list is empty */
  ListEmptyComponent?: ReactNode;
  /** Pull-to-refresh state */
  refreshing?: boolean;
  /** Pull-to-refresh callback */
  onRefresh?: () => void;
}

/**
 * Virtualized list of recipients using FlatList for performance.
 * Renders RecipientCard components with pull-to-refresh support.
 *
 * @example
 * <RecipientList
 *   recipients={recipients}
 *   onRecipientPress={handleRecipientPress}
 *   getGiftIdeaCount={getGiftIdeaCount}
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 *   ListEmptyComponent={<EmptyState ... />}
 * />
 */
export function RecipientList({
  recipients,
  onRecipientPress,
  onDelete,
  getGiftIdeaCount,
  ListEmptyComponent,
  refreshing = false,
  onRefresh,
}: RecipientListProps) {
  /**
   * Render right actions for swipe (Delete button)
   */
  const renderRightActions = (recipientId: string, recipientName: string) => (
    <View className="justify-center">
      <TouchableOpacity
        onPress={() => onDelete?.(recipientId, recipientName)}
        className="bg-red-600 justify-center items-center w-20 h-full rounded-r-lg"
        accessibilityLabel={`Delete ${recipientName}`}
        accessibilityRole="button"
        accessibilityHint="Deletes this recipient and all associated data"
      >
        <Text className="text-white font-semibold text-sm">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render individual recipient item
   */
  const renderItem = ({ item }: { item: RecipientDto }) => {
    const card = (
      <RecipientCard
        recipient={item}
        giftIdeaCount={getGiftIdeaCount(item.id)}
        onPress={() => onRecipientPress(item.id)}
        accessibilityHint={onDelete ? 'Swipe left to delete' : undefined}
      />
    );

    // If onDelete is provided, wrap in Swipeable
    if (onDelete) {
      return (
        <Swipeable
          renderRightActions={() => renderRightActions(item.id, item.name)}
          overshootRight={false}
        >
          {card}
        </Swipeable>
      );
    }

    // Otherwise, just return the card
    return card;
  };

  return (
    <FlatList
      data={recipients}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View className="h-2" />}
      contentContainerStyle={{
        padding: 16,
        flexGrow: 1,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      ListEmptyComponent={ListEmptyComponent as any}
      showsVerticalScrollIndicator={false}
    />
  );
}
