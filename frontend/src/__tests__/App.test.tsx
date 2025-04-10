import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithProviders(<App />);
    expect(getByTestId('app-container')).toBeInTheDocument();
  });

  it('redirects to login page when not authenticated', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('renders login page by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/Sign in to BetterBooks/i)).toBeInTheDocument();
  });

  it('renders register page when navigating to /register', () => {
    window.history.pushState({}, '', '/register');
    renderWithProviders(<App />);
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
  });
}); 