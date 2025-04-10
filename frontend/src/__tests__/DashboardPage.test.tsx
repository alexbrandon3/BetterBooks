import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import DashboardPage from '../pages/DashboardPage';

// Mock the chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
}));

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
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage', () => {
  it('renders dashboard title', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('renders all dashboard cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/total expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/net income/i)).toBeInTheDocument();
    expect(screen.getByText(/cash flow/i)).toBeInTheDocument();
  });

  it('renders charts', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders recent transactions table', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view all transactions/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
}); 