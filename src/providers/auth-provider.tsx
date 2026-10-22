import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { createSessionFromAuthLink } from '@/lib/auth-links';
import { supabase } from '@/lib/supabase';

export type Profile = {
  created_at: string;
  first_name: string;
  id: string;
  last_name: string;
  preferred_unit: 'lb' | 'kg';
  updated_at: string;
  username: string;
};

type AuthContextValue = {
  authLinkError: string | null;
  finishPasswordRecovery: () => void;
  isHandlingAuthLink: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHandlingAuthLink, setIsHandlingAuthLink] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authLinkError, setAuthLinkError] = useState<string | null>(null);
  const incomingUrl = Linking.useLinkingURL();

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', nextSession.user.id)
      .maybeSingle();

    if (error) {
      console.error('Unable to load profile', error);
      setProfile(null);
    } else {
      setProfile(data as Profile | null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(nextSession);
      setIsLoading(true);
      void loadProfile(nextSession).finally(() => setIsLoading(false));
    });

    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!incomingUrl) return;

    async function handleIncomingUrl() {
      setIsHandlingAuthLink(true);
      setAuthLinkError(null);

      try {
        const result = await createSessionFromAuthLink(incomingUrl as string);
        if (result?.isPasswordRecovery) setIsPasswordRecovery(true);
      } catch (error) {
        setAuthLinkError(error instanceof Error ? error.message : 'This sign-in link is invalid.');
      } finally {
        setIsHandlingAuthLink(false);
      }
    }

    void handleIncomingUrl();
  }, [incomingUrl]);

  async function refreshProfile() {
    setIsLoading(true);
    await loadProfile(session);
    setIsLoading(false);
  }

  function finishPasswordRecovery() {
    setIsPasswordRecovery(false);
  }

  return (
    <AuthContext.Provider
      value={{
        authLinkError,
        finishPasswordRecovery,
        isHandlingAuthLink,
        isLoading,
        isPasswordRecovery,
        profile,
        refreshProfile,
        session,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
