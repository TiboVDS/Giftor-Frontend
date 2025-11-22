import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying its update until after the specified delay.
 * Useful for search inputs to avoid excessive re-renders and API calls.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms for search inputs)
 * @returns The debounced value
 *
 * @example
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearch = useDebounce(searchText, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
