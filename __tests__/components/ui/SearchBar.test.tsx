import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchBar } from '@/components/ui/SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Search by name..." />
    );

    expect(getByPlaceholderText('Search by name...')).toBeTruthy();
  });

  it('calls onChangeText when user types', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={mockOnChangeText} placeholder="Search..." />
    );

    const input = getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'test query');

    expect(mockOnChangeText).toHaveBeenCalledWith('test query');
  });

  it('shows clear button when text is not empty', () => {
    const { getByLabelText, queryByLabelText } = render(
      <SearchBar value="test" onChangeText={jest.fn()} />
    );

    expect(getByLabelText('Clear search')).toBeTruthy();

    // Re-render with empty value
    const { queryByLabelText: queryEmpty } = render(
      <SearchBar value="" onChangeText={jest.fn()} />
    );

    expect(queryEmpty('Clear search')).toBeNull();
  });

  it('clears text when clear button is pressed', () => {
    const mockOnChangeText = jest.fn();
    const { getByLabelText } = render(
      <SearchBar value="test" onChangeText={mockOnChangeText} />
    );

    const clearButton = getByLabelText('Clear search');
    fireEvent.press(clearButton);

    expect(mockOnChangeText).toHaveBeenCalledWith('');
  });
});
