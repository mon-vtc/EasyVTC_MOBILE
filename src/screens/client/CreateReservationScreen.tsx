// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — BookingScreen (3 étapes)
// Sprint 3 — EasyVTC
// Pays : France — prix en €
// Recalcul de l'estimation à chaque modification des adresses,
// du véhicule ou du nombre de passagers.
// Affichage et sélection des forfaits disponibles (Option 1 + Option 2).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation }  from '@react-navigation/native';
import { useReservation } from '../../hooks/useReservation';
import { useToast }       from '../../hooks/useToast';
import { AppIcon }        from '../../components/common/AppIcon';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Colors, Spacing, Fonts } from '../../theme/colors';
import { Logo }           from '../../constants/logo';
import type { GeoPoint, VehicleTypeOption } from '../../types/reservations.types';
import type { PricingFlatRate } from '../../types/pricing.types';
import CustomCalendarModal from '../../components/common/CustomCalendarModal';
import CustomTimePickerModal from '../../components/common/CustomTimePickerModal';
import { FavoriteAddress } from '../../types/favorites.types'

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLE ICONS — alignés avec VehicleType backend : standard | berline | van
// ══════════════════════════════════════════════════════════════════════════════
const VEHICLE_ICONS: Record<string, string> = {
  standard: 'car-outline',
  berline:  'car-outline',
  van:      'bus-outline',
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function formatPrice(price: number): string {
  return `${price.toFixed(2)} €`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL DÉTAIL FORFAIT
// ══════════════════════════════════════════════════════════════════════════════
function ForfaitDetailModal({
  forfait,
  onApply,
  onClose,
}: {
  forfait: PricingFlatRate;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={fdm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={fdm.sheet}>
        {/* En-tête */}
        <View style={fdm.header}>
          <View style={fdm.handle} />
          <TouchableOpacity onPress={onClose} style={fdm.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppIcon name="close-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Icône + label */}
        <View style={fdm.titleRow}>
          <View style={fdm.iconWrap}>
            <AppIcon name="pricetag-outline" size={26} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={fdm.label}>{forfait.label}</Text>
            <Text style={fdm.subtitle}>Tarif forfaitaire</Text>
          </View>
        </View>

        {/* Itinéraire */}
        <View style={fdm.routeCard}>
          <View style={fdm.routeRow}>
            <View style={[fdm.dot, { backgroundColor: '#10B981' }]} />
            <View>
              <Text style={fdm.routeRole}>Départ</Text>
              <Text style={fdm.routePlace}>{forfait.origin_label}</Text>
            </View>
          </View>
          <View style={fdm.routeLine} />
          <View style={fdm.routeRow}>
            <View style={[fdm.dot, { backgroundColor: Colors.bordeaux }]} />
            <View>
              <Text style={fdm.routeRole}>Arrivée</Text>
              <Text style={fdm.routePlace}>{forfait.destination_label}</Text>
            </View>
          </View>
        </View>

        {/* Prix */}
        <View style={fdm.priceRow}>
          <Text style={fdm.priceLabel}>Tarif de base</Text>
          <Text style={fdm.priceValue}>{formatPrice(forfait.price)}</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={fdm.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <AppIcon name="checkmark-outline" size={18} color={Colors.white} />
          <Text style={fdm.applyBtnText}>Choisir ce forfait</Text>
        </TouchableOpacity>

        <TouchableOpacity style={fdm.cancelBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={fdm.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════════════════════
function BookingHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={hdr.container}>
      <TouchableOpacity
        onPress={onBack}
        style={hdr.back}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Image source={Logo.LogoEasyVTC} style={hdr.logo} resizeMode="contain" />
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
          {idx < 2 && <View style={[si.line, current > step && si.lineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 1 — Lieu / Destination / Véhicule / Forfaits
// ══════════════════════════════════════════════════════════════════════════════
function Step1({
  booking, vehicleTypes, isFetchingPrice,
  flatRates, suggestedFlatRate,
  setOrigin, setDestination, setVehicleType,
  setFlatRateId,
  getCurrentLocation, geocodeAddress, favorites,
}: any) {
  const { showToast } = useToast();
  const [originInput, setOriginInput] = useState<string>(booking.origin?.address ?? '');
  const [destinationInput, setDestinationInput] = useState<string>(booking.destination?.address ?? '');
  const [focusedInput, setFocusedInput] = useState<'origin' | 'destination' | null>(null);
  const [originError, setOriginError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [detailForfait, setDetailForfait] = useState<PricingFlatRate | null>(null);

  // Synchronise les inputs locaux avec l'état global de la réservation
  // (utile si l'état est modifié par un forfait par exemple)
  React.useEffect(() => {
    if (focusedInput !== 'origin') {
      setOriginInput(booking.origin?.address ?? '');
    }
    setOriginError(null);
  }, [booking.origin]);

  React.useEffect(() => {
    if (focusedInput !== 'destination') {
      setDestinationInput(booking.destination?.address ?? '');
    }
    setDestinationError(null);
  }, [booking.destination]);

  // ── Géolocalisation ────────────────────────────────────────────────────────
  const handleGeolocate = async () => {
    setIsGeolocating(true);
    const point = await getCurrentLocation();
    if (point) {
      setOriginInput(point.address);
      setOrigin(point);
      setOriginError(null);
    } else {
      setOrigin(null); // Efface l'origine si la géolocalisation échoue
      setOriginError('Impossible de géolocaliser votre position.');
      showToast({ title: 'Géolocalisation', message: "Impossible d'obtenir votre position.", type: 'error' });
    }
    setIsGeolocating(false);
  };

  // ── Géocodage au blur ──────────────────────────────────────────────────────
  const handleOriginBlur = useCallback(async () => {
    const trimmed = originInput.trim();
    if (!trimmed) {
      setOrigin(null); // Efface l'origine si l'input est vide
      setOriginError(null);
      return;
    }
    const point = await geocodeAddress(trimmed);
    if (point) {
      setOrigin({ ...point, address: trimmed });
      setOriginError(null);
    } else {
      setOrigin(null); // Efface l'origine si le géocodage échoue
      setOriginError('Adresse de départ invalide');
      showToast({ title: 'Adresse invalide', message: 'Impossible de trouver l\'adresse de départ. Veuillez vérifier.', type: 'error' });
    }
  }, [originInput, geocodeAddress, setOrigin, showToast]);

  const handleDestinationBlur = useCallback(async () => {
    const trimmed = destinationInput.trim();
    if (!trimmed) {
      setDestination(null); // Efface la destination si l'input est vide
      setDestinationError(null);
      return;
    }
    const point = await geocodeAddress(trimmed);
    if (point) {
      setDestination({ ...point, address: trimmed });
      setDestinationError(null);
    } else {
      setDestination(null); // Efface la destination si le géocodage échoue
      setDestinationError('Adresse de destination invalide');
      showToast({ title: 'Adresse invalide', message: 'Impossible de trouver l\'adresse de destination. Veuillez vérifier.', type: 'error' });
    }
  }, [destinationInput, geocodeAddress, setDestination, showToast]);

  // ── Forfait : ouvre la vue détail avant d'appliquer ───────────────────────
  const handleFlatRatePress = useCallback((fr: PricingFlatRate) => {
    if (booking.flat_rate_id === fr.id) {
      setFlatRateId(null); // désélection directe si déjà actif
    } else {
      setDetailForfait(fr); // ouvre la vue détail
    }
  }, [booking.flat_rate_id, setFlatRateId]);

  const handleApplyForfait = useCallback(() => {
    if (detailForfait) {
      setOriginInput(detailForfait.origin_label);
      setDestinationInput(detailForfait.destination_label);
      setOriginError(null); // Efface les erreurs d'adresse si un forfait est appliqué
      setDestinationError(null);
      setFlatRateId(detailForfait.id);
      setDetailForfait(null);
    }
  }, [detailForfait, setFlatRateId]);

  const handleSelectFavorite = (fav: FavoriteAddress) => {
    const point: GeoPoint = {
      address: fav.address,
      latitude: fav.lat ?? 0,
      longitude: fav.lng ?? 0,
    };
    if (focusedInput === 'origin') {
      setOrigin(point);
    } else if (focusedInput === 'destination') {
      setDestination(point);
    }
    setFocusedInput(null);
  };

  const suggestedFavorites = useMemo(() => {
    if (!focusedInput) return [];
    const query = (focusedInput === 'origin' ? originInput : destinationInput).toLowerCase().trim();
    if (query.length < 2) return [];

    return favorites.filter(
      (fav: FavoriteAddress) =>
        fav.label.toLowerCase().includes(query) || fav.address.toLowerCase().includes(query)
    );
  }, [favorites, focusedInput, originInput, destinationInput]);

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">

      {/* ── Modal détail forfait ── */}
      {detailForfait && (
        <ForfaitDetailModal
          forfait={detailForfait}
          onApply={handleApplyForfait}
          onClose={() => setDetailForfait(null)}
        />
      )}

      {/* ── Lieu de départ ── */}
      <Text style={styles.fieldLabel}>Lieu de départ</Text>
      <View style={[ styles.inputRow, focusedInput=== 'origin' && { borderBottomRightRadius : 0, borderBottomLeftRadius : 0}]}>
        <AppIcon name="location-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={[styles.inputField, originError ? styles.inputError : null]}
          value={originInput}
          onChangeText={(text) => {
            setOriginInput(text);
            setOriginError(null); // Efface l'erreur dès que l'utilisateur modifie
            if (booking.flat_rate_id) setFlatRateId(null);
          }}
          onFocus={() => setFocusedInput('origin')}
          onBlur={handleOriginBlur}
          placeholder="Ex : 12 rue de Rivoli, Paris"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="next"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={handleGeolocate} style={styles.geoBtn} disabled={isGeolocating}>
          {isGeolocating
            ? <ActivityIndicator size="small" color={Colors.bordeaux} />
            : <AppIcon name="navigate-circle-outline" size={22} color={Colors.bordeaux} />
          }
        </TouchableOpacity>
      </View>
      {/* Suggestions pour le départ */}
      {focusedInput === 'origin' && suggestedFavorites.length > 0 && (
        <View style={styles.favoritesContainer}>
          <Text style={styles.favoritesTitle}>Suggestions</Text>
          {suggestedFavorites.map((item: FavoriteAddress) => (
            <TouchableOpacity key={item.id} style={styles.favoriteItem} onPress={() => handleSelectFavorite(item)}>
              <AppIcon name="star" size={16} color={Colors.bordeaux} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.favoriteLabel}>{item.label}</Text>
                <Text style={styles.favoriteAddress} numberOfLines={1}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {booking.origin && (
        <Text style={styles.geoHint}>
          ✓ Position enregistrée — modifiez et quittez le champ pour recalculer
        </Text>
      )}
      {originError && (
        <Text style={[styles.geoHint, styles.errorText]}>
          ✗ {originError}
        </Text>
      )}


      {/* ── Destination ── */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Destination</Text>
      <View style={[ styles.inputRow, focusedInput=== 'destination' && { borderBottomRightRadius : 0, borderBottomLeftRadius : 0} ]}>
        <AppIcon name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={[styles.inputField, destinationError ? styles.inputError : null]}
          value={destinationInput}
          onChangeText={(text) => {
            setDestinationInput(text);
            setDestinationError(null); // Efface l'erreur dès que l'utilisateur modifie
            if (booking.flat_rate_id) setFlatRateId(null);
          }}
          onFocus={() => setFocusedInput('destination')}
          onBlur={handleDestinationBlur}
          placeholder="Ex : Aéroport Charles de Gaulle"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          autoCorrect={false}
        />
      </View>
      {/* Suggestions pour la destination */}
      {focusedInput === 'destination' && suggestedFavorites.length > 0 && (
        <View style={styles.favoritesContainer}>
          <Text style={styles.favoritesTitle}>Suggestions</Text>
          {suggestedFavorites.map((item: FavoriteAddress) => (
            <TouchableOpacity key={item.id} style={styles.favoriteItem} onPress={() => handleSelectFavorite(item)}>
              <AppIcon name="star" size={16} color={Colors.bordeaux} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.favoriteLabel}>{item.label}</Text>
                <Text style={styles.favoriteAddress} numberOfLines={1}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {booking.destination && (
        <Text style={styles.geoHint}>
          ✓ Destination enregistrée — modifiez et quittez le champ pour recalculer
        </Text>
      )}
      {destinationError && (
        <Text style={[styles.geoHint, styles.errorText]}>
          ✗ {destinationError}
        </Text>
      )}


      {/* ── Bannière de suggestion de forfait (Option 2) ── */}
      {suggestedFlatRate && booking.flat_rate_id !== suggestedFlatRate.id && (
        <TouchableOpacity
          style={styles.suggestionBanner}
          onPress={() => setDetailForfait(suggestedFlatRate)}
          activeOpacity={0.85}
        >
          <AppIcon name="pricetag-outline" size={16} color={Colors.bordeaux} />
          <View style={styles.suggestionTexts}>
            <Text style={styles.suggestionTitle} numberOfLines={1}>
              Forfait disponible · {suggestedFlatRate.label}
            </Text>
            <Text style={styles.suggestionRoute} numberOfLines={1}>
              {suggestedFlatRate.origin_label} → {suggestedFlatRate.destination_label}
            </Text>
          </View>
          <Text style={styles.suggestionPrice}>{formatPrice(suggestedFlatRate.price)}</Text>
          <View style={styles.suggestionApplyBtn}>
            <Text style={styles.suggestionApplyText}>Appliquer</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Type de véhicule ── */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Type de véhicule</Text>
      <View style={styles.vehicleList}>
        {vehicleTypes.length === 0 && (
          <View style={styles.emptyVehicles}>
            <ActivityIndicator color={Colors.bordeaux} />
            <Text style={styles.estimateLoadingText}>Chargement…</Text>
          </View>
        )}
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
                  name={(VEHICLE_ICONS[v.type] ?? 'car-outline') as any}
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
              {v.base_price > 0 && (
                <Text style={[styles.vehiclePrice, isSelected && styles.vehiclePriceSelected]}>
                  À partir de {formatPrice(v.base_price)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Grille forfaitaire (Option 1) ── */}
      {flatRates.length > 0 && (
        <>
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Forfaits disponibles</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatRateList}
          >
            {flatRates.map((fr: PricingFlatRate) => {
              const isSelected = booking.flat_rate_id === fr.id;
              return (
                <TouchableOpacity
                  key={fr.id}
                  style={[styles.flatRateCard, isSelected && styles.flatRateCardSelected]}
                  onPress={() => handleFlatRatePress(fr)}
                  activeOpacity={0.85}
                >
                  <View style={styles.flatRateIconRow}>
                    <AppIcon
                      name="pricetag-outline"
                      size={14}
                      color={isSelected ? Colors.white : Colors.bordeaux}
                    />
                    {isSelected && (
                      <AppIcon name="checkmark-circle" size={14} color={Colors.white} />
                    )}
                  </View>
                  <Text
                    style={[styles.flatRateLabel, isSelected && styles.flatRateLabelSelected]}
                    numberOfLines={1}
                  >
                    {fr.label}
                  </Text>
                  <Text style={[styles.flatRateRoute, isSelected && styles.flatRateRouteSelected]} numberOfLines={1}>
                    {fr.origin_label}
                  </Text>
                  <AppIcon
                    name="arrow-forward-outline"
                    size={10}
                    color={isSelected ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.flatRateRoute, isSelected && styles.flatRateRouteSelected]} numberOfLines={1}>
                    {fr.destination_label}
                  </Text>
                  <Text style={[styles.flatRatePrice, isSelected && styles.flatRatePriceSelected]}>
                    {formatPrice(fr.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {booking.flat_rate_id && (
            <TouchableOpacity onPress={() => setFlatRateId(null)} style={styles.clearFlatRate}>
              <AppIcon name="close-circle-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.clearFlatRateText}>Retirer le forfait</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* ── Estimation en cours ── */}
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
function Step2({ booking, setDate, setTime, setPassengers, setLuggage, setPromoCode, isFetchingPrice }: any) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedDate = booking.date ? new Date(booking.date) : new Date();
  const selectedTime = booking.time
    ? (() => {
        const [h, m] = booking.time.split(':');
        const d = new Date();
        d.setHours(+h, +m, 0, 0);
        return d;
      })()
    : new Date();

  const handleDateConfirm = (date: Date) => {
    setShowDatePicker(false);
    setDate(date.toISOString().split('T')[0]);
  };

  const handleTimeChange = (_: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  };

  const todayString = new Date().toISOString().split('T')[0];

  return (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">

      {/* ── Date ── */}
      <Text style={styles.fieldLabel}>Date</Text>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
        <AppIcon name="calendar-outline" size={18} color={Colors.textSecondary} />
        <Text style={[styles.datePickerText, !booking.date && styles.datePlaceholder]}>
          {booking.date
            ? new Date(booking.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'JJ / MM / AAAA'}
        </Text>
        <AppIcon name="chevron-down-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* ── Modal Calendrier custom ── */}
      <CustomCalendarModal
        visible={showDatePicker}
        selectedDate={booking.date ?? null}
        onConfirm={(dateStr) => {
          setDate(dateStr);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* ── Heure ── */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Heure</Text>
      <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
        <AppIcon name="time-outline" size={18} color={Colors.textSecondary} />
        <Text style={[styles.datePickerText, !booking.time && styles.datePlaceholder]}>
          {booking.time ?? 'HH : MM'}
        </Text>
        <AppIcon name="chevron-down-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showTimePicker && (
        <CustomTimePickerModal
          visible={showTimePicker}
          selectedTime={booking.time ?? null}
          onConfirm={(timeStr) => {
            setTime(timeStr);
            setShowTimePicker(false);
          }}
          onCancel={() => setShowTimePicker(false)}
        />
      )}

      {/* ── Compteurs ── */}
      <View style={styles.counterRow}>
        <View style={styles.counterBlock}>
          <Text style={styles.fieldLabel}>Passagers</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.max(1, booking.nb_passengers - 1))}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{booking.nb_passengers}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.min(7, booking.nb_passengers + 1))}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.counterBlock}>
          <Text style={styles.fieldLabel}>Bagages</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setLuggage(Math.max(0, booking.luggage - 1))}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{booking.luggage}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setLuggage(Math.min(10, booking.luggage + 1))}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Champ Code Promo */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Code promo (optionnel)</Text>
      <View style={styles.inputRow}>
        <AppIcon name="ticket-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.inputField}
          value={booking.promo_code ?? ''}
          onChangeText={setPromoCode}
          placeholder="Ex: SUMMER24"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {isFetchingPrice && (
        <View style={styles.estimateLoading}>
          <ActivityIndicator size="small" color={Colors.bordeaux} />
          <Text style={styles.estimateLoadingText}>Mise à jour du prix…</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles du calendrier ────────────────────────────────────────────
const calendarStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold, fontWeight: 'bold',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.bordeauxLight,
  },
  cancelText: {
    color: Colors.bordeauxLight,
    fontSize: 15,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
});
// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 3 — Récapitulatif + Confirmation
// ══════════════════════════════════════════════════════════════════════════════
function Step3({ booking, vehicleTypes, flatRates, setComment, isFetchingPrice }: any) {
  const vehicleLabel =
    vehicleTypes.find((v: VehicleTypeOption) => v.type === booking.vehicle_type)?.label ??
    booking.vehicle_type;

  const selectedForfait: PricingFlatRate | undefined =
    booking.flat_rate_id
      ? flatRates.find((fr: PricingFlatRate) => fr.id === booking.flat_rate_id)
      : undefined;

  const scheduledDate = booking.date
    ? new Date(`${booking.date}T${booking.time ?? '00:00'}:00`).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
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

        {/* Grille de détails */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <AppIcon name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{scheduledDate}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{scheduledTime}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="person-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{booking.nb_passengers} passager{booking.nb_passengers > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="briefcase-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{booking.luggage} bagage{booking.luggage > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryGridItem}>
            <AppIcon name="car-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryGridValue}>{vehicleLabel}</Text>
          </View>
          {selectedForfait ? (
            <View style={styles.summaryGridItem}>
              <AppIcon name="pricetag-outline" size={14} color={Colors.bordeaux} />
              <Text style={[styles.summaryGridValue, { color: Colors.bordeaux }]}>
                {selectedForfait.label}
              </Text>
            </View>
          ) : booking.distance_km != null && (
            <View style={styles.summaryGridItem}>
              <AppIcon name="navigate-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.summaryGridValue}>~{booking.distance_km} km</Text>
            </View>
          )}
          {booking.duration_min != null && (
            <View style={styles.summaryGridItem}>
              <AppIcon name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.summaryGridValue}>~{booking.duration_min} min</Text>
            </View>
          )}
        </View>

        <View style={styles.summarySep} />

      <View style={styles.summaryPromo}> 
        <AppIcon name="ticket-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.summaryPromoText}>
          {booking.promo_code ? `Code promo : ${booking.promo_code}` : 'Aucun code promo'}
        </Text>
      </View>
      </View>

      {/* Prix estimé */}
      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Prix estimé</Text>
        {isFetchingPrice ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.priceValue}>
            {booking.estimated_price != null ? formatPrice(booking.estimated_price) : '—'}
          </Text>
        )}
      </View>
      {booking.estimated_price != null && (
        <Text style={styles.priceNote}>
          {selectedForfait
            ? `Tarif forfaitaire · ${selectedForfait.origin_label} → ${selectedForfait.destination_label}`
            : 'Tarif indicatif · France · TVA incluse'
          }
        </Text>
      )}

      {/* Commentaire */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Commentaire (optionnel)</Text>
      <TextInput
        style={styles.commentInput}
        value={booking.comment}
        onChangeText={setComment}
        placeholder="Informations utiles pour le chauffeur…"
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
    flatRates, suggestedFlatRate,
    setOrigin, setDestination, setVehicleType,
    favorites,
    setFlatRateId,
    setDate, setTime, setPassengers, setLuggage, setComment,
    goToStep, nextStep, prevStep, setPromoCode,
    getCurrentLocation, geocodeAddress,
    fetchEstimate,
    submitBooking, resetBooking, clearError,
  } = useReservation();

  const nav = navigation ?? useNavigation();
  const { showToast } = useToast();

  const handleBack = () => {
    if (booking.step > 1) prevStep();
    else { resetBooking(); nav.goBack(); }
  };

  const handleNext = () => {
    if (booking.step === 1 && !isStep1Valid) {
      showToast({ title: 'Champs manquants', message: 'Veuillez renseigner le départ, la destination et le type de véhicule.', type: 'warning' });
      return;
    }
    if (booking.step === 2 && !isStep2Valid) {
      showToast({ title: 'Champs manquants', message: "Veuillez renseigner la date, l'heure et au moins 1 passager.", type: 'warning' });
      return;
    }
    // Transition étape 2 → 3 : forcer un recalcul avec tous les paramètres courants.
    if (booking.step === 2) {
      const { origin, destination, vehicle_type, nb_passengers, flat_rate_id } = booking;
      if (flat_rate_id) {
        setFlatRateId(flat_rate_id); // recalcule avec le forfait et nb_passengers à jour
      } else if (origin && destination && vehicle_type) {
        fetchEstimate(origin, destination, vehicle_type, nb_passengers);
      }
    }
    nextStep();
  };

  const handleConfirm = async () => {
    try {
      const reservation = await submitBooking();
      resetBooking();
      nav.replace('BookingConfirmation', { reservationId: reservation.id });
    } catch (err) {
      console.warn('Booking confirmation failed', err);
      showToast({ title: 'Erreur', message: `${err}`, type: 'error' });
    }
  };

  React.useEffect(() => {
    if (error) {
      showToast({ title: 'Erreur', message: error, type: 'error' });
      clearError();
    }
  }, [error]);

  const isLastStep = booking.step === 3;
  const canProceed = booking.step === 1 ? isStep1Valid
                   : booking.step === 2 ? isStep2Valid
                   : isStep3Valid;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background ?? '#F5F5F5' }}>
      <BookingHeader onBack={handleBack} />
      <StepIndicator current={booking.step as 1 | 2 | 3} />

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
            flatRates={flatRates}
            suggestedFlatRate={suggestedFlatRate}
            setOrigin={setOrigin}
            setDestination={setDestination}
            setVehicleType={setVehicleType}
            setFlatRateId={setFlatRateId}
            getCurrentLocation={getCurrentLocation}
            favorites={favorites}
            geocodeAddress={geocodeAddress}
          />
        )}
        {booking.step === 2 && (
          <Step2
            booking={booking}
            setDate={setDate}
            setTime={setTime}
            setPassengers={setPassengers}   // wrapper enrichi du hook
            setLuggage={setLuggage}
            setPromoCode={setPromoCode}
            isFetchingPrice={isFetchingPrice}
          />
        )}
        {booking.step === 3 && (
          <Step3
            booking={booking}
            vehicleTypes={vehicleTypes}
            flatRates={flatRates}
            setComment={setComment}
            isFetchingPrice={isFetchingPrice}
          />
        )}
      </KeyboardAvoidingView>

      {/* Barre de navigation bas */}
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
  stepContent: { padding: 20, paddingBottom: 32 },
  fieldLabel: {
    fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textPrimary, marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17, fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 14,
  },

  // ── Inputs ─────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderRadius: 10, backgroundColor: Colors.white ?? '#fff',
    paddingHorizontal: 12, height: 50,
    borderWidth: 1, borderColor: 'transparent', // Ajout pour la bordure d'erreur
  },
  inputField: { flex: 1, fontSize: 14, color: Colors.textPrimary, marginLeft: 8 },
  geoBtn:     { padding: 4 },
  geoHint:    { fontSize: 12, color: '#10B981', marginTop: 5, marginLeft: 4 },

  // Favoris
  favoritesContainer: {
    // marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: Spacing.sm,
  },
  favoritesTitle: {
    fontSize: 13,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
  },
  favoriteLabel: { fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary },
  favoriteAddress: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  favoritesEmpty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', padding: Spacing.md },
  // ── Bannière suggestion forfait (Option 2) ─────────────────────────────────
  // suggestionBanner: {
  //   // ... (pas de changement ici)
  // },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444' },
  suggestionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, padding: 12, borderRadius: 10,
    backgroundColor: '#FDF4F4',
    borderWidth: 1.5, borderColor: Colors.bordeaux,
  },
  suggestionTexts: { flex: 1 },
  suggestionTitle: { fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  suggestionRoute: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  suggestionPrice: { fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  suggestionApplyBtn: {
    backgroundColor: Colors.bordeaux, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  suggestionApplyText: { fontSize: 12, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },

  // ── Date picker ────────────────────────────────────────────────────────────
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderRadius: 10, backgroundColor: Colors.white ?? '#fff',
    paddingHorizontal: 14, height: 50,
  },
  datePickerText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  datePlaceholder: { color: Colors.textSecondary },

  // ── Compteurs ──────────────────────────────────────────────────────────────
  counterRow:   { flexDirection: 'row', gap: 16, marginTop: 20 },
  counterBlock: { flex: 1 },
  counter: {
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderRadius: 10, backgroundColor: Colors.white ?? '#fff', overflow: 'hidden', padding: Spacing.sm,
  },
  counterBtn: {
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bordeauxLight, borderRadius: 20,
  },
  counterBtnText: { fontSize: 20, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },
  counterValue: {
    flex: 1, textAlign: 'center',
    fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary,
  },

  // ── Véhicules ──────────────────────────────────────────────────────────────
  vehicleList:          { gap: 10, marginTop: 4 },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderRadius: 12, padding: 14, backgroundColor: Colors.white ?? '#fff',
  },
  vehicleCardSelected:  { borderWidth: 1.5, borderColor: Colors.bordeauxLight, backgroundColor: '#FDF4F4' },
  vehicleIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FDF4F4', alignItems: 'center', justifyContent: 'center',
  },
  vehicleIconSelected:  { backgroundColor: Colors.bordeaux },
  vehicleInfo:          { flex: 1 },
  vehicleLabel:         { fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
  vehicleLabelSelected: { color: Colors.bordeaux },
  vehicleDesc:          { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  vehiclePrice:         { fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textSecondary },
  vehiclePriceSelected: { color: Colors.bordeaux },
  emptyVehicles:        { paddingVertical: 20, alignItems: 'center', gap: 8 },

  // ── Forfaits — défilement horizontal (Option 1) ────────────────────────────
  flatRateList: { gap: 10, paddingVertical: 4 },
  flatRateCard: {
    width: 130, padding: 12, borderRadius: 12, gap: 3,
    backgroundColor: Colors.white ?? '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  flatRateCardSelected: { borderColor: Colors.bordeaux, backgroundColor: Colors.bordeaux },
  flatRateIconRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  flatRateLabel:         { fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
  flatRateLabelSelected: { color: Colors.white },
  flatRateRoute:         { fontSize: 11, color: Colors.textSecondary },
  flatRateRouteSelected: { color: 'rgba(255,255,255,0.8)' },
  flatRatePrice:         { fontSize: 15, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, marginTop: 4 },
  flatRatePriceSelected: { color: Colors.white },
  clearFlatRate: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4,
  },
  clearFlatRateText: { fontSize: 12, color: Colors.textSecondary, textDecorationLine: 'underline' },

  // ── Estimation ─────────────────────────────────────────────────────────────
  estimateLoading:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  estimateLoadingText: { fontSize: 13, color: Colors.textSecondary },

  // ── Récapitulatif ──────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.white ?? '#fff', borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  summaryRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  summaryTexts:     { flex: 1 },
  summaryLabel:     { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue:     { fontSize: 14, fontFamily: Fonts.medium, fontWeight: '500', color: Colors.textPrimary, marginTop: 2 },
  summaryConnector: { width: 1, height: 16, backgroundColor: Colors.border ?? '#E5E7EB', marginLeft: 4, marginVertical: 4 },
  summarySep:       { height: 1, backgroundColor: Colors.border ?? '#F3F4F6', marginVertical: 14 },
  summaryGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryGridItem:  { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '45%' },
  summaryGridValue: { fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary },
  summaryPromo:     { fontSize: 13, color: Colors.textSecondary, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryPromoText: { fontSize: 13, color: Colors.bordeaux, fontFamily: Fonts.semibold, fontWeight: '600' },
  // ── Prix ───────────────────────────────────────────────────────────────────
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bordeaux, borderRadius: 12, padding: 16, marginTop: 16,
  },
  priceLabel: { color: Colors.white, fontSize: 15, fontFamily: Fonts.semibold, fontWeight: '600' },
  priceValue: { color: Colors.white, fontSize: 22, fontFamily: Fonts.bold, fontWeight: '800' },
  priceNote:  { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },

  // ── Commentaire ────────────────────────────────────────────────────────────
  commentInput: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderRadius: 10, backgroundColor: Colors.white ?? '#fff',
    padding: 14, fontSize: 14, color: Colors.textPrimary, minHeight: 100,
  },
  charCount: { fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },

  // ── Barre navigation ───────────────────────────────────────────────────────
  // inputError: {
  //   borderColor: Colors.error,
  //   borderWidth: 1,
  // },
  // errorText: { color: Colors.error },
  navBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: Colors.white ?? '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  backBtn: {
    flex: 1, height: 50, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.bordeaux,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText:     { color: Colors.bordeaux, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  nextBtn: {
    flex: 2, height: 50, borderRadius: 10,
    backgroundColor: Colors.bordeaux, alignItems: 'center', justifyContent: 'center',
  },
  nextBtnFull:     { flex: 1 },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText:     { color: Colors.white, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
});

// ── Header styles ──────────────────────────────────────────────────────────────
const hdr = StyleSheet.create({
  container: {
    height: 100, backgroundColor: Colors.bordeaux,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingBottom: 14, paddingHorizontal: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  back:        { width: 40, alignItems: 'flex-start' },
  center:      { flex: 1, alignItems: 'center', gap: 2 },
  logo:        { width: 40, height: 40 },
  title:       { color: Colors.white, fontSize: 11, fontFamily: Fonts.semibold, fontWeight: '600', letterSpacing: 0.5 },
  placeholder: { width: 40 },
});

// ── StepIndicator styles ───────────────────────────────────────────────────────
const si = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 40,
    backgroundColor: Colors.white ?? '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  circle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    borderColor: Colors.border ?? '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white ?? '#fff',
  },
  circleActive:     { borderColor: Colors.bordeaux, backgroundColor: Colors.bordeaux },
  circleText:       { fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textSecondary },
  circleTextActive: { color: Colors.white },
  line:             { flex: 1, height: 2, backgroundColor: Colors.border ?? '#D1D5DB', marginHorizontal: 6 },
  lineActive:       { backgroundColor: Colors.bordeaux },
});

// ── ForfaitDetailModal styles ──────────────────────────────────────────────────
const fdm = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white ?? '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    elevation: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
  },
  header: {
    alignItems: 'center', paddingTop: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'center',
  },
  handle: {
    position: 'absolute', top: 0,
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border ?? '#D1D5DB',
  },
  closeBtn: {
    position: 'absolute', right: 0, top: -4,
    padding: 4,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  iconWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontSize: 17, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12, color: Colors.textSecondary, marginTop: 2,
  },
  routeCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5, marginTop: 3,
  },
  routeLine: {
    width: 1, height: 14, backgroundColor: Colors.border ?? '#D1D5DB',
    marginLeft: 4, marginVertical: 4,
  },
  routeRole: {
    fontSize: 10, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  routePlace: {
    fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary, marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.medium, fontWeight: '500',
  },
  priceValue: {
    fontSize: 22, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux,
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.bordeaux, borderRadius: 12,
    height: 50, marginBottom: 10,
  },
  applyBtnText: {
    color: Colors.white, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center', justifyContent: 'center',
    height: 44,
  },
  cancelBtnText: {
    color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.medium, fontWeight: '500',
  },
});
