import { createClient, Session } from '@supabase/supabase-js';
import { Database } from './database.types';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env as any) || {};

const rawSupabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local');
}

// In local browser development, route through Vite proxy to bypass ISP DNS hijacking
const isLocalBrowser =
  Boolean(env.DEV) &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const supabaseUrl = isLocalBrowser
  ? `${window.location.origin}/supabase-proxy`
  : rawSupabaseUrl;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type UserRole = 'admin' | 'team' | 'none';

export type ResolveRoleResult =
  | { role: UserRole; verified: true; error?: never }
  | { role: null; verified: false; error: Error };

const GUEST_STORAGE_KEY = 'startupoly_guest_auth';

async function ensureDeviceGuestSession(): Promise<Session> {
  let storedCreds: { email: string; pass: string } | null = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(GUEST_STORAGE_KEY) : null;
    if (raw) storedCreds = JSON.parse(raw);
  } catch {
    // Ignore parse error
  }

  if (storedCreds?.email && storedCreds?.pass) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: storedCreds.email,
        password: storedCreds.pass,
      });
      if (!error && data.session) {
        return data.session;
      }
    } catch {
      // Continue to recreate if sign-in fails
    }
  }

  const deviceId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  const email = `startupoly.player.${deviceId}@gmail.com`;
  const pass = `GuestPass_${deviceId}!2026`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
  });

  if (error) {
    const signInRes = await supabase.auth.signInWithPassword({ email, password: pass });
    if (signInRes.data?.session) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ email, pass }));
      }
      return signInRes.data.session;
    }
    throw error;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ email, pass }));
  }

  if (data.session) {
    return data.session;
  }

  const signInRes = await supabase.auth.signInWithPassword({ email, password: pass });
  if (signInRes.data?.session) {
    return signInRes.data.session;
  }
  throw new Error('Could not establish player session.');
}

/**
 * Ensures an anonymous or guest session exists for player phones.
 * Automatically falls back to device guest credentials if anonymous
 * provider is disabled in Supabase project auth settings.
 */
export async function ensureAnonymousSession(): Promise<Session> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return session;
  }

  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      if (
        (error as any).code === 'anonymous_provider_disabled' ||
        (error as any).status === 422 ||
        error.message?.includes('disabled')
      ) {
        try {
          return await ensureDeviceGuestSession();
        } catch {
          const authError: any = new Error(
            'Anonymous sign-ins are disabled in Supabase. Enable "Anonymous sign-ins" in your Supabase Dashboard under Authentication -> Providers.'
          );
          authError.code = 'ANONYMOUS_AUTH_DISABLED';
          throw authError;
        }
      }
      throw error;
    }
    return data.session!;
  } catch (err: any) {
    if (
      err?.code === 'anonymous_provider_disabled' ||
      err?.status === 422 ||
      err?.message?.includes('disabled')
    ) {
      try {
        return await ensureDeviceGuestSession();
      } catch {
        const authError: any = new Error(
          'Anonymous sign-ins are disabled in Supabase. Enable "Anonymous sign-ins" in your Supabase Dashboard under Authentication -> Providers.'
        );
        authError.code = 'ANONYMOUS_AUTH_DISABLED';
        throw authError;
      }
    }
    throw err;
  }
}

/**
 * Resolves the role for a given session by checking PostgreSQL permissions.
 * - No session -> { role: 'none', verified: true }
 * - Anonymous session -> { role: 'team', verified: true } (without invoking is_admin RPC)
 * - Authenticated session -> queries is_admin() RPC:
 *     - data === true -> { role: 'admin', verified: true }
 *     - data === false -> { role: 'team', verified: true }
 *     - error/network failure -> { role: null, verified: false, error }
 */
export async function resolveRole(session: Session | null): Promise<ResolveRoleResult> {
  if (!session || !session.user) {
    return { role: 'none', verified: true };
  }

  // Anonymous users or device guest accounts are always team players; skip RPC
  if (session.user.is_anonymous || session.user.email?.startsWith('startupoly.player.')) {
    return { role: 'team', verified: true };
  }

  try {
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    if (error) {
      return { role: null, verified: false, error: new Error(error.message) };
    }
    return { role: isAdmin ? 'admin' : 'team', verified: true };
  } catch (err) {
    return {
      role: null,
      verified: false,
      error: err instanceof Error ? err : new Error('Unknown error checking role'),
    };
  }
}
