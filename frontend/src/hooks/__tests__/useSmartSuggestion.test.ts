import { renderHook, act } from '@testing-library/react';
import { useSmartSuggestion } from '../useSmartSuggestion';
import axios from '../../utils/axios';

// Mock axios
jest.mock('../../utils/axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useSmartSuggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should initialize with null suggestion and desktop mode', () => {
    const { result } = renderHook(() => useSmartSuggestion());

    expect(result.current.suggestion).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isMobile).toBe(false);
  });

  it('should detect mobile mode when window width is small', () => {
    // Set small window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useSmartSuggestion());

    expect(result.current.isMobile).toBe(true);
  });

  it('should not fetch suggestion for empty description', async () => {
    const { result } = renderHook(() => useSmartSuggestion());

    await act(async () => {
      result.current.fetchSuggestion('');
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(result.current.suggestion).toBeNull();
  });

  it('should fetch suggestion for valid description', async () => {
    const mockResponse = {
      data: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSmartSuggestion());

    await act(async () => {
      result.current.fetchSuggestion('Dinner at restaurant');
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/suggest-account', {
      description: 'Dinner at restaurant'
    });
    expect(result.current.suggestion).toEqual(mockResponse.data);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useSmartSuggestion());

    await act(async () => {
      result.current.fetchSuggestion('Dinner at restaurant');
    });

    expect(result.current.error).toBe('Failed to get suggestion');
    expect(result.current.suggestion).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching account suggestion:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should clear suggestion when clearSuggestion is called', () => {
    const { result } = renderHook(() => useSmartSuggestion());

    act(() => {
      result.current.clearSuggestion();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should debounce multiple calls', async () => {
    jest.useFakeTimers();
    
    const mockResponse = {
      data: {
        suggestedAccountId: 2,
        suggestedAccountName: 'Meals & Entertainment',
        reason: "Matched keyword: 'restaurant' → Category: Food"
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSmartSuggestion());

    // Make multiple rapid calls
    act(() => {
      result.current.fetchSuggestion('Dinner');
      result.current.fetchSuggestion('Dinner at');
      result.current.fetchSuggestion('Dinner at restaurant');
    });

    // Should not have called API yet
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // Fast forward past debounce delay
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Should have called API with last value
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/suggest-account', {
      description: 'Dinner at restaurant'
    });

    jest.useRealTimers();
  });

  it('should update mobile detection on window resize', () => {
    const { result } = renderHook(() => useSmartSuggestion());

    // Initially desktop
    expect(result.current.isMobile).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isMobile).toBe(true);
  });
}); 