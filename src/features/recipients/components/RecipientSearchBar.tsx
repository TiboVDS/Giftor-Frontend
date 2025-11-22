import React, { useState, useEffect } from 'react';
import { SearchBar } from '../../../components/ui/SearchBar';
import { useDebounce } from '../../../hooks/useDebounce';
import { useRecipientStore } from '../stores/recipientStore';

/**
 * Search bar component integrated with recipient store.
 * Debounces search input to avoid excessive filtering operations.
 *
 * @example
 * <RecipientSearchBar />
 */
export function RecipientSearchBar() {
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const setSearchQuery = useRecipientStore((state) => state.setSearchQuery);

  // Update store when debounced search changes
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  return (
    <SearchBar
      value={searchText}
      onChangeText={setSearchText}
      placeholder="Search by name..."
    />
  );
}
