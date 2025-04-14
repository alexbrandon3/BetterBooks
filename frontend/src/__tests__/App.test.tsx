import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import App from '../App';

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );
};

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('redirects to login page when not authenticated', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
    });
  });

  it('renders login page by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
  });

  it('renders register page when navigating to /register', () => {
    renderWithProviders(<App />, { route: '/register' });
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });
}); 