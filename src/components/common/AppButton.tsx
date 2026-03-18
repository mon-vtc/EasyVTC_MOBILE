import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, type ViewStyle, type TextStyle,
} from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

type Variant = 'primary' | 'outline' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label:      string;
  onPress:    () => void;
  loading?:   boolean;
  disabled?:  boolean;
  variant?:   Variant;
  size?:      Size;
  style?:     ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function AppButton({
  label, onPress, loading = false, disabled = false,
  variant = 'primary', size = 'md', style, textStyle, fullWidth = true,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.bordeaux} size="small" />
        : <Text style={[styles.label, styles[`label_${variant}`], textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:      { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },

  // Variants
  primary: {
    backgroundColor: Colors.bordeaux,
    shadowColor: Colors.bordeaux,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.bordeaux },
  ghost:   { backgroundColor: 'transparent' },

  // Sizes
  sm: { paddingVertical: Spacing.xs,     paddingHorizontal: Spacing.md,  minHeight: 40 },
  md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg,  minHeight: 52 },
  lg: { paddingVertical: Spacing.md,     paddingHorizontal: Spacing.xl,  minHeight: 56 },

  // Labels
  label:          { fontSize: Fonts.size.md, fontWeight: '700', letterSpacing: 0.3 },
  label_primary:  { color: Colors.white },
  label_outline:  { color: Colors.bordeaux },
  label_ghost:    { color: Colors.bordeaux },
});