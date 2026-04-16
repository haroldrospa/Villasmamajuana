import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  profile: { full_name: string; phone: string } | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
    profile: null,
  });

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async (session: Session | null) => {
      if (!session) {
        if (mounted) {
          setState({ user: null, session: null, isAdmin: false, isLoading: false, profile: null });
        }
        return;
      }

      try {
        const userId = session.user.id;
        
        // Cargamos los datos básicos primero
        const [isAdminResult, profileResult] = await Promise.all([
          checkAdmin(userId).catch(() => false),
          loadProfile(userId).catch(() => null),
        ]);

        if (mounted) {
          setState({ 
            user: session.user, 
            session, 
            isAdmin: isAdminResult, 
            isLoading: false, 
            profile: profileResult 
          });
        }

        // Si no hay perfil, lo creamos en segundo plano para no bloquear al usuario
        if (!profileResult && mounted) {
          const { error: upsertError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: session.user.user_metadata?.full_name || 'Usuario',
            phone: session.user.user_metadata?.phone || null
          });

          if (!upsertError) {
            const newProfile = await loadProfile(userId).catch(() => null);
            if (mounted && newProfile) {
              setState(prev => ({ ...prev, profile: newProfile }));
            }
          }
        }
      } catch (error) {
        console.error("Critical auth error:", error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        initializeAuth(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdmin, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === 'Email not confirmed') {
        throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión. Por favor revisa tu bandeja de entrada.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          phone: phone || ''
        },
      },
    });

    if (error) throw error;

    // Si no hay sesión pero sí usuario, significa que requiere confirmación por email
    if (data.user && !data.session) {
      return { needsConfirmation: true };
    }

    // Si hay sesión (inicio automático), intentamos asegurar que el perfil exista
    if (data.user) {
      // Intentamos insertar el perfil por si acaso no hay trigger
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            phone: phone || null
          });
        
        if (profileError) console.warn("Could not upsert profile manually (might be RLS or trigger exists):", profileError);
      } catch (e) {
        console.error("Error creating profile:", e);
      }
    }
    
    return { needsConfirmation: false };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  };

  return { ...state, signIn, signUp, signOut, resendConfirmationEmail };
}
