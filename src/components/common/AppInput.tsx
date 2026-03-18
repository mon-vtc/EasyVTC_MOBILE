import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, type TextInputProps,
} from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

interface AppInputProps extends TextInputProps {
  label?:      string;
  error?:      string;
  showToggle?: boolean;
}

export function AppInput({ label, error, showToggle = false, secureTextEntry, style, ...props }: AppInputProps) {
  const [focused,   setFocused]   = useState(false);
  const [visible,   setVisible]   = useState(false);
  const isPassword = secureTextEntry || showToggle;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, focused && styles.focused, !!error && styles.errored]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !visible}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible(!visible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { marginBottom: Spacing.md },
  label:     { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 0.3 },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    minHeight: 52, paddingHorizontal: Spacing.md,
  },
  focused:    { borderColor: Colors.bordeaux, shadowColor: Colors.bordeaux, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  errored:    { borderColor: Colors.error },
  input:      { flex: 1, fontSize: Fonts.size.md, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  toggle:     { padding: Spacing.xs, marginLeft: Spacing.xs },
  toggleText: { fontSize: 16 },
  error:      { color: Colors.error, fontSize: Fonts.size.xs, marginTop: Spacing.xs, marginLeft: Spacing.xs },
});