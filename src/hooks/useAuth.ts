import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const redirectUri = chrome.identity.getRedirectURL();
      
      console.log('--- LOGIN CONFIGURATION ---');
      console.table({
        'Redirect URI': redirectUri,
        'Supabase URL': import.meta.env.VITE_SUPABASE_URL || 'MISSING',
        'Anon Key Format': (import.meta.env.VITE_SUPABASE_ANON_KEY || '').substring(0, 10) + '...',
        'Valid JWT?': (import.meta.env.VITE_SUPABASE_ANON_KEY || '').startsWith('eyJ')
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectUri,
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase')

      console.log('--- AUTH DEBUG INFO ---');
      console.log('Redirect URI:', redirectUri);
      console.log('Auth URL:', data.url);
      console.log('-----------------------');
      console.log('TIP: If the window fails to open, copy the Auth URL above and paste it into a regular browser tab to see the specific error from Google/Supabase.');

      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: data.url,
        interactive: true,
      })

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (!redirectUrl) {
        throw new Error('User cancelled or web auth flow failed');
      }

      console.log('Redirection received:', redirectUrl);
      const url = new URL(redirectUrl)
      
      // For PKCE flow, we look for 'code' in query params
      const code = url.searchParams.get('code');
      
      if (code) {
        console.log('Exchanging code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        console.log('Login successful!');
      } else {
        // Fallback for implicit flow if PKCE fails for some reason
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else {
          throw new Error('No auth code or tokens found in redirect URL');
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error)
      alert('Login Error: ' + (error.message || 'Unknown error'));
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,
    user,
    loading,
    signInWithGoogle,
    signOut,
  }
}
