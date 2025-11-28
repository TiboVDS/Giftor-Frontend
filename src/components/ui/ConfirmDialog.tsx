import { Alert, AlertButton } from 'react-native';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * ConfirmDialog component
 * Uses native Alert API for platform-native confirmation dialogs
 * iOS: UIAlertController with destructive style
 * Android: Material Design AlertDialog
 */
export const showConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const buttons: AlertButton[] = [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ];

  Alert.alert(title, message, buttons);
};

export default showConfirmDialog;
