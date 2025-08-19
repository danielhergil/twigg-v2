import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useAuthGate, getAuthRedirect, clearAuthRedirect } from '../useAuthGate';
import { useUser } from '../useUser';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../useUser', () => ({
  useUser: jest.fn()
}));

const mockNavigate = jest.fn();
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('useAuthGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  it('navigates directly when user is authenticated', () => {
    mockUseUser.mockReturnValue({ user: { id: '1' } });

    const { result } = renderHook(() => useAuthGate());

    act(() => {
      result.current.requireAuth('/dashboard/course/123', '123');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/course/123');
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseUser.mockReturnValue({ user: null });

    const { result } = renderHook(() => useAuthGate());

    act(() => {
      result.current.requireAuth('/dashboard/course/123', '123');
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'auth_redirect',
      expect.stringContaining('"path":"/dashboard/course/123"')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      '/login?redirect=%2Fdashboard%2Fcourse%2F123&course=123'
    );
  });

  it('returns correct authentication status', () => {
    mockUseUser.mockReturnValue({ user: { id: '1' } });

    const { result } = renderHook(() => useAuthGate());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: '1' });
  });
});

describe('getAuthRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns redirect data when valid', () => {
    const redirectData = {
      path: '/dashboard/course/123',
      courseId: '123',
      timestamp: Date.now()
    };

    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(redirectData));

    const result = getAuthRedirect();

    expect(result).toEqual(redirectData);
  });

  it('returns null when data is expired', () => {
    const redirectData = {
      path: '/dashboard/course/123',
      courseId: '123',
      timestamp: Date.now() - 4000000 // 4 hours ago
    };

    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(redirectData));

    const result = getAuthRedirect();

    expect(result).toBeNull();
  });

  it('returns null when no data exists', () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    const result = getAuthRedirect();

    expect(result).toBeNull();
  });

  it('returns null when data is invalid JSON', () => {
    mockSessionStorage.getItem.mockReturnValue('invalid json');

    const result = getAuthRedirect();

    expect(result).toBeNull();
  });
});

describe('clearAuthRedirect', () => {
  it('removes redirect data from session storage', () => {
    clearAuthRedirect();

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_redirect');
  });
});