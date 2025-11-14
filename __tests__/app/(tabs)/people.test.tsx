import { render, screen } from '@testing-library/react-native';
import PeopleScreen from '@/app/(tabs)/people';

describe('PeopleScreen', () => {
  it('renders with correct header', () => {
    render(<PeopleScreen />);
    expect(screen.getByText('Your Recipients')).toBeTruthy();
  });

  it('displays placeholder text', () => {
    render(<PeopleScreen />);
    expect(screen.getByText('Your recipients will appear here')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<PeopleScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
