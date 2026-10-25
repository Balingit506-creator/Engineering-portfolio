import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    // On success the root layout sees the new session and opens the project list.
    if (authError) setError(authError.message);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Text style={styles.eyebrow}>JABZ · Portfolio admin</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.sub}>Add and edit the projects shown on your website.</Text>

        <View style={{ marginTop: 32 }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={signIn}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign in" onPress={signIn} loading={loading} disabled={!email || !password} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { ...fonts.mono, color: colors.accent, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 40, marginTop: 12 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 8 },
  error: { color: colors.danger, marginBottom: 16 },
});
