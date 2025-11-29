import { useMemo } from 'react';
import { useOccasionStore } from '../stores/occasionStore';
import { useRecipientStore } from '../../recipients/stores/recipientStore';
import { useGiftIdeaStore } from '../../gift-ideas/stores/giftIdeaStore';
import { Occasion } from '../../../types/database.types';

export interface UpcomingOccasionData {
  /** The occasion */
  occasion: Occasion;
  /** The recipient's name */
  recipientName: string;
  /** Number of gift ideas associated with this occasion */
  giftIdeasCount: number;
}

export interface UseUpcomingOccasionsResult {
  /** Array of upcoming occasions with associated data */
  upcomingOccasions: UpcomingOccasionData[];
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are no upcoming occasions */
  isEmpty: boolean;
}

/**
 * Hook for fetching upcoming occasions with recipient names and gift idea counts.
 * Returns occasions within the next 30 days, sorted by date ascending.
 *
 * @param daysAhead - Number of days to look ahead (default 30)
 * @returns Object containing upcoming occasions data, loading state, error, and isEmpty flag
 *
 * @example
 * const { upcomingOccasions, isLoading, isEmpty } = useUpcomingOccasions();
 *
 * if (isLoading) return <Loading />;
 * if (isEmpty) return <EmptyState />;
 *
 * return upcomingOccasions.map(data => (
 *   <UpcomingOccasionCard
 *     key={data.occasion.id}
 *     occasion={data.occasion}
 *     recipientName={data.recipientName}
 *     giftIdeasCount={data.giftIdeasCount}
 *   />
 * ));
 */
export function useUpcomingOccasions(daysAhead = 30): UseUpcomingOccasionsResult {
  const { occasions, isLoading: occasionsLoading, error: occasionsError, getUpcomingOccasions } = useOccasionStore();
  const { recipients, isLoading: recipientsLoading } = useRecipientStore();
  const { giftIdeas, isLoading: giftIdeasLoading } = useGiftIdeaStore();

  const isLoading = occasionsLoading || recipientsLoading || giftIdeasLoading;
  const error = occasionsError;

  const upcomingOccasions = useMemo(() => {
    const upcoming = getUpcomingOccasions(daysAhead);

    return upcoming.map((occasion): UpcomingOccasionData => {
      // Find recipient name
      const recipient = recipients.find((r) => r.id === occasion.recipientId);
      const recipientName = recipient?.name || 'Unknown';

      // Count gift ideas for this occasion
      const giftIdeasCount = giftIdeas.filter(
        (g) => g.occasionId === occasion.id
      ).length;

      return {
        occasion,
        recipientName,
        giftIdeasCount,
      };
    });
  }, [occasions, recipients, giftIdeas, daysAhead, getUpcomingOccasions]);

  const isEmpty = !isLoading && upcomingOccasions.length === 0;

  return {
    upcomingOccasions,
    isLoading,
    error,
    isEmpty,
  };
}
