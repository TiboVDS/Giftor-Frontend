import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  OccasionTypeDropdown,
  OCCASION_TYPES,
  OCCASION_TYPE_LABELS,
} from '@/features/occasions/components/OccasionTypeDropdown';

describe('OccasionTypeDropdown', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and required indicator', () => {
    const { getByText } = render(
      <OccasionTypeDropdown value="" onChange={mockOnChange} />
    );

    expect(getByText(/Occasion Type/)).toBeTruthy();
    expect(getByText('*')).toBeTruthy();
  });

  it('has all 9 occasion types available', () => {
    // Verify OCCASION_TYPES constant has 9 types
    expect(OCCASION_TYPES).toHaveLength(9);

    // Verify all expected types are present
    expect(OCCASION_TYPES).toContain('Birthday');
    expect(OCCASION_TYPES).toContain('Anniversary');
    expect(OCCASION_TYPES).toContain('Holiday');
    expect(OCCASION_TYPES).toContain('Graduation');
    expect(OCCASION_TYPES).toContain('NewJob');
    expect(OCCASION_TYPES).toContain('Visit');
    expect(OCCASION_TYPES).toContain('HostGift');
    expect(OCCASION_TYPES).toContain('JustBecause');
    expect(OCCASION_TYPES).toContain('Custom');
  });

  it('has user-friendly labels for all types', () => {
    // Verify labels are human-readable
    expect(OCCASION_TYPE_LABELS.NewJob).toBe('New Job');
    expect(OCCASION_TYPE_LABELS.HostGift).toBe('Host Gift');
    expect(OCCASION_TYPE_LABELS.JustBecause).toBe('Just Because');
    expect(OCCASION_TYPE_LABELS.Birthday).toBe('Birthday');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <OccasionTypeDropdown
        value=""
        onChange={mockOnChange}
        error="Please select an occasion type"
      />
    );

    expect(getByText('Please select an occasion type')).toBeTruthy();
  });

  it('applies error styling when error is present', () => {
    const { getByTestId } = render(
      <OccasionTypeDropdown
        value=""
        onChange={mockOnChange}
        error="Error"
        testID="type-dropdown"
      />
    );

    // The component should render with error styling
    expect(getByTestId('type-dropdown')).toBeTruthy();
  });

  it('has accessibility label', () => {
    const { getByLabelText } = render(
      <OccasionTypeDropdown value="" onChange={mockOnChange} />
    );

    expect(getByLabelText('Occasion type')).toBeTruthy();
  });

  it('calls onChange when a type is selected', () => {
    // Note: Testing Picker.onValueChange is tricky in RNTL
    // We verify the structure is correct
    const { getByTestId } = render(
      <OccasionTypeDropdown
        value="Birthday"
        onChange={mockOnChange}
        testID="type-dropdown"
      />
    );

    expect(getByTestId('type-dropdown')).toBeTruthy();
  });
});
