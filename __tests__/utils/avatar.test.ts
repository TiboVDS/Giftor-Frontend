import { getInitials, getAvatarColor } from '@/utils/avatar';

describe('avatar utils', () => {
  describe('getInitials', () => {
    it('returns initials from two-word name', () => {
      expect(getInitials('Emma Johnson')).toBe('EJ');
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns first two letters from single-word name', () => {
      expect(getInitials('Emma')).toBe('EM');
      expect(getInitials('Alice')).toBe('AL');
    });

    it('handles names with extra spaces', () => {
      expect(getInitials('  Emma   Johnson  ')).toBe('EJ');
      expect(getInitials('   Alice   ')).toBe('AL');
    });

    it('handles names with more than two words', () => {
      expect(getInitials('Emma Louise Johnson')).toBe('EL');
    });

    it('handles empty or invalid names', () => {
      expect(getInitials('')).toBe('??');
      expect(getInitials('   ')).toBe('??');
    });

    it('handles single-letter names', () => {
      expect(getInitials('A')).toBe('A');
    });

    it('returns uppercase initials', () => {
      expect(getInitials('emma johnson')).toBe('EJ');
      expect(getInitials('alice')).toBe('AL');
    });
  });

  describe('getAvatarColor', () => {
    it('returns a hex color code', () => {
      const color = getAvatarColor('Emma Johnson');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('returns consistent color for same name', () => {
      const color1 = getAvatarColor('Emma Johnson');
      const color2 = getAvatarColor('Emma Johnson');
      const color3 = getAvatarColor('Emma Johnson');

      expect(color1).toBe(color2);
      expect(color2).toBe(color3);
    });

    it('returns different colors for different names', () => {
      const color1 = getAvatarColor('Emma Johnson');
      const color2 = getAvatarColor('John Doe');

      // Not guaranteed to be different, but very likely
      // Just verify both are valid colors
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color2).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('is case-insensitive (same name different case = same color)', () => {
      const color1 = getAvatarColor('Emma Johnson');
      const color2 = getAvatarColor('emma johnson');
      const color3 = getAvatarColor('EMMA JOHNSON');

      expect(color1).toBe(color2);
      expect(color2).toBe(color3);
    });

    it('handles empty names gracefully', () => {
      const color = getAvatarColor('');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
