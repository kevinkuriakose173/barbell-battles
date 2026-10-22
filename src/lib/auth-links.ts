import type { AuthChangeEvent } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const AUTH_CALLBACK_URL = 'barbellbattles://auth/callback';
export const PASSWORD_RECOVERY_URL = 'barbellbattles://auth/reset-password';

export type AuthLinkResult = {
  event: AuthChangeEvent | 'AUTH_CALLBACK';
  isPasswordRecovery: boolean;
};

function getAuthLinkParams(url: string) {
  const queryStart = url.indexOf('?');
  const hashStart = url.indexOf('#');
  const params = new URLSearchParams();

  for (const start of [queryStart, hashStart]) {
    if (start === -1) continue;

    const end = start === queryStart && hashStart > queryStart ? hashStart : undefined;
    const segment = url.slice(start + 1, end);
    const segmentParams = new URLSearchParams(segment);

    segmentParams.forEach((value, key) => params.set(key, value));
  }

  return params;
}

export async function createSessionFromAuthLink(url: string): Promise<AuthLinkResult | null> {
  const params = getAuthLinkParams(url);
  const errorDescription = params.get('error_description');

  if (errorDescription) {
    throw new Error(errorDescription.replaceAll('+', ' '));
  }

  const code = params.get('code');
  const type = params.get('type');
  const isPasswordRecovery = type === 'recovery' || url.includes('/auth/reset-password');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    return {
      event: isPasswordRecovery ? 'PASSWORD_RECOVERY' : 'AUTH_CALLBACK',
      isPasswordRecovery,
    };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;

  return {
    event: isPasswordRecovery ? 'PASSWORD_RECOVERY' : 'AUTH_CALLBACK',
    isPasswordRecovery,
  };
}
