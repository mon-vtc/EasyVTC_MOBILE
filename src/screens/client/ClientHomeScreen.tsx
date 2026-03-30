import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

export default function ClientHomeScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 52 }}>🚗</Text>
      <Text style={styles.title}>Bonjour, {user?.first_name} !</Text>
      <Text style={styles.sprint}>Réservez votre prochain trajet dès le Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: '800',
    color: Colors.bordeaux,
    textAlign: 'center',
  },
  sprint: {
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
