'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';
import {
  isDemoActive,
  setDemoActive,
  loadLocalProfile,
  saveLocalProfile,
} from '@/lib/localStore';
import { formatUsername } from '@/lib/rpg';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  loginDemo: (heroName?: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  sendPasswordResetEmail: (email?: string) => Promise<{ error: string | null }>;
  updateProfileBio: (updates: {
    username?: string;
    bio?: string;
    avatar_url?: string;
    country?: string;
    is_public?: boolean;
    onboarding_completed?: boolean;
  }) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockUser(username = 'Hero'): User {
  const cleanName = formatUsername(username);
  return {
    id: 'demo-hero',
    app_metadata: { provider: 'demo' },
    user_metadata: { username: cleanName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'hero@realm.local',
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

export function isPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return (
    !url ||
    url.includes('example.supabase.co') ||
    url.includes('placeholder') ||
    url.includes('your-supabase-project')
  );
}

function getUserLocalCache(uid: string): Profile | null {
  if (typeof window === 'undefined' || !uid) return null;
  try {
    const raw = localStorage.getItem(`life_rpg_profile_cache_${uid}`);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {
    // fallback
  }
  return null;
}

function saveUserLocalCache(uid: string, profile: Profile): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    localStorage.setItem(`life_rpg_profile_cache_${uid}`, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  async function loadProfile(uid: string) {
    if (uid === 'demo-hero' || isDemoActive() || isPlaceholderSupabase()) {
      const p = loadLocalProfile();
      setProfile({ ...p, username: formatUsername(p.username) });
      return;
    }

    try {
      // 2.5s timeout for network profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Profile load timeout' } }), 2500)
      );

      const { data, error } = (await Promise.race([profilePromise, timeoutPromise])) as {
        data: Profile | null;
        error: { message: string } | null;
      };

      if (error || !data) {
        // Auto-create profile record if it doesn't exist yet
        const defaultName = formatUsername(user?.user_metadata?.username || user?.email || 'Hero');
        const newProfile: Profile = {
          id: uid,
          username: defaultName,
          level: 1,
          xp: 0,
          total_xp: 0,
          gold: 0,
          strength: 0,
          intellect: 0,
          vitality: 0,
          charisma: 0,
          dexterity: 0,
          streak: 0,
          longest_streak: 0,
          last_active_date: new Date().toISOString().split('T')[0],
          avatar_url: null,
          created_at: new Date().toISOString(),
          onboarding_completed: false,
          country: 'US',
          is_public: true,
        };

        await supabase.from('profiles').upsert(newProfile);
        saveUserLocalCache(uid, newProfile);
        setProfile(newProfile);
      } else {
        const fullProfile: Profile = {
          id: uid,
          username: formatUsername(data.username || user?.user_metadata?.username || 'Hero'),
          bio: data.bio || '',
          country: data.country || 'US',
          is_public: data.is_public !== undefined ? data.is_public : true,
          onboarding_completed: data.onboarding_completed !== undefined ? data.onboarding_completed : false,
          level: data.level || 1,
          xp: data.xp || 0,
          total_xp: data.total_xp || 0,
          gold: data.gold || 0,
          strength: data.strength || 0,
          intellect: data.intellect || 0,
          vitality: data.vitality || 0,
          charisma: data.charisma || 0,
          dexterity: data.dexterity || 0,
          streak: data.streak || 0,
          longest_streak: data.longest_streak || 0,
          last_active_date: data.last_active_date || new Date().toISOString().split('T')[0],
          avatar_url: data.avatar_url || null,
          created_at: data.created_at || new Date().toISOString(),
        };
        saveUserLocalCache(uid, fullProfile);
        setProfile(fullProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      const cached = getUserLocalCache(uid);
      if (cached) {
        setProfile(cached);
      } else {
        const defaultName = formatUsername(user?.user_metadata?.username || user?.email || 'Hero');
        setProfile({
          id: uid,
          username: defaultName,
          level: 1,
          xp: 0,
          total_xp: 0,
          gold: 0,
          strength: 0,
          intellect: 0,
          vitality: 0,
          charisma: 0,
          dexterity: 0,
          streak: 0,
          longest_streak: 0,
          last_active_date: new Date().toISOString().split('T')[0],
          avatar_url: null,
          created_at: new Date().toISOString(),
          onboarding_completed: false,
          country: 'US',
          is_public: true,
        });
      }
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

    if (isPlaceholderSupabase()) {
      // If no live Supabase project is configured yet, resolve immediately
      setLoading(false);
      return;
    }

    // Safety timeout: Never stay in loading state for more than 1500ms
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);

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
      })
      .finally(() => {
        clearTimeout(timer);
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
      clearTimeout(timer);
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
    const cleanName = formatUsername(heroName);
    const p = loadLocalProfile(cleanName);
    const sanitizedProfile = { ...p, username: formatUsername(p.username) };
    setUser(createMockUser(sanitizedProfile.username));
    setProfile(sanitizedProfile);
    setIsDemo(true);
  }

  async function signUp(email: string, password: string, username: string) {
    const cleanUsername = formatUsername(username || email);
    if (isPlaceholderSupabase()) {
      loginDemo(cleanUsername);
      return { error: null };
    }

    try {
      const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: cleanUsername },
          emailRedirectTo,
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed. Please try again.' };
      if (!data.session) {
        return { error: 'Success! Please check your email to verify your account.' };
      }

      setSession(data.session);
      setUser(data.user);
      await loadProfile(data.user.id);
      return { error: null };
    } catch (err) {
      // Fallback to local mode
      loginDemo(cleanUsername);
      return { error: null };
    }
  }

  async function signInWithGoogle() {
    if (isPlaceholderSupabase()) {
      loginDemo('Hero');
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google authentication failed' };
    }
  }

  async function signIn(email: string, password: string) {
    const cleanUsername = formatUsername(email);
    if (isPlaceholderSupabase()) {
      loginDemo(cleanUsername);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await loadProfile(data.user.id);
      } else {
        return { error: 'Login failed. No session returned.' };
      }

      return { error: null };
    } catch (err) {
      loginDemo(cleanUsername);
      return { error: null };
    }
  }


  async function updatePassword(newPassword: string) {
    if (isDemo || isPlaceholderSupabase()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update password.' };
    }
  }

  async function sendPasswordResetEmail(targetEmail?: string) {
    const emailToSend = targetEmail || user?.email;
    if (!emailToSend) return { error: 'No email address found.' };

    if (isDemo || isPlaceholderSupabase()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to send password reset email.' };
    }
  }

  async function updateProfileBio(updates: {
    username?: string;
    bio?: string;
    avatar_url?: string;
    country?: string;
    is_public?: boolean;
    onboarding_completed?: boolean;
  }) {
    if (!profile) return { error: 'Profile not loaded' };

    const cleanUsername = updates.username !== undefined ? formatUsername(updates.username) : formatUsername(profile.username);

    const updatedProfile: Profile = {
      ...profile,
      username: cleanUsername,
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.country !== undefined && { country: updates.country }),
      ...(updates.is_public !== undefined && { is_public: updates.is_public }),
      ...(updates.onboarding_completed !== undefined && { onboarding_completed: updates.onboarding_completed }),
      ...(updates.avatar_url !== undefined && { avatar_url: updates.avatar_url }),
    };

    if (isDemo || isPlaceholderSupabase()) {
      saveLocalProfile(updatedProfile);
      setProfile(updatedProfile);
      if (user) {
        setUser({
          ...user,
          user_metadata: { ...user.user_metadata, username: cleanUsername },
        });
      }
      return { error: null };
    }

    try {
      const updateData: Record<string, unknown> = {
        ...updates,
        ...(updates.username !== undefined && { username: cleanUsername }),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        // If country/is_public/onboarding_completed/bio columns are not yet created on remote Supabase instance
        if (
          error.message?.includes('schema cache') ||
          error.message?.includes("'country'") ||
          error.message?.includes("'is_public'") ||
          error.message?.includes("'onboarding_completed'") ||
          error.message?.includes("'bio'")
        ) {
          // Remove columns that might not exist in remote Supabase schema
          delete updateData.country;
          delete updateData.is_public;
          delete updateData.onboarding_completed;
          delete updateData.bio;

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', profile.id);
          }
        } else {
          return { error: error.message };
        }
      }

      saveUserLocalCache(profile.id, updatedProfile);
      setProfile(updatedProfile);

      if (updates.username) {
        await supabase.auth.updateUser({
          data: { username: cleanUsername },
        });
      }

      setProfile(updatedProfile);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update profile.' };
    }
  }

  async function deleteAccount() {
    if (isDemo || isPlaceholderSupabase()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('life_rpg_demo_profile');
        localStorage.removeItem('life_rpg_demo_quests');
        localStorage.removeItem('life_rpg_demo_inventory');
        localStorage.removeItem('life_rpg_custom_categories');
        localStorage.removeItem('life_rpg_active_tab');
      }
      await signOut();
      return { error: null };
    }

    if (!user) return { error: 'No user signed in' };

    try {
      // Clean up user data tables
      await supabase.from('quests').delete().eq('user_id', user.id);
      await supabase.from('inventory').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      await signOut();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete account data.' };
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
      value={{
        session,
        user,
        profile,
        loading,
        isDemo,
        signUp,
        signIn,
        signInWithGoogle,
        loginDemo,
        signOut,
        refreshProfile,
        updatePassword,
        sendPasswordResetEmail,
        updateProfileBio,
        deleteAccount,
      }}
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
