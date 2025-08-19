import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';

interface UseAuthGateReturn {
  requireAuth: (intendedPath: string, courseId?: string) => void;
  isAuthenticated: boolean;
  user: any;
}

export const useAuthGate = (): UseAuthGateReturn => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isAuthenticated = !!user;

  const requireAuth = useCallback((intendedPath: string, courseId?: string) => {
    if (isAuthenticated) {
      // User is already authenticated, navigate to intended path
      navigate(intendedPath);
      return;
    }

    console.log('Auth required for:', { intendedPath, courseId });

    // Store the intended destination
    const redirectData = {
      path: intendedPath,
      courseId,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('auth_redirect', JSON.stringify(redirectData));
    
    // Redirect to login with course context
    const loginUrl = courseId 
      ? `/login?redirect=${encodeURIComponent(intendedPath)}&course=${courseId}`
      : `/login?redirect=${encodeURIComponent(intendedPath)}`;
    
    console.log('Redirecting to login:', loginUrl);
    navigate(loginUrl);
  }, [isAuthenticated, navigate]);

  return {
    requireAuth,
    isAuthenticated,
    user
  };
};

// Utility function to get and clear redirect data
export const getAuthRedirect = () => {
  const redirectData = sessionStorage.getItem('auth_redirect');
  if (redirectData) {
    try {
      const parsed = JSON.parse(redirectData);
      // Check if redirect data is not too old (1 hour)
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed;
      }
    } catch (error) {
      console.error('Error parsing auth redirect data:', error);
    }
  }
  return null;
};

export const clearAuthRedirect = () => {
  sessionStorage.removeItem('auth_redirect');
};

// Hook for handling post-authentication redirects
export const useAuthRedirect = () => {
  const navigate = useNavigate();

  const handlePostAuthRedirect = useCallback(() => {
    const redirectData = getAuthRedirect();
    if (redirectData) {
      clearAuthRedirect();
      
      // Navigate to the intended destination
      if (redirectData.courseId) {
        navigate(`/dashboard/course/${redirectData.courseId}`);
      } else if (redirectData.path) {
        navigate(redirectData.path);
      } else {
        navigate('/dashboard');
      }
      return true;
    }
    return false;
  }, [navigate]);

  return { handlePostAuthRedirect };
};