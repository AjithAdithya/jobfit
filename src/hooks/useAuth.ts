import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => { subscription.unsubscribe() }
  }, [])

  const getRedirectUri = (): string => chrome.identity.getRedirectURL()

  const signInWithGoogle = async () => {
    setSigningIn(true)
    setAuthError(null)

    try {
      const redirectUri = getRedirectUri()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectUri,
          scopes: 'https://www.googleapis.com/auth/drive.file',
          queryParams: { access_type: 'online' },
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase')

      let redirectUrl: string | undefined
      try {
        redirectUrl = await chrome.identity.launchWebAuthFlow({
          url: data.url,
          interactive: true,
        })
      } catch (flowErr: any) {
        // User closed the window — not an error
        if (flowErr?.message?.includes('canceled') || flowErr?.message?.includes('cancelled')) {
          return
        }
        console.error('launchWebAuthFlow failed:', flowErr, 'redirectUri:', redirectUri)
        throw new Error('Sign-in window could not be opened. Please try again.')
      }

      if (chrome.runtime.lastError) {
        console.error('chrome.runtime.lastError:', chrome.runtime.lastError.message)
        throw new Error('Sign-in failed. Please try again.')
      }

      if (!redirectUrl) {
        console.error('launchWebAuthFlow returned no redirect URL. redirectUri:', redirectUri)
        throw new Error('Sign-in did not complete. Please try again.')
      }

      const url = new URL(redirectUrl)

      // PKCE flow: code in query params
      const code = url.searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError

        // Persist Drive token if present
        const { data: { session: newSession } } = await supabase.auth.getSession()
        if (newSession?.provider_token) {
          chrome.storage.local.set({
            google_drive_token: newSession.provider_token,
            google_drive_connected: true,
          })
        }
        return
      }

      // Implicit fallback: tokens in URL hash
      const params = new URLSearchParams(url.hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        return
      }

      console.error('Auth completed but no code or tokens in redirect URL. redirectUri:', redirectUri)
      throw new Error('Sign-in failed. Please try again.')
    } catch (error: any) {
      console.error('Google Sign-In Error:', error)
      setAuthError(error.message || 'Sign-in failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  const signOut = async () => {
    chrome.storage.local.remove(['google_drive_token', 'google_drive_connected'])
    await supabase.auth.signOut()
  }

  return {
    session,
    user,
    loading,
    signingIn,
    authError,
    clearAuthError: () => setAuthError(null),
    getRedirectUri,
    signInWithGoogle,
    signOut,
  }
}
