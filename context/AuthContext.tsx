'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';
import {
  isDemoActive,
  setDemoActive,
  loadLocalProfile,
} from '@/lib/localStore';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  loginDemo: (heroName?: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockUser(username = 'Hero'): User {
  return {
    id: 'demo-hero',
    app_metadata: { provider: 'demo' },
    user_metadata: { username },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'hero@realm.local',
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  async function loadProfile(uid: string) {
    if (uid === 'demo-hero') {
      const p = loadLocalProfile();
      setProfile(p);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error.message);
        return;
      }
      setProfile(data as Profile | null);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    if (isDemoActive()) {
      const demoProfile = loadLocalProfile();
      setUser(createMockUser(demoProfile.username));
      setProfile(demoProfile);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          loadProfile(data.session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        if (isDemoActive()) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  function loginDemo(heroName = 'Hero') {
    setDemoActive(true);
    const p = loadLocalProfile(heroName);
    setUser(createMockUser(p.username));
    setProfile(p);
    setIsDemo(true);
  }

  async function signUp(email: string, password: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed. Please try again.' };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Network error connecting to Supabase.' };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Network error connecting to Supabase.' };
    }
  }

  async function signOut() {
    if (isDemo) {
      setDemoActive(false);
      setIsDemo(false);
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setProfile(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, isDemo, signUp, signIn, loginDemo, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
