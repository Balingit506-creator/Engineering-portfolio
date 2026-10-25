import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isConfigured, supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <SetupNeeded />;
  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="index" options={{ title: 'Projects' }} />
          <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function SetupNeeded() {
  return (
    <View style={styles.center}>
      <StatusBar style="light" />
      <Text style={styles.title}>Connect Supabase</Text>
      <Text style={styles.body}>
        Copy mobile/.env.example to mobile/.env.local, fill in your Supabase URL and publishable key,
        then restart with “npx expo start --clear”.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: colors.text, fontSize: 24, marginBottom: 12 },
  body: { ...fonts.mono, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
