import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export default function AdminHeader({ title, subtitle, onBack, showBack = true }: Props) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.bordeauxLight} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  backSpacer: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  title: { color: Colors.bordeauxLight, fontSize: 18, fontWeight: '600', marginHorizontal: Spacing.md },
  subtitle: { color: Colors.bordeauxLight, fontSize: 12, marginTop: 2 },
  rightSpacer: { width: 40 },
});
