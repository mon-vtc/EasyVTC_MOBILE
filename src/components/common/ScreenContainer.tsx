// ScreenContainer.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme/colors';

interface ScreenContainerProps {
  children:    React.ReactNode;
  scrollable?: boolean;
  style?:      ViewStyle;
  padded?:     boolean;
}

export function ScreenContainer({ children, scrollable = false, style, padded = true }: ScreenContainerProps) {
  const content = (
    <View style={[styles.inner, padded && styles.padded, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {scrollable
        ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView>
        : content
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  inner:  { flex: 1 },
  padded: { padding: Spacing.md },
});