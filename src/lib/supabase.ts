import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are missing! Check your .env file.');
}

if (supabaseAnonKey?.startsWith('sb_secret_')) {
  console.warn('WARNING: You are using a secret key (sb_secret_) for the Anon key. Public auth will fail. Use the key starting with "sb_publishable_" or "eyJ".');
}

if (supabaseAnonKey?.startsWith('sb_publishable_')) {
  console.log('Using new Supabase publishable key format.');
}

// Custom storage adapter for Chrome Extension using chrome.storage.local
const chromeStorageAdapter = {
  getItem: async (key: string) => {
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  },
  setItem: async (key: string, value: string) => {
    await chrome.storage.local.set({ [key]: value })
  },
  removeItem: async (key: string) => {
    await chrome.storage.local.remove(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: chromeStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Recommended for Chrome Extensions
  },
})
