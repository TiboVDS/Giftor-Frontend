import { render, screen } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('renders with correct header', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Upcoming Occasions')).toBeTruthy();
  });

  it('displays placeholder text', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Upcoming occasions will appear here')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<HomeScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
