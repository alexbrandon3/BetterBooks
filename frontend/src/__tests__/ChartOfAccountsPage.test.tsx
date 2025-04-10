import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ChartOfAccountsPage from '../pages/ChartOfAccountsPage';

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

describe('ChartOfAccountsPage', () => {
  it('renders page title', () => {
    renderWithProviders(<ChartOfAccountsPage />);
    expect(screen.getByText(/chart of accounts/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderWithProviders(<ChartOfAccountsPage />);
    expect(screen.getByRole('button', { name: /add new account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore defaults/i })).toBeInTheDocument();
  });

  it('opens add account dialog when clicking add button', () => {
    renderWithProviders(<ChartOfAccountsPage />);
    const addButton = screen.getByRole('button', { name: /add new account/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/add new account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty account form', async () => {
    renderWithProviders(<ChartOfAccountsPage />);
    const addButton = screen.getByRole('button', { name: /add new account/i });
    fireEvent.click(addButton);

    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/account type is required/i)).toBeInTheDocument();
    });
  });

  it('renders accounts table', () => {
    renderWithProviders(<ChartOfAccountsPage />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/account name/i)).toBeInTheDocument();
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/actions/i)).toBeInTheDocument();
  });

  it('allows editing account name inline', async () => {
    renderWithProviders(<ChartOfAccountsPage />);
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue(/cash/i);
    fireEvent.change(nameInput, { target: { value: 'New Account Name' } });
    fireEvent.keyDown(nameInput, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/new account name/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when deleting account', () => {
    renderWithProviders(<ChartOfAccountsPage />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });
}); 