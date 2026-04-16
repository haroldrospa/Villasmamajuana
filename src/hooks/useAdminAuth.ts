import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'client';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
}

const LOGS_KEY = 'vm_activity_logs';

function loadLogs(): ActivityLog[] {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLogs(logs: ActivityLog[]) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function useAdminAuth() {
  const { user: currentAuthUser, isAdmin: isCurrentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(loadLogs);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get profiles and their roles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');
      
      if (pError) throw pError;

      const { data: roles, error: rError } = await supabase
        .from('user_roles')
        .select('*');

      if (rError) throw rError;

      // In a real scenario, we might not have all emails in profiles
      // but let's assume profiles contain what we need or we fetch from auth (which is restricted)
      // For now, we'll map what we have.
      
      const mappedUsers: AdminProfile[] = profiles.map(p => {
        const userRole = roles.find(r => r.user_id === p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          email: 'Usuario Supabase', // Emails are in auth.users, not always in public.profiles
          role: userRole?.role || 'client',
          created_at: p.created_at
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCurrentAdmin) {
      fetchUsers();
    }
  }, [isCurrentAdmin, fetchUsers]);

  useEffect(() => { saveLogs(activityLogs); }, [activityLogs]);

  const logActivity = useCallback((action: string) => {
    if (!currentAuthUser) return;
    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      adminId: currentAuthUser.id,
      adminName: currentAuthUser.email || 'Admin',
      action,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs(prev => {
      const updated = [log, ...prev].slice(0, 100);
      saveLogs(updated);
      return updated;
    });
  }, [currentAuthUser]);

  const toggleAdminRole = async (userId: string, currentRole: 'admin' | 'client') => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    
    try {
      if (newRole === 'admin') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }

      logActivity(`${newRole === 'admin' ? 'Promovido' : 'Degradado'} usuario: ${userId}`);
      await fetchUsers();
      return null;
    } catch (error: any) {
      return error.message;
    }
  };

  return {
    admins: users, // Reusing name for compatibility
    currentAdmin: currentAuthUser ? { name: currentAuthUser.email, id: currentAuthUser.id } : null,
    activityLogs,
    isLoading,
    toggleAdminRole,
    refresh: fetchUsers,
  };
}
