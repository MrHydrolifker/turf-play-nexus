import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'player' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role if user exists
        if (session?.user) {
          setTimeout(async () => {
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id);
            
            if (rolesData && rolesData.length > 0) {
              const roles = rolesData.map((r: any) => r.role);
              const resolvedRole = roles.includes('admin') ? 'admin' : roles.includes('vendor') ? 'vendor' : 'player';
              setUserRole(resolvedRole);
            }
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .then(({ data: rolesData }) => {
            if (rolesData && rolesData.length > 0) {
              const roles = rolesData.map((r: any) => r.role);
              const resolvedRole = roles.includes('admin') ? 'admin' : roles.includes('vendor') ? 'vendor' : 'player';
              setUserRole(resolvedRole);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/auth');
  };

  return { user, session, loading, userRole, signOut };
}
