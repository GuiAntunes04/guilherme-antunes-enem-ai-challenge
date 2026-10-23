import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { translateAuthError } from '../lib/auth-errors'
import { fetchMe, type Profile } from '../lib/api'
import { setRememberAuth } from '../lib/auth-storage'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ error: string | null }>
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  recoveringPassword: boolean
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveringPassword, setRecoveringPassword] = useState(false)

  const loadProfile = useCallback(async (accessToken: string) => {
    try {
      const data = await fetchMe(accessToken)
      setProfile(data.profile)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function initSession() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(data.session)
      setUser(data.session?.user ?? null)

      if (data.session?.access_token) {
        await loadProfile(data.session.access_token)
      }

      setLoading(false)
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveringPassword(true)
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.access_token) {
        if (event !== 'TOKEN_REFRESHED') {
          await loadProfile(nextSession.access_token)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string, rememberMe = false) => {
    setRememberAuth(rememberMe)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: translateAuthError(error?.message) }
  }, [])

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setRememberAuth(false)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      return {
        error: translateAuthError(error?.message),
        needsEmailConfirmation: Boolean(data.user && !data.session),
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setRecoveringPassword(false)
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: translateAuthError(error?.message) }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) {
      setRecoveringPassword(false)
    }
    return { error: translateAuthError(error?.message) }
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      recoveringPassword,
      requestPasswordReset,
      updatePassword,
    }),
    [
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      recoveringPassword,
      requestPasswordReset,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
