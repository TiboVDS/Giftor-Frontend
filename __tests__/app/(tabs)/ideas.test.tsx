import { render, screen } from '@testing-library/react-native';
import IdeasScreen from '@/app/(tabs)/ideas';

describe('IdeasScreen', () => {
  it('renders with correct header', () => {
    render(<IdeasScreen />);
    expect(screen.getByText('All Gift Ideas')).toBeTruthy();
  });

  it('displays placeholder text', () => {
    render(<IdeasScreen />);
    expect(screen.getByText('Your gift ideas will appear here')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<IdeasScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
