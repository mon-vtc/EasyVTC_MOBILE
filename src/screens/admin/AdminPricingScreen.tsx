// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminPricingScreen
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useNavigation }       from '@react-navigation/native';
import { usePricing }          from '../../hooks/usePricing';
import type { PricingCountry, PricingFormValues, PricingExample } from '../../types/pricing.types';
import { Logo }                from '../../constants/logo';
import { useAlert } from '../../hooks/useAlert';
import { useToast } from '../../hooks/useToast';
import { AppIcon }             from '../../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Header bordeaux avec crayon / annulation ──────────────────────────────────
function PricingHeader({
  isEditing,
  onToggleEdit,
}: {
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  const navigation = useNavigation();
  return (
    <View style={hdr.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={hdr.back}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>

      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
      </View>

      {/* Crayon ou annulation */}
      <TouchableOpacity
        onPress={onToggleEdit}
        style={hdr.action}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon
          name={isEditing ? 'close-outline' : 'create-outline'}
          size={24}
          color={Colors.white}
        />
      </TouchableOpacity>
    </View>
  );
}

// ── Sélecteur de pays ────────────────────────────────────────────────────────
function CountrySelector({
  active,
  onChange,
  disabled,
}: {
  active: PricingCountry;
  onChange: (c: PricingCountry) => void;
  disabled?: boolean;
}) {
  const countries: { key: PricingCountry; label: string }[] = [
    { key: 'france',  label: 'France' },
    // { key: 'senegal', label: 'Sénégal' },
  ];
  return (
    <View style={cs.row}>
      {countries.map(c => (
        <TouchableOpacity
          key={c.key}
          style={[cs.tab, active === c.key && cs.tabActive]}
          onPress={() => !disabled && onChange(c.key)}
          activeOpacity={disabled ? 1 : 0.8}
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
  editable,
  keyboardType = 'decimal-pad',
  placeholder = '0.00',
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
  editable: boolean;
  keyboardType?: 'decimal-pad' | 'default' | 'numbers-and-punctuation';
  placeholder?: string;
  hint?: string;
}) {
  return (
    <View style={pf.container}>
      <Text style={pf.label}>{label}</Text>
      <View style={[pf.inputRow, !editable && pf.inputRowDisabled]}>
        <TextInput
          style={[pf.input, !editable && pf.inputDisabled]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          editable={editable}
        />
        <View style={pf.unitBox}>
          <Text style={pf.unit}>{unit}</Text>
        </View>
      </View>
      {hint && <Text style={pf.hint}>{hint}</Text>}
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

  const { showToast } = useToast();
  const { showAlert } = useAlert();
  // ── Mode édition ─────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);

  // ── État local du formulaire ─────────────────────────────────────────────
  const [form, setForm] = useState<PricingFormValues>({
    base_price:            '',
    price_per_km:          '',
    price_per_min:         '',
    minimum_price:         '',
    tva_rate:              '',
    airport_supplement:    '',
    night_supplement_rate: '',
    night_start:           '',
    night_end:             '',
  });

  // Snapshot pour annulation
  const [savedForm, setSavedForm] = useState<PricingFormValues>(form);

  // ── Hydratation depuis la config chargée ─────────────────────────────────
  useEffect(() => {
    if (config) {
      const initial = getInitialFormValues();
      setForm(initial);
      setSavedForm(initial);
    }
  }, [config]);

  // ── Exemple de calcul dynamique ──────────────────────────────────────────
  const example: PricingExample = computeExample(form);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const set = useCallback((key: keyof PricingFormValues) => (v: string) =>
    setForm(prev => ({ ...prev, [key]: v })),
  []);

  const handleCountryChange = (country: PricingCountry) => {
    setCountry(country);
    setIsEditing(false);
    // form sera hydraté par le useEffect quand config change
  };

  // Bascule crayon / annulation
  const handleToggleEdit = () => {
    if (isEditing) {
      // Annulation : on restaure le snapshot
      showAlert({
        title: 'Annuler les modifications',
        message: 'Les modifications non enregistrées seront perdues.',
        buttons: [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Annuler',
            style: 'destructive',
            onPress: () => {
              setForm(savedForm);
              setIsEditing(false);
            },
          },
        ]
      });
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await saveConfig(form);
      setSavedForm(form);
      setIsEditing(false);
      showToast({ title: 'Enregistré', message: 'La configuration tarifaire a été mise à jour.', type: 'success' });
    } catch {
      // L'erreur est déjà dans le store
    }
  };

  // ── Erreur globale ────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      showToast({ title: 'Erreur', message: error, type: 'error', onPress: clearError });
    }
  }, [error]);

  // ── Chargement ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
        <PricingHeader isEditing={false} onToggleEdit={() => {}} />
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
      <PricingHeader isEditing={isEditing} onToggleEdit={handleToggleEdit} />

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
          {/* ── Bannière mode lecture ────────────────────────────────────── */}
          {!isEditing && (
            <View style={styles.readonlyBanner}>
              <AppIcon name="lock-closed-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.readonlyText}>
                Appuyez sur le crayon pour modifier la grille tarifaire
              </Text>
            </View>
          )}

          {/* ── Sélecteur de pays ────────────────────────────────────────── */}
          <CountrySelector
            active={activeCountry}
            onChange={handleCountryChange}
            disabled={isEditing}
          />

          {/* ── Tarifs de base ───────────────────────────────────────────── */}
          <Section title="Tarifs de base">
            <PricingField
              label="Prix de prise en charge"
              value={form.base_price}
              unit={currencySymbol}
              onChange={set('base_price')}
              editable={isEditing}
            />
            <PricingField
              label="Prix par kilomètre"
              value={form.price_per_km}
              unit={currencySymbol}
              onChange={set('price_per_km')}
              editable={isEditing}
            />
            <PricingField
              label="Prix par minute"
              value={form.price_per_min}
              unit={currencySymbol}
              onChange={set('price_per_min')}
              editable={isEditing}
            />
            <PricingField
              label="Prix minimum de course"
              value={form.minimum_price}
              unit={currencySymbol}
              onChange={set('minimum_price')}
              editable={isEditing}
            />
          </Section>

          {/* ── TVA ──────────────────────────────────────────────────────── */}
          <Section
            title="Fiscalité"
            subtitle="Taux de TVA appliqué sur le montant HT de la course (0 = exonéré)"
          >
            <PricingField
              label="Taux de TVA"
              value={form.tva_rate}
              unit="%"
              onChange={set('tva_rate')}
              editable={isEditing}
              hint="Ex : 10 pour 10 %"
            />
          </Section>

          {/* ── Suppléments ──────────────────────────────────────────────── */}
          <Section
            title="Suppléments"
            subtitle="Montants et plages appliqués automatiquement selon le contexte"
          >
            <PricingField
              label="Supplément aéroport"
              value={form.airport_supplement}
              unit={currencySymbol}
              onChange={set('airport_supplement')}
              editable={isEditing}
              hint="Montant fixe HT ajouté aux courses aéroport"
            />
            <PricingField
              label="Supplément nocturne"
              value={form.night_supplement_rate}
              unit="%"
              onChange={set('night_supplement_rate')}
              editable={isEditing}
              hint="Ex : 15 pour +15 % — 0 pour désactiver"
            />
            <PricingField
              label="Début plage nocturne"
              value={form.night_start}
              unit="heure"
              onChange={set('night_start')}
              editable={isEditing}
              keyboardType="numbers-and-punctuation"
              placeholder="HH:MM"
              hint="Format 24h — ex : 21:00"
            />
            <PricingField
              label="Fin plage nocturne"
              value={form.night_end}
              unit="heure"
              onChange={set('night_end')}
              editable={isEditing}
              keyboardType="numbers-and-punctuation"
              placeholder="HH:MM"
              hint="Format 24h — ex : 06:00"
            />
          </Section>

          {/* ── Exemple de calcul ─────────────────────────────────────────── */}
          <LinearGradient
            colors={[Colors.bordeaux, Colors.bordeauxLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.flex, styles.exampleCard]}
          >
            <Text style={styles.exampleTitle}>Exemple de calcul</Text>

            <ExampleRow
              label={`\t\tPrise en charge`}
              value={fmt(parseFloat(form.base_price || '0'), currencySymbol)}
            />
            <ExampleRow
              label={`\t\t${example.distance_km} km × ${form.price_per_km || '0'} ${currencySymbol}`}
              value={fmt(example.km_cost, currencySymbol)}
            />
            <ExampleRow
              label={`\t\t${example.duration_min} min × ${form.price_per_min || '0'} ${currencySymbol}`}
              value={fmt(example.min_cost, currencySymbol)}
            />

            <ExampleRow
              label="Total"
              value={fmt(example.subtotal_ht, currencySymbol)}
              bold
              separator
            />

            {/* {activeCountry === 'france' && (
              <ExampleRow
                label={`\t\tTVA (20%)`}
                value={`+ ${fmt(example.vat_20, currencySymbol)}`}
              />
            )}
            <ExampleRow
              label="Total TTC"
              value={fmt(example.total_ttc, currencySymbol)}
              bold
            /> */}

            {/* <ExampleRow
              label={`Commission EasyVTC`}
              bold
              value=""
              separator
            /> */}
            {/* <ExampleRow
              label={`\t\tCommission (${form.commission_rate || 0}% du HT)`}
              value={`+ ${fmt(example.commission_ht, currencySymbol)}`}
            />
            <ExampleRow
              label={`\t\tTVA commission (${form.commission_vat_rate || 0}%)`}
              value={`+ ${fmt(example.commission_vat, currencySymbol)}`}
            /> */}
            {/* <ExampleRow
              label="Total commission TTC"
              value={`+ ${fmt(example.commission_ttc, currencySymbol)}`}
              bold
            /> */}

            <ExampleRow
              // label={`\n\t\t\t\t\t\t\t\tNet chauffeur (après commission)\n`}
              label={`\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tNet chauffeur \n`}
              value=""
              bold
              separator
            />
            <ExampleRow
              // label={`\tMontant versé au chauffeur (TTC – commission TTC)\n(${fmt(example.total_ttc, currencySymbol)} – ${fmt(example.commission_ttc, currencySymbol)})`}
              label={`\tMontant versé au chauffeur`}
              value={fmt(example.net_driver, currencySymbol)}
              bold
              color={Colors.white}
            />
          </LinearGradient>

          {/* ── Bouton sauvegarde — visible uniquement en mode édition ─────── */}
          {isEditing && (
            <LinearGradient
              colors={[Colors.bordeaux, Colors.bordeauxLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flex}
            >
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
            </LinearGradient>
          )}

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
  flex:   { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg },
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
  readonlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface ?? '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.bordeaux,
  },
  readonlyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  exampleCard: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  exampleTitle: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
  },
  saveBtn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
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
    backgroundColor: Colors.bordeauxLight,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semibold, fontWeight: '600',
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
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white ?? '#fff',
  },
  inputRowDisabled: {
    backgroundColor: Colors.surface ?? '#F9FAFB',
    borderColor: Colors.border ?? '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    color: Colors.textSecondary,
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
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 3,
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
  action: {
    width: 40,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
});