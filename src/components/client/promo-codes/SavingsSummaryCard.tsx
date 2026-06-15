import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../common/AppIcon';
import { Colors } from '../../../theme/colors';

interface SavingsSummaryCardProps {
  totalSavings: number;
}

export function SavingsSummaryCard({ totalSavings }: SavingsSummaryCardProps) {
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[Colors.bordeaux, Colors.bordeauxLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View>
          <Text style={styles.title}>Économies totales</Text>
          <Text style={styles.amount}>{totalSavings}€</Text>
          <Text style={styles.subtitle}>Depuis votre inscription</Text>
        </View>
        <AppIcon name="ticket-outline" size={48} color="white" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
  },
  title: {
    color: 'white',
    fontSize: 16,
  },
  amount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
});