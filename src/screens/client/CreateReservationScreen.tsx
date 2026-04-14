// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — BookingScreen (3 étapes)
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation }    from '@react-navigation/native';
import { useReservation }   from '../../hooks/useReservation';
import { AppIcon }          from '../../components/common/AppIcon';
import { Colors }           from '../../theme/colors';
import { Logo }             from '../../constants/logo';
import type { GeoPoint, VehicleTypeOption } from '../../types/reservation.types';

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLE ICONS MAP
// ══════════════════════════════════════════════════════════════════════════════
const VEHICLE_ICONS: Record<string, string> = {
  standard: 'car-outline',
  berline:  'car-sport-outline',
  van:      'bus-outline',
};

// ══════════════════════════════════════════════════════════════════════════════
// HEADER COMMUN
// ══════════════════════════════════════════════════════════════════════════════
function BookingHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={hdr.container}>
      <TouchableOpacity onPress={onBack} style={hdr.back} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
        <Text style={hdr.title}>Easy VTC</Text>
      </View>
      <View style={hdr.placeholder} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INDICATEUR D'ÉTAPES
// ══════════════════════════════════════════════════════════════════════════════
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={si.row}>
      {[1, 2, 3].map((step, idx) => (
        <React.Fragment key={step}>
          <View style={[si.circle, current >= step && si.circleActive]}>
            <Text style={[si.circleText, current >= step && si.circleTextActive]}>
              {step}
            </Text>
          </View>
          {idx < 2 && (
            <View style={[si.line, current > step && si.lineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 1 — Lieu / Destination / Véhicule
// ══════════════════════════════════════════════════════════════════════════════
type GeoState = 'idle' | 'loading' | 'ok' | 'error';

function Step1({
  booking, vehicleTypes, isFetchingPrice,
  setOrigin, setDestination, setVehicleType,
  getCurrentLocation, geocodeAddress,
}: any) {
  const [originInput,      setOriginInput]      = useState(booking.origin?.address ?? '');
  const [destinationInput, setDestinationInput] = useState(booking.destination?.address ?? '');
  const [isGeolocating,    setIsGeolocating]    = useState(false);
  const [originGeo,        setOriginGeo]        = useState<GeoState>(booking.origin ? 'ok' : 'idle');
  const [destGeo,          setDestGeo]          = useState<GeoState>(booking.destination ? 'ok' : 'idle');

  const handleGeolocate = async () => {
    setIsGeolocating(true);
    const point = await getCurrentLocation();
    if (point) {
      setOriginInput(point.address);
      setOrigin(point);
      setOriginGeo('ok');
    } else {
      Alert.alert('Géolocalisation', 'Impossible d\'obtenir votre position. Saisissez l\'adresse manuellement.');
    }
    setIsGeolocating(false);
  };

  const handleOriginBlur = async () => {
    const text = originInput.trim();
    if (!text) return;
    setOriginGeo('loading');
    const point = await geocodeAddress(text);
    if (point) {
      setOrigin({ ...point, address: text });
      setOriginGeo('ok');
    } else {
      setOriginGeo('error');
      Alert.alert(
        'Adresse introuvable',
        `"${text}" n'a pas été localisée. Essayez une adresse plus précise (ex : rue + ville + pays).`,
      );
    }
  };

  const handleDestinationBlur = async () => {
    const text = destinationInput.trim();
    if (!text) return;
    setDestGeo('loading');
    const point = await geocodeAddress(text);
    if (point) {
      setDestination({ ...point, address: text });
      setDestGeo('ok');
    } else {
      setDestGeo('error');
      Alert.alert(
        'Adresse introuvable',
        `"${text}" n'a pas été localisée. Essayez une adresse plus précise (ex : rue + ville + pays).`,
      );
    }
  };

  // Petit helper pour l'icône d'état à droite du champ adresse
  function GeoStatusIcon({ state }: { state: GeoState }) {
    if (state === 'loading') return <ActivityIndicator size="small" color={Colors.bordeaux} />;
    if (state === 'ok')      return <AppIcon name="checkmark-circle" size={18} color="#10B981" />;
    if (state === 'error')   return <AppIcon name="alert-circle-outline" size={18} color="#EF4444" />;
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {/* Lieu de départ */}
      <Text style={styles.fieldLabel}>Lieu de départ</Text>
      <View style={[
        styles.inputRow,
        originGeo === 'ok'    && styles.inputRowOk,
        originGeo === 'error' && styles.inputRowError,
      ]}>
        <AppIcon name="location-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.inputField}
          value={originInput}
          onChangeText={(t) => { setOriginInput(t); setOriginGeo('idle'); }}
          onBlur={handleOriginBlur}
          onSubmitEditing={handleOriginBlur}
          placeholder="Ex : 12 rue de Rivoli, Paris, France"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          blurOnSubmit={false}
        />
        <View style={styles.geoBtn}>
          <GeoStatusIcon state={originGeo} />
        </View>
        <TouchableOpacity onPress={handleGeolocate} style={styles.geoBtn} disabled={isGeolocating}>
          {isGeolocating
            ? <ActivityIndicator size="small" color={Colors.bordeaux} />
            : <AppIcon name="navigate-circle-outline" size={22} color={Colors.bordeaux} />
          }
        </TouchableOpacity>
      </View>
      {originGeo === 'ok' && (
        <Text style={styles.geoHint}>Adresse localisée — vous pouvez la modifier</Text>
      )}
      {originGeo === 'error' && (
        <Text style={[styles.geoHint, styles.geoHintError]}>Adresse introuvable — essayez une formulation plus précise</Text>
      )}

      {/* Destination */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Destination</Text>
      <View style={[
        styles.inputRow,
        destGeo === 'ok'    && styles.inputRowOk,
        destGeo === 'error' && styles.inputRowError,
      ]}>
        <AppIcon name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.inputField}
          value={destinationInput}
          onChangeText={(t) => { setDestinationInput(t); setDestGeo('idle'); }}
          onBlur={handleDestinationBlur}
          onSubmitEditing={handleDestinationBlur}
          placeholder="Ex : Aéroport CDG, Roissy, France"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
        />
        <View style={styles.geoBtn}>
          <GeoStatusIcon state={destGeo} />
        </View>
      </View>
      {destGeo === 'ok' && (
        <Text style={styles.geoHint}>Adresse localisée — vous pouvez la modifier</Text>
      )}
      {destGeo === 'error' && (
        <Text style={[styles.geoHint, styles.geoHintError]}>Adresse introuvable — essayez une formulation plus précise</Text>
      )}

      {/* Type de véhicule */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Type de véhicule</Text>
      <View style={styles.vehicleList}>
        {vehicleTypes.map((v: VehicleTypeOption) => {
          const isSelected = booking.vehicle_type === v.type;
          return (
            <TouchableOpacity
              key={v.type}
              style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
              onPress={() => setVehicleType(v.type)}
              activeOpacity={0.85}
            >
              <View style={[styles.vehicleIcon, isSelected && styles.vehicleIconSelected]}>
                <AppIcon
                  name={VEHICLE_ICONS[v.type] ?? 'car-outline'}
                  size={22}
                  color={isSelected ? Colors.white : Colors.bordeaux}
                />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                  {v.label}
                </Text>
                <Text style={styles.vehicleDesc}>{v.description}</Text>
              </View>
              <Text style={[styles.vehiclePrice, isSelected && styles.vehiclePriceSelected]}>
                À partir de {v.base_price}€
              </Text>
            </TouchableOpacity>
          );
        })}

        {vehicleTypes.length === 0 && (
          <View style={styles.emptyVehicles}>
            <ActivityIndicator color={Colors.bordeaux} />
          </View>
        )}
      </View>

      {/* Estimation prix */}
      {isFetchingPrice && (
        <View style={styles.estimateLoading}>
          <ActivityIndicator size="small" color={Colors.bordeaux} />
          <Text style={styles.estimateLoadingText}>Calcul du prix en cours…</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 2 — Date / Heure / Passagers / Bagages
// ══════════════════════════════════════════════════════════════════════════════
function Step2({ booking, setDate, setTime, setPassengers, setLuggage }: any) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedDate = booking.date ? new Date(booking.date) : new Date();
  const selectedTime = booking.time
    ? (() => { const [h, m] = booking.time.split(':'); const d = new Date(); d.setHours(+h, +m); return d; })()
    : new Date();

  const handleDateChange = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setDate(date.toISOString().split('T')[0]);
  };

  const handleTimeChange = (_: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      {/* Date */}
      <Text style={styles.fieldLabel}>Date</Text>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
        <AppIcon name="calendar-outline" size={18} color={Colors.textSecondary} />
        <Text style={[styles.datePickerText, !booking.date && styles.datePlaceholder]}>
          {booking.date ?? 'JJ / MM / AAAA'}
        </Text>
        <AppIcon name="chevron-down-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Heure */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Heure</Text>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
        <AppIcon name="time-outline" size={18} color={Colors.textSecondary} />
        <Text style={[styles.datePickerText, !booking.time && styles.datePlaceholder]}>
          {booking.time ?? 'HH : MM'}
        </Text>
        <AppIcon name="chevron-down-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour
          onChange={handleTimeChange}
        />
      )}

      {/* Passagers & Bagages */}
      <View style={styles.counterRow}>
        {/* Passagers */}
        <View style={styles.counterBlock}>
          <Text style={styles.fieldLabel}>Passagers</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPassengers(Math.max(1, booking.passengers - 1))}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{booking.passengers}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPassengers(Math.min(7, booking.passengers + 1))}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bagages */}
        <View style={styles.counterBlock}>
          <Text style={styles.fieldLabel}>Bagages</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setLuggage(Math.max(0, booking.luggage - 1))}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{booking.luggage}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setLuggage(Math.min(10, booking.luggage + 1))}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 3 — Récapitulatif + Confirmation
// ══════════════════════════════════════════════════════════════════════════════
function Step3({ booking, vehicleTypes, setComment, isFetchingPrice }: any) {
  const vehicleLabel = vehicleTypes.find((v: VehicleTypeOption) => v.type === booking.vehicle_type)?.label ?? booking.vehicle_type;

  const scheduledDate = booking.date
    ? new Date(`${booking.date}T${booking.time ?? '00:00'}:00`).toLocaleDateString('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    : '—';
  const scheduledTime = booking.time ?? '—';

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Récapitulatif</Text>

      <View style={styles.summaryCard}>
        {/* Départ */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.summaryTexts}>
            <Text style={styles.summaryLabel}>Départ</Text>
            <Text style={styles.summaryValue}>{booking.origin?.address ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.summaryConnector} />

        {/* Destination */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryDot, { backgroundColor: Colors.bordeaux }]} />
          <View style={styles.summaryTexts}>
            <Text style={styles.summaryLabel}>Destination</Text>
            <Text style={styles.summaryValue}>{booking.destination?.address ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.summarySep} />

        {/* Détails */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <Text style={styles.summaryGridLabel}>Date</Text>
            <Text style={styles.summaryGridValue}>{scheduledDate}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <Text style={styles.summaryGridLabel}>Heure</Text>
            <Text style={styles.summaryGridValue}>{scheduledTime}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="person-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{booking.passengers}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="briefcase-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{booking.luggage}</Text>
          </View>
        </View>
      </View>

      {/* Prix estimé */}
      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Prix estimé</Text>
        {isFetchingPrice
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.priceValue}>
              {booking.estimated_price != null ? `${booking.estimated_price.toFixed(2)}€` : '—'}
            </Text>
        }
      </View>

      {/* Commentaire */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Commentaire (optionnel)</Text>
      <TextInput
        style={styles.commentInput}
        value={booking.comment}
        onChangeText={setComment}
        placeholder="Ajoutez des informations supplémentaires…"
        placeholderTextColor={Colors.textSecondary}
        multiline
        numberOfLines={4}
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{booking.comment.length}/500</Text>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function BookingScreen({ navigation }: any) {
  const {
    booking, vehicleTypes, isSubmitting, isFetchingPrice, error,
    isStep1Valid, isStep2Valid, isStep3Valid,
    setOrigin, setDestination, setVehicleType,
    setDate, setTime, setPassengers, setLuggage, setComment,
    goToStep, nextStep, prevStep,
    getCurrentLocation, geocodeAddress,
    submitBooking, resetBooking, clearError,
  } = useReservation();

  const nav = navigation ?? useNavigation();

  const handleBack = () => {
    if (booking.step > 1) prevStep();
    else { resetBooking(); nav.goBack(); }
  };

  const handleNext = () => {
    if (booking.step === 1 && !isStep1Valid) {
      Alert.alert('Champs manquants', 'Veuillez renseigner le départ, la destination et le type de véhicule.');
      return;
    }
    if (booking.step === 2 && !isStep2Valid) {
      Alert.alert('Champs manquants', 'Veuillez renseigner la date, l\'heure et au moins 1 passager.');
      return;
    }
    nextStep();
  };

  const handleConfirm = async () => {
    try {
      const reservation = await submitBooking();
      resetBooking();
      nav.replace('BookingConfirmation', { reservationId: reservation.id });
    } catch {
      // L'erreur est dans le store et affichée via l'Alert ci-dessous
    }
  };

  // Afficher les erreurs store
  React.useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const isLastStep  = booking.step === 3;
  const canProceed  = booking.step === 1 ? isStep1Valid : booking.step === 2 ? isStep2Valid : isStep3Valid;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
      {/* Header */}
      <BookingHeader onBack={handleBack} />

      {/* Indicateur étapes */}
      <StepIndicator current={booking.step as 1 | 2 | 3} />

      {/* Contenu de l'étape */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {booking.step === 1 && (
          <Step1
            booking={booking}
            vehicleTypes={vehicleTypes}
            isFetchingPrice={isFetchingPrice}
            setOrigin={setOrigin}
            setDestination={setDestination}
            setVehicleType={setVehicleType}
            getCurrentLocation={getCurrentLocation}
            geocodeAddress={geocodeAddress}
          />
        )}
        {booking.step === 2 && (
          <Step2
            booking={booking}
            setDate={setDate}
            setTime={setTime}
            setPassengers={setPassengers}
            setLuggage={setLuggage}
          />
        )}
        {booking.step === 3 && (
          <Step3
            booking={booking}
            vehicleTypes={vehicleTypes}
            setComment={setComment}
            isFetchingPrice={isFetchingPrice}
          />
        )}
      </KeyboardAvoidingView>

      {/* Boutons navigation */}
      <View style={styles.navBar}>
        {booking.step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            booking.step === 1 && styles.nextBtnFull,
            (!canProceed || isSubmitting) && styles.nextBtnDisabled,
          ]}
          onPress={isLastStep ? handleConfirm : handleNext}
          disabled={!canProceed || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.nextBtnText}>
                {isLastStep ? 'Confirmer la réservation' : 'Suivant'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  stepContent: {
    padding: 20,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // ── Inputs ──────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 10,
    backgroundColor: Colors.white ?? '#fff',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: { marginRight: 8 },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  geoBtn: { padding: 4 },
  inputRowOk:    { borderColor: '#10B981' },
  inputRowError: { borderColor: '#EF4444' },
  geoHint: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    marginLeft: 4,
  },
  geoHintError: { color: '#EF4444' },

  // ── Date picker ─────────────────────────────────────────────────────────────
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 10,
    backgroundColor: Colors.white ?? '#fff',
    paddingHorizontal: 14,
    height: 50,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  datePlaceholder: { color: Colors.textSecondary },

  // ── Compteurs ───────────────────────────────────────────────────────────────
  counterRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  counterBlock: { flex: 1 },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 10,
    backgroundColor: Colors.white ?? '#fff',
    overflow: 'hidden',
  },
  counterBtn: {
    width: 44,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface ?? '#F9FAFB',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.bordeaux,
  },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // ── Véhicules ───────────────────────────────────────────────────────────────
  vehicleList: { gap: 10, marginTop: 4 },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.white ?? '#fff',
  },
  vehicleCardSelected: {
    borderColor: Colors.bordeaux,
    backgroundColor: '#FDF4F4',
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconSelected: { backgroundColor: Colors.bordeaux },
  vehicleInfo: { flex: 1 },
  vehicleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vehicleLabelSelected: { color: Colors.bordeaux },
  vehicleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  vehiclePriceSelected: { color: Colors.bordeaux },
  emptyVehicles: { paddingVertical: 20, alignItems: 'center' },

  // ── Estimation ──────────────────────────────────────────────────────────────
  estimateLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  estimateLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── Récapitulatif ───────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  summaryTexts: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  summaryConnector: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border ?? '#E5E7EB',
    marginLeft: 4,
    marginVertical: 4,
  },
  summarySep: {
    height: 1,
    backgroundColor: Colors.border ?? '#F3F4F6',
    marginVertical: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryGridLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryGridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // ── Prix ────────────────────────────────────────────────────────────────────
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bordeaux,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  priceLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  priceValue: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
  },

  // ── Commentaire ─────────────────────────────────────────────────────────────
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border ?? '#E5E7EB',
    borderRadius: 10,
    backgroundColor: Colors.white ?? '#fff',
    padding: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Barre navigation bas ────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: Colors.white ?? '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border ?? '#F3F4F6',
  },
  backBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: Colors.bordeaux,
    fontSize: 15,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnFull: { flex: 1 },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

// ── Header ────────────────────────────────────────────────────────────────────
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
  back:        { width: 40, alignItems: 'flex-start' },
  center:      { flex: 1, alignItems: 'center', gap: 2 },
  logo:        { width: 32, height: 32 },
  title:       { color: Colors.white, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  placeholder: { width: 40 },
});

// ── StepIndicator ─────────────────────────────────────────────────────────────
const si = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: Colors.white ?? '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border ?? '#F3F4F6',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.border ?? '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white ?? '#fff',
  },
  circleActive: {
    borderColor: Colors.bordeaux,
    backgroundColor: Colors.bordeaux,
  },
  circleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  circleTextActive: { color: Colors.white },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border ?? '#D1D5DB',
    marginHorizontal: 6,
  },
  lineActive: { backgroundColor: Colors.bordeaux },
});