import { supabase } from './authClient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

/**
 * Upload profile picture to Supabase Storage
 * Resizes image to 512x512px before upload
 * @param imageUri - Local file URI from image picker
 * @param recipientId - Recipient ID for path
 * @param userId - User ID for path
 * @returns Public URL of uploaded image
 */
export async function uploadProfilePicture(
  imageUri: string,
  recipientId: string,
  userId: string
): Promise<string> {
  try {
    // Resize image to 512x512px
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Read file as base64
    const base64Response = await fetch(resized.uri);
    const arrayBuffer = await base64Response.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (overwrites existing file)
    const path = `users/${userId}/recipients/${recipientId}/profile.jpg`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, fileData, {
        upsert: true, // Overwrite existing file
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get signed URL (valid for 1 year) - for private bucket access
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 31536000); // 1 year in seconds

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw signedUrlError;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

/**
 * Delete profile picture from Supabase Storage
 * @param recipientId - Recipient ID
 * @param userId - User ID
 */
export async function deleteProfilePicture(
  recipientId: string,
  userId: string
): Promise<void> {
  try {
    const path = `users/${userId}/recipients/${recipientId}/profile.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    // Ignore 404 errors (file doesn't exist)
    if (error && !error.message.includes('not found')) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    // Don't throw - cleanup is non-critical
  }
}

/**
 * Request image picker permissions and pick image
 * @returns Image URI or null if cancelled
 */
export async function pickImage(): Promise<string | null> {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'We need camera roll permissions to select a profile picture.'
    );
    return null;
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Request camera permissions and take photo
 * @returns Image URI or null if cancelled
 */
export async function takePhoto(): Promise<string | null> {
  // Request permissions
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'We need camera permissions to take a profile picture.'
    );
    return null;
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}
