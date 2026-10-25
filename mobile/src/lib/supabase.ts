import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// Placeholder values keep createClient from throwing before .env.local exists;
// the root layout shows setup instructions instead of using the client.
export const supabase = createClient(supabaseUrl || 'https://not-configured.supabase.co', supabasePublishableKey || 'missing', {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Run the token refresh loop only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
