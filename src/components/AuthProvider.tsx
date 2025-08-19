import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirect, clearAuthRedirect } from "@/hooks/useAuthGate";

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const createOrUpdateProfile = async (user: User) => {
    try {
      // Check if profile already exists to avoid unnecessary updates
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('id', user.id)
        .single();

      // Skip if profile was updated recently (within last hour) to prevent loops
      if (existingProfile?.updated_at) {
        const lastUpdate = new Date(existingProfile.updated_at);
        const now = new Date();
        const hourAgo = now.getTime() - (60 * 60 * 1000);
        
        if (lastUpdate.getTime() > hourAgo) {
          console.log('Profile updated recently, skipping update');
          return;
        }
      }

      // Extract name from user metadata (Google provides full_name)
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const firstName = user.user_metadata?.given_name || '';
      const lastName = user.user_metadata?.family_name || '';
      
      // If we don't have given_name/family_name, try to split full_name
      let finalFirstName = firstName;
      let finalLastName = lastName;
      
      if (!firstName && !lastName && fullName) {
        const nameParts = fullName.trim().split(' ');
        finalFirstName = nameParts[0] || '';
        finalLastName = nameParts.slice(1).join(' ') || '';
      }

      const profileData = {
        id: user.id,
        email: user.email || '',
        first_name: finalFirstName,
        last_name: finalLastName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        provider: user.app_metadata?.provider || 'email',
        email_confirmed: user.email_confirmed_at ? true : false,
        updated_at: new Date().toISOString(),
      };

      console.log('Creating/updating profile with data:', profileData);

      // Use upsert to create or update the profile
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error creating/updating profile:', error);
      } else {
        console.log('Profile created/updated successfully');
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
    }
  };

  useEffect(() => {
    // Get initial session without blocking on profile creation
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      
      // Create/update profile in background without blocking session restoration
      if (data.session?.user) {
        createOrUpdateProfile(data.session.user).catch(error => {
          console.error('Background profile creation failed:', error);
        });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Only create/update profile on actual sign-in events, not session restoration
      if (event === 'SIGNED_IN' && newSession?.user) {
        createOrUpdateProfile(newSession.user).catch(error => {
          console.error('Profile creation failed on sign-in:', error);
        });
        
        // Handle post-authentication redirect
        if (location.pathname === '/login' || location.pathname === '/') {
          const redirectData = getAuthRedirect();
          if (redirectData) {
            clearAuthRedirect();
            
            console.log('Redirecting user after authentication:', redirectData);
            
            // Navigate to the intended destination
            if (redirectData.courseId) {
              navigate(`/dashboard/course/${redirectData.courseId}`);
            } else if (redirectData.path) {
              navigate(redirectData.path);
            } else {
              navigate('/dashboard');
            }
          } else {
            // Check URL parameters as fallback
            const urlParams = new URLSearchParams(location.search);
            const redirectParam = urlParams.get('redirect');
            const courseParam = urlParams.get('course');
            
            if (courseParam) {
              navigate(`/dashboard/course/${courseParam}`);
            } else if (redirectParam) {
              navigate(decodeURIComponent(redirectParam));
            } else {
              navigate('/dashboard');
            }
          }
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
}