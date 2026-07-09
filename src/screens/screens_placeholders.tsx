// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDERS — À compléter dans les Sprints suivants
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';

function PlaceholderScreen({ emoji, title, sprint }: { emoji: string; title: string; sprint: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sprint}>Disponible au {sprint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  emoji:  { fontSize: 56, marginBottom: Spacing.md },
  title:  { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, textAlign: 'center' },
  sprint: { fontSize: Fonts.size.md, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});

// ── CLIENT ────────────────────────────────────────────────────────────────────

export function ClientHomeScreen() {
  const { user } = useAuth();
  return (
    <View style={[styles.container, { gap: Spacing.sm }]}>
      <Text style={{ fontSize: 52 }}>🚗</Text>
      <Text style={styles.title}>Bonjour, {user?.first_name} !</Text>
      <Text style={styles.sprint}>Réservez votre prochain trajet dès le Sprint 3</Text>
    </View>
  );
}

export function MyReservationsScreen() {
  return <PlaceholderScreen emoji="📋" title="Mes réservations" sprint="Sprint 3" />;
}

export function CreateReservationScreen() {
  return <PlaceholderScreen emoji="➕" title="Nouvelle réservation" sprint="Sprint 3" />;
}

export function ReservationDetailsScreen() {
  return <PlaceholderScreen emoji="🗂️" title="Détails de la réservation" sprint="Sprint 3" />;
}

export function ClientProfileScreen() {
  return <PlaceholderScreen emoji="👤" title="Mon profil client" sprint="Sprint 2" />;
}

// ── DRIVER ────────────────────────────────────────────────────────────────────

export function DriverHomeScreen() {
  const { user } = useAuth();
  return (
    <View style={[styles.container, { gap: Spacing.sm }]}>
      <Text style={{ fontSize: 52 }}>🛣️</Text>
      <Text style={styles.title}>Bonjour, {user?.first_name} !</Text>
      <Text style={styles.sprint}>Vos courses attribuées apparaîtront ici dès le Sprint 4</Text>
    </View>
  );
}

export function DriverTripsScreen() {
  return <PlaceholderScreen emoji="📊" title="Historique des courses" sprint="Sprint 6" />;
}

export function DriverDocumentsScreen() {
  return <PlaceholderScreen emoji="📄" title="Mes documents" sprint="Sprint 2" />;
}

export function DriverAvailabilityScreen() {
  return <PlaceholderScreen emoji="🟢" title="Disponibilité" sprint="Sprint 4" />;
}

export function DriverProfileScreen() {
  return <PlaceholderScreen emoji="👤" title="Mon profil chauffeur" sprint="Sprint 2" />;
}

// ── SHARED ────────────────────────────────────────────────────────────────────

export function LoadingScreen() {
  return <PlaceholderScreen emoji="⏳" title="Chargement..." sprint="" />;
}

export function NotFoundScreen() {
  return <PlaceholderScreen emoji="🔍" title="Page introuvable" sprint="" />;
}

export function SplashScreen() {
  return (
    <View style={[styles.container, { backgroundColor: Colors.bordeaux }]}>
      <Text style={{ fontSize: 72 }}>🚗</Text>
      <Text style={[styles.title, { color: Colors.white }]}>Easy VTC</Text>
    </View>
  );
}