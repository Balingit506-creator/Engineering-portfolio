import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View,
  type TextInputProps,
} from 'react-native';

import { colors, fonts } from '@/lib/theme';

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        {...input}
        style={[styles.input, input.multiline && styles.multiline]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Toggle({ label, hint, value, onValueChange }: {
  label: string; hint?: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.lineStrong }}
        thumbColor={colors.text}
      />
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || inactive) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.text} />
      ) : (
        <Text style={[styles.buttonText, variant === 'primary' && { color: colors.bg }, variant === 'danger' && { color: colors.danger }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  label: {
    ...fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSoft,
    marginBottom: 8,
  },
  field: { marginBottom: 20 },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.lineStrong,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  hint: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  toggleLabel: { color: colors.text, fontSize: 16 },
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colors.text, borderColor: colors.text },
  buttonDanger: { borderColor: colors.danger },
  buttonText: {
    ...fonts.mono,
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text,
  },
});
