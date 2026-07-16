import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClient } from '../../hooks/useClient';
import { SavingsSummaryCard } from '../../components/client/promo-codes/SavingsSummaryCard';
import { PromoCodeCard } from '../../components/client/promo-codes/PromoCodeCard';
import { Colors, Spacing, Fonts, Radius} from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';

export function PromoCodesScreen({}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    myActivePromoCodes,
    myExpiredPromoCodes,
    myTotalSavings,
    myActiveCount,
    isFetchingMyPromoCodes,
    fetchMyPromoCodes,
    myPromoCodesError,
  } = useClient();

  useEffect(() => {
    fetchMyPromoCodes();
  }, [fetchMyPromoCodes]);

  const onRefresh = () => {
    fetchMyPromoCodes();
  };

  const allPromoCodes = [
    ...myActivePromoCodes.map(p => ({ ...p, type: 'active' })),
    ...myExpiredPromoCodes.map(p => ({ ...p, type: 'expired' })),
  ];

  return (
    <View style={styles.container}>
      {/**Header */}
      <AppHeader left="back" title="Codes promo" />

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.headerCodePromo}>
              <Text style={styles.pageTitle}>Codes promo</Text>
              <Text style={styles.pageSubtitle}>{myActiveCount} code{myActiveCount > 1 ? 's' : ''} disponible{myActiveCount > 1 ? 's' : ''}</Text>
            </View>
            <View style={{ marginHorizontal: Spacing.sm, marginTop: Spacing.md }}>
              <SavingsSummaryCard totalSavings={myTotalSavings} />
              {myActivePromoCodes.length > 0 && (
                <Text style={[styles.sectionTitle, {marginTop: 24, marginHorizontal: 0}]}>Codes actifs</Text>
              )}
            </View>
          </>
        }
        data={allPromoCodes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Add a title for the "expired" section
          const isFirstExpired = item.type === 'expired' && (index === 0 || allPromoCodes[index - 1].type === 'active');
          return (
            <View style={{ marginHorizontal: Spacing.sm }}>
              {isFirstExpired && (
                 <Text style={[styles.sectionTitle, styles.expiredSectionTitle, {marginTop: 24, marginHorizontal: 0}]}>Codes expirés</Text>
              )}
              <PromoCodeCard promo={item} />
            </View>
          );
        }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: styles.scrollContent.paddingBottom + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={isFetchingMyPromoCodes} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isFetchingMyPromoCodes ? (
            <Text style={styles.emptyText}>Vous n'avez aucun code promo pour le moment.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 0,
  },
  headerCodePromo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.bordeaux,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  pageTitle: {
    fontSize: 25,
    fontFamily: Fonts.bold, fontWeight: 'bold',
    color: Colors.white,
  },
  pageSubtitle: {
    fontSize: 16,
    color: Colors.beige,
    marginTop: 4,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: Colors.error,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold, fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  expiredSectionTitle: {
    color: Colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: Colors.black,
  },
});