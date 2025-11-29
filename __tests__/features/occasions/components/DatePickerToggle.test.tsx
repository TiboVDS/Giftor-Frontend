import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DatePickerToggle } from '@/features/occasions/components/DatePickerToggle';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => 'Wednesday, January 15, 2025',
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  return {
    __esModule: true,
    default: ({ value, onChange }: any) => null,
  };
});

describe('DatePickerToggle', () => {
  const mockOnChange = jest.fn();
  const testDate = new Date('2025-01-15');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    expect(getByText('Date')).toBeTruthy();
  });

  it('shows "No specific date yet" toggle', () => {
    const { getByText, getByLabelText } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    expect(getByText('No specific date yet')).toBeTruthy();
    expect(getByLabelText('No specific date yet')).toBeTruthy();
  });

  it('shows date picker when date is set', () => {
    const { getByText } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    // Should show formatted date
    expect(getByText('Wednesday, January 15, 2025')).toBeTruthy();
  });

  it('hides date picker when toggle is enabled (no date)', () => {
    const { queryByText, getByLabelText } = render(
      <DatePickerToggle date={null} onChange={mockOnChange} />
    );

    // The formatted date should not appear
    expect(queryByText('Wednesday, January 15, 2025')).toBeNull();
    // Toggle should be on
    expect(getByLabelText('No specific date yet')).toBeTruthy();
  });

  it('clears date when toggle is turned on', () => {
    const { getByLabelText } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    // Toggle "no date"
    const toggle = getByLabelText('No specific date yet');
    fireEvent(toggle, 'valueChange', true);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('sets default date when toggle is turned off', () => {
    const { getByLabelText } = render(
      <DatePickerToggle date={null} onChange={mockOnChange} />
    );

    const toggle = getByLabelText('No specific date yet');
    fireEvent(toggle, 'valueChange', false);

    // Should be called with a Date object (today)
    expect(mockOnChange).toHaveBeenCalled();
    const calledWith = mockOnChange.mock.calls[0][0];
    expect(calledWith instanceof Date).toBe(true);
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <DatePickerToggle
        date={testDate}
        onChange={mockOnChange}
        error="Invalid date"
      />
    );

    expect(getByText('Invalid date')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByLabelText } = render(
      <DatePickerToggle
        date={testDate}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    // The toggle should reflect disabled state
    const toggle = getByLabelText('No specific date yet');
    expect(toggle.props.disabled).toBe(true);
  });

  it('has accessibility hint on toggle', () => {
    const { getByA11yHint } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    expect(getByA11yHint('Toggle to create an unscheduled occasion')).toBeTruthy();
  });

  it('opens date picker when date display is pressed', () => {
    const { getByLabelText } = render(
      <DatePickerToggle date={testDate} onChange={mockOnChange} />
    );

    const dateButton = getByLabelText(/Date:/);
    fireEvent.press(dateButton);

    // Note: The actual DateTimePicker is mocked, so we just verify the button exists
    expect(dateButton).toBeTruthy();
  });
});
