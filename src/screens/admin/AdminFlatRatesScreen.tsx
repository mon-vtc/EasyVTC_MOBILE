import React from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { useNavigation }       from '@react-navigation/native';
import { Logo }                from '../../constants/logo';
import { AppIcon }             from '../../components/common/AppIcon';

function PlaceholderScreen({ emoji, title, sprint }: { emoji: string; title: string; sprint: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sprint}>Disponible dans une future mise à jour</Text>
    </View>
  );
}
// ── Header bordeaux (maquette) ────────────────────────────────────────────────
function flatRatesHeader() {
  const navigation = useNavigation();
  return (
    <View style={hdr.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
      </View>
      {/* Espace droit symétrique pour centrer le logo */}
      <View style={hdr.placeholder} />
    </View>
  );
}

export default function AdminFlatRatesScreen() {
  return <PlaceholderScreen emoji="🗺️" title="Grille Forfaitaire" sprint="Sprint 4" />;
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

// ── Flat Tate  ─────────────────────────────────────────────────────────────
const hdr = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  back: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
});