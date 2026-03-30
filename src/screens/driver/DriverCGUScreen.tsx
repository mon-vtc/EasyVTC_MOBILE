import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, Alert, Modal,
} from 'react-native';
import { zodResolver }       from '@hookform/resolvers/zod';
import { z }                 from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { Ionicons }          from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { FormField }         from '../../components/forms/FormField';
import { useAuth }           from '../../hooks/useAuth';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { DriverDrawerParamList } from '../../types/auth.types';
import { Logo } from '../../constants/logo';

type Props = DrawerScreenProps<DriverDrawerParamList, 'DriverProfile'>;

// ── Screen ─────────────────────────────────────────────────────
export default function DriverCGUScreen({ navigation }: Props) {
  

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        </ScrollView>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxl },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux },
  avatarEditBtn:  { marginTop: Spacing.sm },
  avatarEditText: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600' },

  formSection:          { paddingHorizontal: Spacing.lg },
  formSectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
  },

  section:    { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionTitle: {
    fontSize:     Fonts.size.md,
    fontWeight:   '800',
    color:        Colors.bordeaux,
    marginBottom: Spacing.sm,
  },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
  },

  prefRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  prefText:     { flex: 1, paddingRight: Spacing.md },
  prefLabel:    { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  prefSub:      { fontSize: Fonts.size.xs, color: Colors.textCallToAction, marginTop: 2 },
  dividerLight: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },

  actionsSection: {
    marginTop:         Spacing.md,
    marginHorizontal:  Spacing.lg,
    backgroundColor:   Colors.surface,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
  },
  actionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  actionLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionLabel: { fontSize: Fonts.size.md, color: Colors.textPrimary, fontWeight: '500' },
  divider:     { height: 1, backgroundColor: Colors.border },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    width:           '100%',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.15,
    shadowRadius:    16,
    elevation:       10,
  },
  title:       { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  errorBanner: {
    backgroundColor: Colors.errorLight, borderRadius: Radius.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.error,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText:      { color: Colors.error, fontSize: Fonts.size.sm },
  actions:        { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn:            { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  btnCancel:      { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCancelText:  { color: Colors.textSecondary, fontWeight: '600' },
  btnConfirm:     { backgroundColor: Colors.bordeaux },
  btnConfirmText: { color: Colors.white, fontWeight: '700' },
});