// AppText.tsx
import React from 'react';
import { Text, type TextStyle, type StyleProp, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../theme/colors';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

interface AppTextProps {
  variant?: Variant;
  color?:   string;
  style?:   StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function AppText({ variant = 'body', color, style, children }: AppTextProps) {
  return (
    <Text style={[styles[variant], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1:      { fontSize: Fonts.size.xxxl, fontWeight: '800', color: Colors.bordeaux },
  h2:      { fontSize: Fonts.size.xxl,  fontWeight: '700', color: Colors.bordeaux },
  h3:      { fontSize: Fonts.size.xl,   fontWeight: '700', color: Colors.textPrimary },
  body:    { fontSize: Fonts.size.md,   fontWeight: '400', color: Colors.textPrimary, lineHeight: 22 },
  caption: { fontSize: Fonts.size.sm,   fontWeight: '400', color: Colors.textSecondary },
  label:   { fontSize: Fonts.size.sm,   fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
});