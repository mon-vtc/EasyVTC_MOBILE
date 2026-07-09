import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../../../hooks/useToast';
import { AppIcon } from '../../common/AppIcon';
import { Colors, Fonts } from '../../../theme/colors';
import type { UserPromoCodeItem } from '../../../types';

interface PromoCodeCardProps {
  promo: UserPromoCodeItem;
}

const PROMO_COLORS: Record<string, string[]> = {
  bienvenue: ['#3B82F6', '#60A5FA'], // Bleu
  'week-end' : ['#8B5CF6', '#A78BFA'], // Violet
  fidélité: ['#10B981', '#34D399'], // Vert
  default: [Colors.bordeaux, Colors.bordeauxLight],
};

function getPromoColors(name: string | null): string[] {
  const lowerName = name?.toLowerCase() ?? '';
  if (lowerName.includes('bienvenue')) return PROMO_COLORS.bienvenue;
  if (lowerName.includes('week-end') || lowerName.includes('weekend')) return PROMO_COLORS['week-end'];
  if (lowerName.includes('fidélité') || lowerName.includes('fidelité') || lowerName.includes('fidelite')) return PROMO_COLORS.fidélité;
  return PROMO_COLORS.default;
}

export function PromoCodeCard({ promo }: PromoCodeCardProps) {
  const isExpired = promo.is_expired;
  const gradientColors = isExpired ? ['#B0B0B0', '#9E9E9E'] : getPromoColors(promo.name);
  const { showToast  } =  useToast();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(promo.code);
    showToast({
      type: 'success',
      title: 'Code copié !',
      message: `Le code ${promo.code} est dans votre presse-papiers.`,
    })
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.card, isExpired && styles.expiredCard]}>
      {/* Partie supérieure colorée */}
      <LinearGradient
        colors={gradientColors}
        style={styles.promoZone}
      >
        <View style={styles.promoHeader}>
          <Text style={styles.promoName}>{promo.name ?? 'Promotion'}</Text>
          {promo.discount_type === 'percent'  ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{promo.discount_value}%</Text>
            </View>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{promo.discount_value}<AppIcon name="logo-euro" size={10} color="white" /></Text>
            </View>
          )}
        </View>
        <Text style={styles.promoDescription}>{promo.description ?? `Remise sur votre course.`}</Text>

        {!isExpired && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{promo.code}</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <AppIcon name="copy-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Partie inférieure blanche/grise */}
      <View style={styles.infoZone}>
        <View style={styles.infoItem}>
          <AppIcon name="calendar-outline" size={20} color={isExpired ? '#9E9E9E' : Colors.bordeaux} />
          <Text style={[styles.infoText, isExpired && styles.expiredText]}>
            {promo.valid_until ? `Valide jusqu'au ${formatDate(promo.valid_until)}` : 'Permanent'}
          </Text>
        </View>
        <View style={[styles.infoItem, styles.statusItem]}>
          <AppIcon
            name={isExpired ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color={isExpired ? Colors.error : Colors.success}
          />
          <Text style={[styles.statusText, { color: isExpired ? Colors.error : Colors.success }]}>
            {isExpired ? 'Expiré' : 'Actif'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  expiredCard: {
    backgroundColor: '#F5F5F5',
  },
  promoZone: {
    padding: 16,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoName: {
    color: 'white',
    fontSize: 20,
    fontFamily: Fonts.bold, fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: 'white',
    fontFamily: Fonts.bold, fontWeight: 'bold',
  },
  promoDescription: {
    color: 'white',
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.9,
  },
  codeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.semibold, fontWeight: '600',
    letterSpacing: 1,
  },
  infoZone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: Colors.bordeaux,
  },
  expiredText: {
    color: '#9E9E9E',
  },
  statusItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: Fonts.bold, fontWeight: 'bold',
  },
});