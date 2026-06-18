import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useAdmin } from '../../hooks/useAdmin';
import type { AdminDashboard, AdminDashboardPeriod, TopDriver, PopularRoute, PeakHourSlot } from '../../types';
import { Colors, Fonts, Radius, Spacing } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon'
const PERIOD_LABELS: Record<AdminDashboardPeriod, string> = {
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const PeriodSelector = ({
  period,
  onSelect,
}: {
  period: AdminDashboardPeriod;
  onSelect: (p: AdminDashboardPeriod) => void;
}) => (
  <View style={styles.periodSelector}>
    {(['week', 'month', 'year'] as AdminDashboardPeriod[]).map((p) => (
      <TouchableOpacity
        key={p}
        style={[styles.periodTab, period === p && styles.periodTabActive]}
        onPress={() => onSelect(p)}
      >
        <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
          {PERIOD_LABELS[p]}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const RevenueCard = ({ revenue }: { revenue: AdminDashboard['revenue'] }) => {
  // Affiche moins de labels si la liste est trop longue pour éviter le chevauchement (ex: vue annuelle)
  const labels = revenue.chart.length > 12
    ? revenue.chart.map((entry, index) => index % 2 === 0 ? entry.label : '')
    : revenue.chart.map(entry => entry.label);

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: revenue.chart.map(entry => entry.eur),
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        withShadow: true,
        strokeWidth: 2,
      },
    ],
  };

  // Affiche moins de labels si la liste est trop longue pour éviter le chevauchement
  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#FFD700', // Jaune doré pour un meilleur contraste
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <LinearGradient colors={['#8A3B3B', '#6B2D2D']} style={styles.revenueCard}>
      <Text style={styles.revenueTitle}>Chiffre d'affaires</Text>
      <Text style={styles.revenueValue}>{revenue.total_eur.toLocaleString('fr-FR')} €</Text>
      {revenue.trend_pct != null && (
        <View style={styles.trendRow}>
          <Ionicons name={revenue.trend_pct >= 0 ? 'arrow-up' : 'arrow-down'} size={16} color="#A7F3D0" />
          <Text style={styles.trendText}>
            {revenue.trend_pct >= 0 ? '+' : ''}
            {revenue.trend_pct.toFixed(1)} %
          </Text>
        </View>
      )}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - Spacing.md * 2} // Largeur de l'écran - padding
          height={150} // Hauteur augmentée pour une meilleure lisibilité
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
        />
      </View>
    </LinearGradient>
  );
};

const KpiCard = ({
  icon,
  value,
  label,
  subtitle,
  color,
  trend,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  subtitle?: string;
  color: string;
  trend?: number | null;
}) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    {trend != null && (
      <View style={[styles.trendRow, { justifyContent: 'flex-start', marginTop: 4 }]}>
        <Ionicons name={trend >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={trend >= 0 ? Colors.success : Colors.error} />
        <Text style={[styles.kpiTrend, { color: trend >= 0 ? Colors.success : Colors.error }]}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)} %
        </Text>
      </View>
    )}
  </View>
);

const CompletionRate = ({ trips }: { trips: AdminDashboard['trips'] }) => (
  <View style={styles.card}>
    <SectionHeader title="Taux de complétion" />
    <View style={styles.completionRow}>
      <View style={styles.completionStat}>
        <View style={styles.legendDotGreen} />
        <Text style={styles.completionLabel}>Terminées</Text>
        <Text style={styles.completionValue}>{trips.completed}</Text>
      </View>
      <View style={styles.completionStat}>
        <View style={styles.legendDotRed} />
        <Text style={styles.completionLabel}>Annulées</Text>
        <Text style={styles.completionValue}>{trips.cancelled}</Text>
      </View>
    </View>
    <View style={styles.progressBarTrack}>
      <View style={[styles.progressBarFill, { width: `${trips.completion_rate}%` }]} />
    </View>
    <Text style={styles.progressText}>{trips.completion_rate.toFixed(1)} % de réussite</Text>
  </View>
);

const TopDriversList = ({ drivers }: { drivers: TopDriver[] }) => (
  <View style={styles.card}>
    <SectionHeader title="Les meilleurs chauffeurs" />
    {drivers.map((driver, index) => (
      <View key={driver.driver_id} style={styles.driverRow}>
        <View style={styles.driverRank}>
          <Ionicons name={index === 0 ? 'trophy' : (index === 1 ? 'medal' : 'ribbon')} size={20} color={index === 0 ? '#FFD700' : (index === 1 ? '#C0C0C0' : '#CD7F32')} />
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.first_name} {driver.last_name}</Text>
          <Text style={styles.driverStats}>{driver.trip_count} courses · Note {driver.avg_rating?.toFixed(1) ?? 'N/A'}</Text>
        </View>
        <Text style={styles.driverRevenue}>{driver.revenue_eur.toLocaleString('fr-FR')} €</Text>
      </View>
    ))}
  </View>
);

const PopularRoutesList = ({ routes }: { routes: PopularRoute[] }) => (
  <View style={styles.card}>
    <SectionHeader title="Trajets populaires" />
    {routes.map((route, index) => (
      <View key={index} style={styles.routeRow}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeAddress} numberOfLines={1}>{route.dest_address}</Text>
        </View>
        <Text style={styles.routeCount}>{route.count} courses</Text>
      </View>
    ))}
  </View>
);

const PeakHoursChart = ({ hours }: { hours: PeakHourSlot[] }) => {
  const maxCount = Math.max(...hours.map(h => h.count), 1);
  return (
    <View style={styles.card}>
      <SectionHeader title="Heures de pointe" />
      {hours.map((hour) => (
        <View key={hour.slot} style={styles.peakHourRow}>
          <Text style={styles.peakHourLabel}>{hour.slot}</Text>
          <View style={styles.peakBarTrack}>
            <View style={[styles.peakBarFill, { width: `${(hour.count / maxCount) * 100}%` }]} />
          </View>
          <Text style={styles.peakHourCount}>{hour.count}</Text>
        </View>
      ))}
    </View>
  );
};

export default function AdminStatisticsScreen({ navigation }: any) {
  const { fetchDashboard } = useAdmin();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<AdminDashboardPeriod>('week');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboardData = await fetchDashboard(period);
        setData(dashboardData);
      } catch (e: any) {
        setError(e.message || 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period, fetchDashboard]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.openDrawer()}>
                <AppIcon name="menu" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Statistiques</Text>
              <View style={styles.headerBtn} />
            </View>

      <ScrollView style={styles.scrollContainer}>
        <PeriodSelector period={period} onSelect={setPeriod} />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.bordeaux} style={{ marginTop: 50 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : data && (
          <View style={styles.content}>
            <RevenueCard revenue={data.revenue} />

            <View style={styles.kpiGrid}>
              <KpiCard icon="car-sport-outline" value={String(data.trips.total)} label="Total des courses" color="#3B82F6" trend={data.trips.trend_pct} />
              <KpiCard icon="people-outline" value={String(data.clients.active)} label="Clients actifs" subtitle={`sur ${data.clients.total}`} color="#8B5CF6" />
              <KpiCard icon="speedometer-outline" value={String(data.drivers.active)} label="Chauffeurs actifs" subtitle={`sur ${data.drivers.total}`} color="#10B981" />
              <KpiCard icon="star-outline" value={data.avg_rating?.toFixed(1) ?? 'N/A'} label="Note moyenne" color="#F59E0B" />
            </View>

            <CompletionRate trips={data.trips} />

            <TopDriversList drivers={data.top_drivers} />

            <PopularRoutesList routes={data.popular_routes} />

            <PeakHoursChart hours={data.peak_hours} />

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background ?? '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
    headerBtn:   { padding: Spacing.sm, width: 40 },
    headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },

  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    margin: Spacing.md,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: Colors.bordeaux,
  },
  periodText: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.white,
  },
  revenueCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  revenueTitle: {
    color: Colors.white,
    fontSize: Fonts.size.md,
    opacity: 0.9,
  },
  revenueValue: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginVertical: Spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    color: '#A7F3D0',
    fontSize: Fonts.size.md,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg, // Compense le padding de la carte pour aligner le graphique
  },
  chartStyle: {
    paddingRight: 30, // Espace à droite pour éviter que le dernier label soit coupé
    paddingTop: 15,
    paddingBottom: Spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -Spacing.xs,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kpiSubtitle: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  kpiTrend: {
    fontSize: Fonts.size.xs,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  completionStat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  legendDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  completionLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  completionValue: { fontSize: Fonts.size.md, fontWeight: 'bold', color: Colors.textPrimary },
  progressBarTrack: {
    height: 12,
    backgroundColor: Colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  progressText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: Fonts.size.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  driverRank: {
    width: 30,
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  driverName: {
    fontSize: Fonts.size.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  driverStats: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  driverRevenue: {
    fontSize: Fonts.size.md,
    fontWeight: 'bold',
    color: Colors.bordeaux,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  routeInfo: {
    flex: 1
  },
  routeAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  routeCount: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  peakHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  peakHourLabel: {
    width: 60,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  peakBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  peakBarFill: {
    height: '100%',
    backgroundColor: Colors.bordeauxLight,
  },
  peakHourCount: {
    width: 40,
    textAlign: 'right',
    fontSize: Fonts.size.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.error,
    margin: Spacing.lg,
  },
});