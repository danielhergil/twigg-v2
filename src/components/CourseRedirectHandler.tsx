import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useAuthGate } from '@/hooks/useAuthGate';

export const CourseRedirectHandler = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const { requireAuth } = useAuthGate();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (!courseId) {
      // Invalid course ID, redirect to explore
      navigate('/dashboard/explore');
      return;
    }

    if (user) {
      // User is authenticated, redirect to course
      navigate(`/dashboard/course/${courseId}`);
    } else {
      // User is not authenticated, trigger auth gate
      requireAuth(`/dashboard/course/${courseId}`, courseId);
    }
  }, [user, loading, courseId, navigate, requireAuth]);

  // Show loading state while determining auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // This component doesn't render anything visible, it just handles redirects
  return null;
};