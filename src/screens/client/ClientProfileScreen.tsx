import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme/colors';

function PlaceholderScreen({ emoji, title, sprint }: { emoji: string; title: string; sprint: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sprint}>Disponible au {sprint}</Text>
    </View>
  );
}

export default function ClientProfileScreen() {
  return <PlaceholderScreen emoji="👤" title="Mon profil client" sprint="Sprint 2" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
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
