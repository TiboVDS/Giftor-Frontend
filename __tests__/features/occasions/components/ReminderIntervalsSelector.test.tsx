import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
  ReminderIntervalsSelector,
  PRESET_INTERVALS,
  DEFAULT_INTERVALS,
} from '@/features/occasions/components/ReminderIntervalsSelector';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ReminderIntervalsSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and description', () => {
    const { getByText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    expect(getByText('Reminder Intervals')).toBeTruthy();
    expect(getByText('Get reminded before the occasion')).toBeTruthy();
  });

  it('renders all preset interval chips', () => {
    const { getByText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    // Check all preset intervals are displayed
    PRESET_INTERVALS.forEach((preset) => {
      expect(getByText(preset.label)).toBeTruthy();
    });
  });

  it('shows default selection of [14, 7, 2]', () => {
    // Verify DEFAULT_INTERVALS constant
    expect(DEFAULT_INTERVALS).toEqual([14, 7, 2]);
  });

  it('toggles interval selection when chip is pressed', () => {
    const { getByText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    // Press "2 weeks" (14 days)
    const twoWeeksChip = getByText('2 weeks');
    fireEvent.press(twoWeeksChip);

    expect(mockOnChange).toHaveBeenCalledWith([14]);
  });

  it('removes interval when already selected chip is pressed', () => {
    const { getAllByText } = render(
      <ReminderIntervalsSelector value={[14, 7, 2]} onChange={mockOnChange} />
    );

    // Press "1 week" (7 days) to remove it - there are multiple "1 week" texts (chip and selected tag)
    const oneWeekChips = getAllByText('1 week');
    fireEvent.press(oneWeekChips[0]); // Press the preset chip

    expect(mockOnChange).toHaveBeenCalledWith([14, 2]);
  });

  it('shows custom input when Custom button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    // Press Custom button
    const customButton = getByText('Custom');
    fireEvent.press(customButton);

    // Input should appear
    expect(getByPlaceholderText('Days')).toBeTruthy();
    expect(getByText('days before')).toBeTruthy();
    expect(getByText('Add')).toBeTruthy();
  });

  it('adds custom interval when valid number is entered', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReminderIntervalsSelector value={[14, 7]} onChange={mockOnChange} />
    );

    // Open custom input
    fireEvent.press(getByText('Custom'));

    // Enter a value
    const input = getByPlaceholderText('Days');
    fireEvent.changeText(input, '5');

    // Press Add
    fireEvent.press(getByText('Add'));

    // Should add 5 to the intervals (sorted descending)
    expect(mockOnChange).toHaveBeenCalledWith([14, 7, 5]);
  });

  it('shows alert for invalid custom input', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    // Open custom input
    fireEvent.press(getByText('Custom'));

    // Enter invalid value
    const input = getByPlaceholderText('Days');
    fireEvent.changeText(input, '-5');

    // Press Add
    fireEvent.press(getByText('Add'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Input',
      'Please enter a positive number of days.'
    );
  });

  it('shows alert when custom interval exceeds 365 days', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Custom'));
    const input = getByPlaceholderText('Days');
    fireEvent.changeText(input, '400');
    fireEvent.press(getByText('Add'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Input',
      'Reminder cannot be more than 365 days before.'
    );
  });

  it('shows alert when duplicate custom interval is added', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReminderIntervalsSelector value={[14, 7]} onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Custom'));
    const input = getByPlaceholderText('Days');
    fireEvent.changeText(input, '7');
    fireEvent.press(getByText('Add'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Already Added',
      '7 days is already selected.'
    );
  });

  it('allows removing selected intervals', () => {
    const { getByLabelText } = render(
      <ReminderIntervalsSelector value={[14, 7, 2]} onChange={mockOnChange} />
    );

    // Remove 2 weeks reminder
    const removeButton = getByLabelText('Remove 2 weeks reminder');
    fireEvent.press(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([7, 2]);
  });

  it('shows warning when no reminders are selected', () => {
    const { getByText } = render(
      <ReminderIntervalsSelector value={[]} onChange={mockOnChange} />
    );

    expect(
      getByText("No reminders selected. You won't be notified before this occasion.")
    ).toBeTruthy();
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <ReminderIntervalsSelector
        value={[]}
        onChange={mockOnChange}
        error="Invalid intervals"
      />
    );

    expect(getByText('Invalid intervals')).toBeTruthy();
  });

  it('has correct accessibility roles on chips', () => {
    const { getAllByRole } = render(
      <ReminderIntervalsSelector value={[14]} onChange={mockOnChange} />
    );

    // Chips should be checkboxes - there are 6 preset chips
    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes.length).toBe(6);
  });
});
