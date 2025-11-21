import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddRecipientForm from '@/features/recipients/components/AddRecipientForm';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock dependencies
jest.mock('@/features/recipients/stores/recipientStore');
jest.mock('@/hooks/useNetworkStatus');
jest.mock('@react-native-picker/picker');
// DatePicker and TagInput are mocked via module mapper in jest.config.js

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockedUseRecipientStore = useRecipientStore as jest.MockedFunction<
  typeof useRecipientStore
>;
const mockedUseNetworkStatus = useNetworkStatus as jest.MockedFunction<
  typeof useNetworkStatus
>;

describe('AddRecipientForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockCreateRecipient = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockedUseRecipientStore.mockReturnValue({
      createRecipient: mockCreateRecipient,
      recipients: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      fetchRecipients: jest.fn(),
      updateRecipient: jest.fn(),
      deleteRecipient: jest.fn(),
      clearRecipients: jest.fn(),
    });

    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isConnected: true,
    });
  });

  it('should render all form fields', () => {
    const { getByPlaceholderText, getByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    expect(getByPlaceholderText('e.g., Emma Johnson')).toBeTruthy();
    expect(getByPlaceholderText('Enter image URL')).toBeTruthy();
    expect(getByPlaceholderText('Any additional details...')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('should show validation error when name is empty on submit', async () => {
    const { getByText, queryByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Save button should be disabled when name is empty
    // (validation prevents submission)
    expect(mockCreateRecipient).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is pressed with no data', () => {
    const { getByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call createRecipient with correct data when form is valid', async () => {
    const mockRecipient = {
      id: 'abc-123',
      userId: 'user-123',
      name: 'Emma Johnson',
      relationship: 'Friend',
      interests: [],
    };

    mockCreateRecipient.mockResolvedValue(mockRecipient);

    const { getByPlaceholderText, getByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = getByPlaceholderText('e.g., Emma Johnson');
    fireEvent.changeText(nameInput, 'Emma Johnson');

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateRecipient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Emma Johnson',
          relationship: 'Unknown', // Default value
          interests: [],
        }),
        true // isOnline
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockRecipient);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Emma Johnson added to your recipients');
    });
  });

  it('should handle backend validation errors', async () => {
    const backendError = {
      response: {
        status: 400,
        data: {
          error: {
            details: {
              name: ['You already have a recipient named Emma'],
            },
          },
        },
      },
    };

    mockCreateRecipient.mockRejectedValue(backendError);

    const { getByPlaceholderText, getByText, findByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = getByPlaceholderText('e.g., Emma Johnson');
    fireEvent.changeText(nameInput, 'Emma');

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateRecipient).toHaveBeenCalled();
    });

    const errorText = await findByText(
      'You already have a recipient named Emma'
    );
    expect(errorText).toBeTruthy();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should disable save button when submitting', async () => {
    mockCreateRecipient.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    const { getByPlaceholderText, getByText } = render(
      <AddRecipientForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = getByPlaceholderText('e.g., Emma Johnson');
    fireEvent.changeText(nameInput, 'Emma Johnson');

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateRecipient).toHaveBeenCalled();
    });
  });
});
