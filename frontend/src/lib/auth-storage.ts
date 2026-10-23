/** Persists whether auth tokens live in localStorage (remember) or sessionStorage (default). */
export const REMEMBER_AUTH_KEY = 'enem-prep-remember-auth'

export function readRememberAuth(): boolean {
  try {
    return localStorage.getItem(REMEMBER_AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

export function setRememberAuth(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_AUTH_KEY, String(remember))
  } catch {
    /* ignore quota / private mode */
  }
}

function activeStorage(): Storage {
  return readRememberAuth() ? localStorage : sessionStorage
}

function inactiveStorage(): Storage {
  return readRememberAuth() ? sessionStorage : localStorage
}

function clearSupabaseAuthKeys(storage: Storage): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith('sb-')) keysToRemove.push(key)
  }
  keysToRemove.forEach((key) => storage.removeItem(key))
}

/** Supabase auth storage: session by default; localStorage when "remember me" is enabled. */
export const supabaseAuthStorage: Storage = {
  getItem(key: string): string | null {
    if (readRememberAuth()) {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    }
    return sessionStorage.getItem(key)
  },

  setItem(key: string, value: string): void {
    activeStorage().setItem(key, value)
    inactiveStorage().removeItem(key)
  },

  removeItem(key: string): void {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },

  get length(): number {
    return activeStorage().length
  },

  clear(): void {
    clearSupabaseAuthKeys(localStorage)
    clearSupabaseAuthKeys(sessionStorage)
  },

  key(index: number): string | null {
    return activeStorage().key(index)
  },
}
