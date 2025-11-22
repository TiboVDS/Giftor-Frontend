/**
 * Generates initials from a person's name for avatar placeholders.
 *
 * @param name - The person's full name
 * @returns Uppercase initials (2 letters)
 *
 * @example
 * getInitials("Emma Johnson") // Returns "EJ"
 * getInitials("Emma") // Returns "EM"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '??';
  }

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);

  if (words.length >= 2) {
    // Two or more words: First letter of first word + first letter of second word
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    // Single word: First 2 letters
    const singleWord = words[0];
    if (singleWord.length >= 2) {
      return singleWord.substring(0, 2).toUpperCase();
    } else {
      // Single letter name
      return singleWord[0].toUpperCase();
    }
  }
}

/**
 * Palette of pleasant colors for avatar backgrounds.
 * Avoids colors that are too dark or too light for accessibility.
 */
const AVATAR_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#A855F7', // Purple
  '#F43F5E', // Rose
  '#0EA5E9', // Sky
  '#22C55E', // Green
];

/**
 * Generates a consistent color for an avatar based on the person's name.
 * The same name will always produce the same color.
 *
 * @param name - The person's full name
 * @returns Hex color code
 *
 * @example
 * getAvatarColor("Emma Johnson") // Always returns the same color for this name
 */
export function getAvatarColor(name: string): string {
  if (!name || name.trim().length === 0) {
    return AVATAR_COLORS[0];
  }

  // Simple hash function to convert name to a number
  let hash = 0;
  const trimmedName = name.trim().toLowerCase();

  for (let i = 0; i < trimmedName.length; i++) {
    const char = trimmedName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index in color array
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
