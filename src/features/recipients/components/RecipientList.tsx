import React, { ReactNode } from 'react';
import { FlatList, View, RefreshControl } from 'react-native';
import { RecipientDto } from '../types/recipient.types';
import { RecipientCard } from './RecipientCard';

export interface RecipientListProps {
  /** Array of recipients to display */
  recipients: RecipientDto[];
  /** Callback when recipient card is tapped */
  onRecipientPress: (id: string) => void;
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
  getGiftIdeaCount,
  ListEmptyComponent,
  refreshing = false,
  onRefresh,
}: RecipientListProps) {
  return (
    <FlatList
      data={recipients}
      renderItem={({ item }) => (
        <RecipientCard
          recipient={item}
          giftIdeaCount={getGiftIdeaCount(item.id)}
          onPress={() => onRecipientPress(item.id)}
        />
      )}
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
