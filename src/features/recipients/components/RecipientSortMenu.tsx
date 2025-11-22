import React from 'react';
import { SortMenu, SortOption } from '../../../components/ui/SortMenu';
import { useRecipientStore, SortOption as RecipientSortOption } from '../stores/recipientStore';

const SORT_OPTIONS: SortOption[] = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Upcoming birthday', value: 'birthday' },
  { label: 'Recently added', value: 'recent' },
];

/**
 * Sort menu component integrated with recipient store.
 * Provides sort options for the recipient list with persistent preference.
 *
 * @example
 * <RecipientSortMenu />
 */
export function RecipientSortMenu() {
  const sortOption = useRecipientStore((state) => state.sortOption);
  const setSortOption = useRecipientStore((state) => state.setSortOption);

  const handleSelect = (value: string) => {
    setSortOption(value as RecipientSortOption);
  };

  return (
    <SortMenu
      options={SORT_OPTIONS}
      selectedValue={sortOption}
      onSelect={handleSelect}
    />
  );
}
