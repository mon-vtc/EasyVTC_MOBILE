// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminPricingScreen
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useNavigation }       from '@react-navigation/native';
import { usePricing }          from '../../hooks/usePricing';
import type { PricingCountry, PricingFormValues, PricingExample } from '../../types/pricing.types';
import { Colors }              from '../../theme/colors';
import { Logo }                from '../../constants/logo';
import { AppIcon }             from '../../components/common/AppIcon';

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Header bordeaux (maquette) ────────────────────────────────────────────────
function PricingHeader() {
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

// ── Sélecteur de pays ────────────────────────────────────────────────────────
function CountrySelector({
  active,
  onChange,
}: {
  active: PricingCountry;
  onChange: (c: PricingCountry) => void;
}) {
  const countries: { key: PricingCountry; label: string }[] = [
    { key: 'france',  label: 'France' },
    { key: 'senegal', label: 'Sénégal' },
  ];
  return (
    <View style={cs.row}>
      {countries.map(c => (
        <TouchableOpacity
          key={c.key}
          style={[cs.tab, active === c.key && cs.tabActive]}
          onPress={() => onChange(c.key)}
          activeOpacity={0.8}
        >
          <Text style={[cs.tabText, active === c.key && cs.tabTextActive]}>
            {c.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Champ de saisie tarifaire ─────────────────────────────────────────────────
function PricingField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={pf.container}>
      <Text style={pf.label}>{label}</Text>
      <View style={pf.inputRow}>
        <TextInput
          style={pf.input}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={Colors.textSecondary}
        />
        <View style={pf.unitBox}>
          <Text style={pf.unit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Bloc section ──────────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sec.container}>
      <Text style={sec.title}>{title}</Text>
      {subtitle && <Text style={sec.subtitle}>{subtitle}</Text>}
      <View style={sec.body}>{children}</View>
    </View>
  );
}

// ── Ligne d'exemple de calcul ─────────────────────────────────────────────────
function ExampleRow({
  label,
  value,
  bold,
  separator,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  separator?: boolean;
  color?: string;
}) {
  return (
    <>
      {separator && <View style={ex.separator} />}
      <View style={ex.row}>
        <Text style={[ex.label, bold && ex.bold, color ? { color } : undefined]}>
          {label}
        </Text>
        <Text style={[ex.value, bold && ex.bold, color ? { color } : undefined]}>
          {value}
        </Text>
      </View>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function fmt(n: number, symbol: string): string {
  if (symbol === 'F CFA') return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
  return `${n.toFixed(2)} ${symbol}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminPricingScreen() {
  const {
    config,
    activeCountry,
    isLoading,
    isSaving,
    error,
    clearError,
    currencySymbol,
    setCountry,
    saveConfig,
    getInitialFormValues,
    computeExample,
  } = usePricing();

  // ── État local du formulaire ─────────────────────────────────────────────
  const [form, setForm] = useState<PricingFormValues>({
    base_price:          '',
    price_per_km:        '',
    price_per_min:       '',
    minimum_price:       '',
    commission_rate:     '',
    commission_vat_rate: '',
    airport_fee:         '',
    night_rate:          '',
  });

  // ── Hydratation depuis la config chargée ─────────────────────────────────
  useEffect(() => {
    if (config) setForm(getInitialFormValues());
  }, [config]);

  // ── Exemple de calcul dynamique ──────────────────────────────────────────
  const example: PricingExample = computeExample(form);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const set = useCallback((key: keyof PricingFormValues) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: v })),
  []);

  const handleCountryChange = (country: PricingCountry) => {
    setCountry(country);
    // form sera hydraté par le useEffect quand config change
  };

  const handleSave = async () => {
    try {
      await saveConfig(form);
      Alert.alert('Enregistré', 'La configuration tarifaire a été mise à jour.');
    } catch {
      // L'erreur est déjà dans le store
    }
  };

  // ── Erreur globale ────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  // ── Chargement ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
        <PricingHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>Chargement des tarifs…</Text>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
      <PricingHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Sélecteur de pays ────────────────────────────────────────── */}
        <CountrySelector active={activeCountry} onChange={handleCountryChange} />

        {/* ── Tarifs de base ───────────────────────────────────────────── */}
        <Section title="Tarifs de base">
          <PricingField
            label="Prix de prise en charge"
            value={form.base_price}
            unit={currencySymbol}
            onChange={set('base_price')}
          />
          <PricingField
            label="Prix par kilomètre"
            value={form.price_per_km}
            unit={currencySymbol}
            onChange={set('price_per_km')}
          />
          <PricingField
            label="Prix par minute"
            value={form.price_per_min}
            unit={currencySymbol}
            onChange={set('price_per_min')}
          />
          <PricingField
            label="Prix minimum de course"
            value={form.minimum_price}
            unit={currencySymbol}
            onChange={set('minimum_price')}
          />
        </Section>

        {/* ── Commissions ──────────────────────────────────────────────── */}
        <Section
          title="Commissions EasyVTC"
          subtitle="Montant facturé au chauffeur pour le service plateforme"
        >
          <PricingField
            label="Taux de commission"
            value={form.commission_rate}
            unit="%"
            onChange={set('commission_rate')}
          />
          <PricingField
            label="TVA sur commission"
            value={form.commission_vat_rate}
            unit="%"
            onChange={set('commission_vat_rate')}
          />
          <Text style={styles.hint}>Base de calcul : sur le montant HT de la course</Text>
        </Section>

        {/* ── Suppléments ──────────────────────────────────────────────── */}
        <Section title="Suppléments">
          <PricingField
            label="Supplément aéroport"
            value={form.airport_fee}
            unit={currencySymbol}
            onChange={set('airport_fee')}
          />
          <PricingField
            label="Supplément nocturne (19h-7h)"
            value={form.night_rate}
            unit="%"
            onChange={set('night_rate')}
          />
        </Section>

        {/* ── Exemple de calcul ─────────────────────────────────────────── */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Exemple de calcul</Text>

          <ExampleRow
            label={`Prise en charge`}
            value={fmt(parseFloat(form.base_price || '0'), currencySymbol)}
          />
          <ExampleRow
            label={`${example.distance_km} km × ${form.price_per_km || '0'} ${currencySymbol}`}
            value={fmt(example.km_cost, currencySymbol)}
          />
          <ExampleRow
            label={`${example.duration_min} min × ${form.price_per_min || '0'} ${currencySymbol}`}
            value={fmt(example.min_cost, currencySymbol)}
          />

          <ExampleRow
            label="Total"
            value={fmt(example.subtotal_ht, currencySymbol)}
            bold
            separator
          />
          {activeCountry === 'france' && (
            <ExampleRow
              label="TVA (20%)"
              value={`– ${fmt(example.vat_20, currencySymbol)}`}
            />
          )}
          <ExampleRow
            label="Total TTC"
            value={fmt(example.total_ttc, currencySymbol)}
            bold
          />

          <ExampleRow
            label={`Commission EasyVTC\nCommission (${form.commission_rate || 0}% du HT) — ${fmt(example.commission_ht, currencySymbol)}`}
            value=""
            separator
          />
          <ExampleRow
            label={`TVA commission (${form.commission_vat_rate || 0}%)`}
            value={`– ${fmt(example.commission_vat, currencySymbol)}`}
          />
          <ExampleRow
            label="Total commission TTC"
            value={`– ${fmt(example.commission_ttc, currencySymbol)}`}
            bold
          />

          <ExampleRow
            label="Net chauffeur (après commission)"
            value=""
            bold
            separator
          />
          <ExampleRow
            label={`Montant versé au chauffeur (TTC – commission TTC)\n(${fmt(example.total_ttc, currencySymbol)} – ${fmt(example.commission_ttc, currencySymbol)})`}
            value={fmt(example.net_driver, currencySymbol)}
            bold
            color={Colors.success ?? '#10B981'}
          />
        </View>

        {/* ── Bouton sauvegarde ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background ?? '#F5F5F5',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  exampleCard: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  exampleTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

// ── CountrySelector ───────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surface ?? '#fff',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.bordeaux,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
});

// ── PricingField ──────────────────────────────────────────────────────────────
const pf = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white ?? '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  unitBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: Colors.surface ?? '#F9FAFB',
    borderLeftWidth: 1,
    borderLeftColor: Colors.border ?? '#E5E7EB',
  },
  unit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

// ── Section ───────────────────────────────────────────────────────────────────
const sec = StyleSheet.create({
  container: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  body: {
    marginTop: 8,
  },
});

// ── ExampleRow ────────────────────────────────────────────────────────────────
const ex = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    paddingRight: 8,
  },
  value: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'right',
  },
  bold: {
    fontWeight: '700',
    fontSize: 13,
    color: Colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
});

// ── PricingHeader ─────────────────────────────────────────────────────────────
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