import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAdmin } from '../../hooks/useAdmin';
import CustomCalendarModal from '../../components/common/CustomCalendarModal';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { PromoCode, ClientSummary, DiscountType, CampaignType, CreateCampaignDto, MarketingCampaign } from '../../types';
import { useToast } from '../../hooks/useToast';

const TAB_ITEMS = [
  { key: 'promo', label: 'Codes promo' },
  { key: 'clients', label: 'Base clients' },
  { key: 'campaigns', label: 'Campagnes' },
] as const;

const CANAL = {
  email: { key: 'email', label: 'Email' , icon: 'mail-outline' as const},
  sms: { key: 'sms', label: 'SMS' , icon: 'chatbubble-ellipses-outline' as const},
  push: { key: 'push', label: 'Push' , icon: 'notifications-outline' as const},
};

type TabKey = typeof TAB_ITEMS[number]['key'];

type PromoFormValues = {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  valid_until: string;
  max_uses: string;
  min_order_amount: string;
};

const promoFormSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.preprocess(
    (value) => Number(String(value).replace(',', '.')),
    z.number().positive('La valeur doit être positive'),
  ),
  valid_until: z.string().optional(),
  max_uses: z.string().optional(),
  min_order_amount: z.string().optional(),
});

type CampaignFormValues = {
  name: string;
  type: CampaignType;
  subject: string;
  body: string;
};

const campaignFormSchema = z.object({
  name: z.string().min(3, 'Le nom doit faire au moins 3 caractères.'),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string().optional(),
  body: z.string().min(10, 'Le corps du message doit faire au moins 10 caractères.'),
}).refine(data => data.type !== 'email' || (data.subject && data.subject.length > 0), { message: 'L\'objet est requis pour un email.', path: ['subject'] });

export default function AdminPromoCommunicationScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const {
    promoCodes,
    isPromoCodesLoading, isPromoCodesSaving, promoCodesError,
    marketingClients, marketingStats, campaigns, campaignsPage, campaignsTotalPages,
    isMarketingLoading, isFetchingNextMarketingPage, marketingError,
    fetchPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    clearPromoCodesError,
    createCampaign,
    fetchCampaigns,
    fetchMarketingClients,
    clearMarketingError,
    fetchAdminClients,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabKey>('promo');
  const [searchClients, setSearchClients] = useState('');
  const [activeClientFilter, setActiveClientFilter] = useState<'all' | 'email' | 'sms' | 'push'>('all');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isCampaignModalVisible, setCampaignModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PromoFormValues>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      code: '',
      discount_type: 'percent',
      discount_value: '0',
      valid_until: '',
      max_uses: '',
      min_order_amount: '',
    },
  });

  const validUntilValue = watch('valid_until');

  const {
    control: campaignControl,
    handleSubmit: handleCampaignSubmit,
    reset: resetCampaignForm,
    formState: { errors: campaignErrors, isSubmitting: isCampaignSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: { name: '', type: 'email', subject: '', body: '' },
  });


  useEffect(() => {
    if (activeTab === 'promo') fetchPromoCodes({ page: 1, limit: 20 });
    if (activeTab === 'clients') fetchMarketingClients({ page: 1, limit: 20 });
    if (activeTab === 'campaigns') fetchCampaigns(1, 20);
  }, [activeTab, fetchPromoCodes, fetchMarketingClients]);

  useEffect(() => {
    if (promoCodesError) {
      showToast({ title:'Erreur', message : `Erreur promo codes ${promoCodesError}`, type: 'error' });
      clearPromoCodesError();
    }
  }, [promoCodesError, clearPromoCodesError]);

  useEffect(() => {
    if (marketingError) {
      showToast({ title:'Erreur', message: `Erreur clients: ${marketingError}`, type: 'error' });
      clearMarketingError();
    }
  }, [marketingError, clearMarketingError]);

  const filteredClients = useMemo(
    () => marketingClients.filter((client : ClientSummary) => {
      const query = searchClients.trim().toLowerCase();
      const matchesSearch = !query || [client.first_name, client.last_name, client.email || '']
        .some((value) => value.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (activeClientFilter === 'email') return client.marketing_email_opt_in;
      if (activeClientFilter === 'sms') return client.marketing_sms_opt_in;
      if (activeClientFilter === 'push') return client.marketing_push_opt_in;
      return true;
    }),
    [marketingClients, searchClients, activeClientFilter],
  );

  const onChangeTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, [fetchPromoCodes, fetchAdminClients, searchClients]);

  const openCreatePromoModal = useCallback(() => {
    setEditingPromo(null);
    reset({ code: '', discount_type: 'percent', discount_value: '0', valid_until: '', max_uses: '', min_order_amount: '' });
    setModalVisible(true);
  }, [reset]);

  const openEditPromoModal = useCallback((promo: PromoCode) => {
    setEditingPromo(promo);
    // Extraire la date YYYY-MM-DD de valid_until (ISO string)
    const dateOnly = promo.valid_until ? promo.valid_until.split('T')[0] : '';
    reset({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      valid_until: dateOnly,
      max_uses: promo.max_uses !== null ? String(promo.max_uses) : '',
      min_order_amount: promo.min_order_amount !== null ? String(promo.min_order_amount) : '',
    });
    setModalVisible(true);
  }, [reset]);

  const handleSavePromo = useCallback(async (values: PromoFormValues) => {
    try {
      // Convertir la date YYYY-MM-DD en ISO 8601 datetime
      const toIsoDateTime = (dateStr: string) => dateStr ? `${dateStr}T00:00:00Z` : undefined;
      
      const dto = {
        code: values.code.trim(),
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value),
        max_uses: values.max_uses ? Number(values.max_uses) : undefined,
        min_order_amount: values.min_order_amount ? Number(values.min_order_amount) : undefined,
      };

      if (editingPromo) {
        await updatePromoCode(editingPromo.id, dto);
        showToast({ title: 'Succès', message: 'Code promo mis à jour.', type: 'success' });
      } else {
        await createPromoCode(dto);
        showToast({ title: 'Succès', message: 'Nouveau code promo créé.', type: 'success' });
      }

      setModalVisible(false);
      fetchPromoCodes({ page: 1, limit: 20 });
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de sauvegarder le code promo.', type: 'error' });
    }
  }, [createPromoCode, editingPromo, fetchPromoCodes, updatePromoCode]);

  const handleDeletePromo = useCallback((promo: PromoCode) => {
    Alert.alert(
      'Supprimer le code promo',
      `Êtes-vous sûr de supprimer ${promo.code} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePromoCode(promo.id);
              showToast({ title: 'Supprimé', message: 'Le code promo a bien été supprimé.', type: 'success' });
            } catch (error: any) {
              showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de supprimer.', type: 'error' });
            }
          },
        },
      ],
    );
  }, [deletePromoCode]);

  const handleTogglePromoStatus = useCallback(async (promo: PromoCode, nextValue: boolean) => {
    try { // La mise à jour du statut se fait via updatePromoCode
      await updatePromoCode(promo.id, { is_active: nextValue });
    } catch (error: any) { // Affiche une erreur si l'API échoue
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de mettre à jour le statut.', type: 'error' });
    }
  }, [updatePromoCode]);

  const loadMoreCampaigns = useCallback(() => {
    if (isMarketingLoading || isFetchingNextMarketingPage || campaignsPage >= campaignsTotalPages) return;
    fetchCampaigns(campaignsPage + 1);
  }, [isMarketingLoading, isFetchingNextMarketingPage, campaignsPage, campaignsTotalPages, fetchCampaigns]);

  const openCreateCampaignModal = useCallback(() => {
    resetCampaignForm({ name: '', type: 'email', subject: '', body: '' });
    setCampaignModalVisible(true);
  }, [resetCampaignForm]);

  const handleSaveCampaign = useCallback(async (values: CampaignFormValues) => {
    try {
      await createCampaign(values as CreateCampaignDto);
      showToast({ title: 'Succès', message: 'Campagne créée en tant que brouillon.', type: 'success' });
      setCampaignModalVisible(false); // Re-fetch campaigns list when available
      // TODO: Re-fetch campaigns list when available
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de créer la campagne.', type: 'error' });
    }
  }, [createCampaign, showToast]);

  const renderPromoCard = (promo: PromoCode) => {
    const now = new Date();
    const expired = promo.valid_until ? new Date(promo.valid_until) < now : false;
    const statusLabel = !promo.is_active ? 'Inactif' : expired ? 'Expiré' : 'Actif';
    const statusColor = !promo.is_active ? Colors.textSecondary : expired ? Colors.error : Colors.success;
    const discountLabel = promo.discount_type === 'percent'
      ? `-${promo.discount_value}%`
      : `-${promo.discount_value} €`;

    return (
      <View key={promo.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.promoHeaderLeft}>
            <View style={styles.promoIcon}>
              <AppIcon name="pricetag-outline" size={20} color={Colors.white} />
            </View>
            <View style={styles.promoHeaderText}>
              <Text style={styles.promoName}>{promo.code}</Text>
              <Text style={styles.promoValue}>{discountLabel}</Text>
            </View>
          </View>
          <Switch
            value={promo.is_active}
            onValueChange={(value) => handleTogglePromoStatus(promo, value)}
            trackColor={{ false: Colors.background, true: Colors.bordeauxLight }}
            thumbColor={promo.is_active ? Colors.white : Colors.surface}
          />
        </View>

        <Text style={styles.promoCondition}>
          Condition : {promo.min_order_amount ? `Montant min ${promo.min_order_amount} €` : 'Aucune'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statsBox}>
            <Text style={styles.statsValue}>{promo.uses_count}/{promo.max_uses ?? '∞'}</Text>
            <Text style={styles.statsLabel}>Utilisations</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsValue}>{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString('fr-FR') : '—'}</Text>
            <Text style={styles.statsLabel}>Expiration</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={[styles.statsValue, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={styles.statsLabel}>Statut</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openEditPromoModal(promo)}>
            <AppIcon name="create-outline" size={18} color={Colors.bordeaux} />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteAction]} onPress={() => handleDeletePromo(promo)}>
            <AppIcon name="trash-outline" size={18} color={Colors.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCampaignCard = ({ item }: { item: MarketingCampaign }) => {
    const isDraft = item.status === 'draft';
    return (
      <View style={styles.campaignCard}>
        <View style={styles.campaignHeader}>
          <View style={styles.campaignIcon}><AppIcon name={CANAL[item.type].icon} size={22} color={Colors.white} /></View>
          <View style={styles.campaignTitleGroup}>
            <Text style={styles.campaignName}>{item.name}</Text>
            <Text style={styles.campaignMeta}>{CANAL[item.type].label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDraft ? '#F5A623' : '#4A90E2' }]}>
            <Text style={styles.statusBadgeText}>{isDraft ? 'Brouillon' : 'Envoyée'}</Text>
          </View>
        </View>
        {isDraft ? (
          <>
            <Text style={styles.campaignDraftText}>Cette campagne n'a pas encore été envoyée.</Text>
            <View style={styles.campaignActionsRow}>
              <TouchableOpacity style={styles.campaignTextButton} onPress={() => showToast({ title: 'Envoyer maintenant', message: 'Fonctionnalité à venir', type: 'info' })}>
                <Text style={styles.campaignTextButtonText}>Envoyer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.campaignTextButton} onPress={() => showToast({ title: 'Voir brouillon', message: 'Fonctionnalité à venir', type: 'info' })}>
                <Text style={styles.campaignTextButtonText}>Voir</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.campaignMetricsRow}>
              <View style={styles.campaignMetric}><Text style={styles.campaignMetricValue}>{item.sent_count}</Text><Text style={styles.campaignMetricLabel}>Envois</Text></View>
              <View style={styles.campaignMetric}><Text style={styles.campaignMetricValue}>{item.open_rate}%</Text><Text style={styles.campaignMetricLabel}>Ouverture</Text></View>
              <View style={styles.campaignMetric}><Text style={styles.campaignMetricValue}>{item.click_rate}%</Text><Text style={styles.campaignMetricLabel}>Clic</Text></View>
            </View>
            <TouchableOpacity style={styles.campaignActionButton} onPress={() => showToast({ title: 'Détails campagne', message: 'Fonctionnalité à venir', type: 'info' })}>
              <Text style={styles.campaignActionText}>Voir les détails</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promo & Communication</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.tabBar}>
        {TAB_ITEMS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active ? styles.tabActive : styles.tabInactive]}
              onPress={() => onChangeTab(tab.key)}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'promo' ? 'Codes promotionnels' : activeTab === 'clients' ? 'Base clients' : 'Campagnes marketing'}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => activeTab === 'promo' ? openCreatePromoModal() : openCreateCampaignModal()}
          >
            <AppIcon name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {activeTab === 'promo' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {isPromoCodesLoading ? (
              <ActivityIndicator size="large" color={Colors.bordeaux} style={styles.loader} />
            ) : promoCodes.length === 0 ? (
              <Text style={styles.emptyText}>Aucun code promo n'est disponible.</Text>
            ) : (
              promoCodes.map(renderPromoCard)
            )}
          </ScrollView>
        )}

        {activeTab === 'clients' && (
          <ScrollView showsVerticalScrollIndicator={false}> 
            <View style={styles.statsGrid}>
              <View style={[styles.kpiCardClient , styles.kpiCard]}>
                <View style={styles.kpiIcon}><AppIcon name="people-outline" size={20} color={Colors.white} /></View>
                <Text style={styles.kpiValue}>{marketingStats?.total_clients ?? 0}</Text>
                <Text style={styles.kpiLabel}>Total Clients</Text>
              </View>
              <View style={[styles.kpiCardEmail , styles.kpiCard]}>
                <View style={styles.kpiIcon}><AppIcon name="mail-outline" size={20} color={Colors.white} /></View>
                <Text style={styles.kpiValue}>{marketingStats?.opt_in_email ?? 0}</Text>
                <Text style={styles.kpiLabel}>Opt-in Email</Text>
              </View>
              <View style={[styles.kpiCardChat , styles.kpiCard]}>
                <View style={styles.kpiIcon}><AppIcon name="chatbubble-ellipses-outline" size={20} color={Colors.white} /></View>
                <Text style={styles.kpiValue}>{marketingStats?.opt_in_sms ?? 0}</Text>
                <Text style={styles.kpiLabel}>Opt-in SMS</Text>
              </View>
              <View style={[styles.kpiCardNotif , styles.kpiCard]}>
                <View style={styles.kpiIcon}><AppIcon name="notifications-outline" size={20} color={Colors.white} /></View>
                <Text style={styles.kpiValue}>{marketingStats?.opt_in_push ?? 0}</Text>
                <Text style={styles.kpiLabel}>Opt-in Push</Text>
              </View>
            </View>

            <View style= {styles.filterContent}>
                <View style={styles.searchWrapper}>
                  <TextInput
                    placeholder="Recherche par nom, prénom, email, téléphone"
                    placeholderTextColor={'#9CA3AF'}
                    style={styles.searchInput}
                    value={searchClients}
                    onChangeText={setSearchClients}
                    onSubmitEditing={() => fetchMarketingClients({ page: 1, limit: 20, search: searchClients || undefined })}
                  />
                </View>

                <View style={styles.filterRow}>
                  {(['all', 'email', 'sms', 'push'] as const).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterChip, activeClientFilter === filter && styles.filterChipActive]}
                      onPress={() => setActiveClientFilter(filter)}
                    >
                      <Text style={[styles.filterText, activeClientFilter === filter && styles.filterTextActive]}>
                        {filter === 'all' ? 'Tous' : filter.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
            </View>

            {isMarketingLoading ? (
              <ActivityIndicator size="large" color={Colors.bordeaux} style={styles.loader} />
            ) : filteredClients.length === 0 ? (
              <Text style={styles.emptyText}>Aucun client trouvé.</Text>
            ) : (
              filteredClients.map((client) => (
                <View key={client.id} style={styles.clientCard}>
                  <View style={styles.clientInfoRow}>
                    <View style={styles.clientAvatar}><AppIcon name="person-outline" size={20} color={Colors.white} /></View>
                    <View style={styles.clientTextGroup}>
                      <Text style={styles.clientName}>{client.first_name} {client.last_name}</Text>
                      <Text style={styles.clientEmail}>{client.email}</Text>
                    </View>
                    <TouchableOpacity style={styles.clientActionButton} onPress={() => showToast({ title: 'Détails client', message: 'Fonctionnalité de fiche client à venir', type: 'info' })}>
                      <Text style={styles.clientActionText}>Voir</Text>
                      <AppIcon name="eye-outline" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.clientStatsRow}>
                    <View style={styles.clientStatItem}>
                      <Text style={styles.clientStatValue}>{client.total_rides}</Text>
                      <Text style={styles.clientStatLabel}>Courses</Text>
                    </View>
                    <View style={styles.clientStatItem}>
                      <Text style={styles.clientStatValue}>{client.total_spent.toFixed(0)} €</Text>
                      <Text style={styles.clientStatLabel}>Dépensé</Text>
                    </View>
                    <View style={styles.clientStatItem}>
                      <Text style={styles.clientStatValue}>{client.last_ride_date ? new Date(client.last_ride_date).toLocaleDateString('fr-FR') : 'Aucune'}</Text>
                      <Text style={styles.clientStatLabel}>Dernière activité</Text>
                    </View>
                  </View>

                  <View style={styles.badgesRow}>
                    {client.marketing_email_opt_in && <View style={styles.badge}><AppIcon name={CANAL.email.icon} size={12} color={Colors.textSecondary} /><Text style={styles.badgeText}>{CANAL.email.label}</Text></View>}
                    {client.marketing_sms_opt_in && <View style={styles.badge}><AppIcon name={CANAL.sms.icon} size={12} color={Colors.textSecondary} /><Text style={styles.badgeText}>{CANAL.sms.label}</Text></View>}
                    {client.marketing_push_opt_in && <View style={styles.badge}><AppIcon name={CANAL.push.icon} size={12} color={Colors.textSecondary} /><Text style={styles.badgeText}>{CANAL.push.label}</Text></View>}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {activeTab === 'campaigns' && (
          isMarketingLoading && campaigns.length === 0 ? (
            <ActivityIndicator size="large" color={Colors.bordeaux} style={styles.loader} />
          ) : (
            <FlatList
              data={campaigns}
              renderItem={renderCampaignCard}
              keyExtractor={(item) => item.id}
              onEndReached={loadMoreCampaigns}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucune campagne trouvée.</Text>}
              ListFooterComponent={isFetchingNextMarketingPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} /> : null}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingPromo ? 'Modifier un code promo' : 'Nouveau code promo'}</Text>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Code</Text>
                <Controller
                  control={control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.fieldInput}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="EXAMPLE20"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  )}
                />
                {errors.code && <Text style={styles.errorText}>{errors.code.message}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Type de réduction</Text>
                <Controller
                  control={control}
                  name="discount_type"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.toggleRow}>
                      {(['percent', 'fixed'] as const).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.toggleButton, value === type && styles.toggleButtonActive]}
                          onPress={() => onChange(type)}
                        >
                          <Text style={[styles.toggleButtonText, value === type && styles.toggleButtonTextActive]}>
                            {type === 'percent' ? '% Pourcentage' : '€ Fixe'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Montant</Text>
                <Controller
                  control={control}
                  name="discount_value"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.fieldInput}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="10"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.discount_value && <Text style={styles.errorText}>{errors.discount_value.message}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date d'expiration</Text>
                <Controller
                  control={control}
                  name="valid_until"
                  render={({ field: { value } }) => (
                    <>
                      <TouchableOpacity
                        style={styles.fieldInput}
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.fieldInputText, !value && styles.fieldPlaceholder]}>
                          {value || 'YYYY-MM-JJ'}
                        </Text>
                      </TouchableOpacity>
                      <CustomCalendarModal
                        visible={isCalendarVisible}
                        selectedDate={value || null}
                        onConfirm={(date) => {
                          setValue('valid_until', date, { shouldValidate: true, shouldDirty: true });
                          setCalendarVisible(false);
                        }}
                        onCancel={() => setCalendarVisible(false)}
                      />
                    </>
                  )}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Utilisations max</Text>
                  <Controller
                    control={control}
                    name="max_uses"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.fieldInput}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Illimité"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Montant min</Text>
                  <Controller
                    control={control}
                    name="min_order_amount"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.fieldInput}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, isPromoCodesSaving && styles.modalSaveButtonDisabled]}
                  onPress={handleSubmit(handleSavePromo)}
                  disabled={isPromoCodesSaving}
                >
                  {isPromoCodesSaving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.modalSaveText}>{editingPromo ? 'Mettre à jour' : 'Créer'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isCampaignModalVisible} animationType="slide" transparent onRequestClose={() => setCampaignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Campagne</Text>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nom de la campagne</Text>
                <Controller
                  control={campaignControl}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.fieldInput}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Ex: Offre de Pâques"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  )}
                />
                {campaignErrors.name && <Text style={styles.errorText}>{campaignErrors.name.message}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Canal</Text>
                <Controller
                  control={campaignControl}
                  name="type"
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.toggleRow}>
                      {(['email', 'sms', 'push'] as const).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.toggleButton, value === type && styles.toggleButtonActive]}
                          onPress={() => onChange(type)}
                        >
                          <Text style={[styles.toggleButtonText, value === type && styles.toggleButtonTextActive]}>
                            {CANAL[type].label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Objet du message</Text>
                <Controller
                  control={campaignControl}
                  name="subject"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.fieldInput}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Ex: -20% sur votre prochaine course !"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  )}
                />
                {campaignErrors.subject && <Text style={styles.errorText}>{campaignErrors.subject.message}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Contenu du message</Text>
                <Controller
                  control={campaignControl}
                  name="body"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.fieldInput, { height: 120, textAlignVertical: 'top' }]}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Bonjour {first_name}, profitez de..."
                      placeholderTextColor={Colors.textSecondary}
                      multiline
                    />
                  )}
                />
                {campaignErrors.body && <Text style={styles.errorText}>{campaignErrors.body.message}</Text>}
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setCampaignModalVisible(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveButton, isCampaignSubmitting && styles.modalSaveButtonDisabled]} onPress={handleCampaignSubmit(handleSaveCampaign)} disabled={isCampaignSubmitting}>
                  {isCampaignSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalSaveText}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.xl + 8,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bordeaux,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
     borderRadius: Radius.md,
     elevation : 1,
  },
  tabItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    elevation : 1,

  },
  tabActive: {
    backgroundColor: Colors.bordeaux,
  },
  tabInactive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.medium,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabTextInactive: {
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    elevation : 1,
    height : '100%',
    backgroundColor : Colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.lg,
    fontFamily: Fonts.bold,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bordeaux,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: Spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.regular,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  promoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  promoHeaderText: {
    flex: 1,
  },
  promoName: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold,
  },
  promoValue: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  promoCondition: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  statsBox: {
    flex: 1,
    alignItems: 'center',
  },
  statsValue: {
    color: Colors.bordeaux,
    fontWeight: 'bold',
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold,
  },
  statsLabel: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
  },
  deleteAction: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  actionText: {
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontFamily: Fonts.medium,
  },
  deleteText: {
    color: Colors.error,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  kpiCard: {
    width: '48%',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  kpiCardClient: {
    backgroundColor: Colors.bordeaux,
  },
  kpiCardNotif: {
    backgroundColor: '#A855F7',
  },
  kpiCardEmail: {
    backgroundColor: '#2563EB',
  },
  kpiCardChat: {
    backgroundColor: '#22C55E',
  },
  kpiIcon: { 
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    color: Colors.white,
    fontSize: Fonts.size.xxl,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  kpiLabel: {
    color: Colors.white,
    fontSize: Fonts.size.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  searchWrapper: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2 ,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    elevation: 1,
  },
  filterContent : {
    backgroundColor : Colors.white,
    elevation : 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  filterChip: {
    elevation : 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#F9FAFB',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.bordeaux,
  },
  filterText: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.xs,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  clientCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 1,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bordeaux,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  clientTextGroup: {
    flex: 1,
  },
  clientName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
  },
  clientEmail: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
  },
  clientActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bordeauxLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    opacity: 0.8,
  },
  clientActionText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontWeight: '500',
  },
  clientStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  clientStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  clientStatValue: {
    color: Colors.bordeaux,
    fontWeight : 'bold',
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold,
  },
  clientStatLabel: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
    marginTop: Spacing.sm,
    flexDirection: 'row', gap: 4, alignItems: 'center'
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
  },
  campaignCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  campaignIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  campaignTitleGroup: {
    flex: 1,
  },
  campaignName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
  },
  campaignMeta: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: Fonts.size.xs,
  },
  statusBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: Fonts.size.xs,
    fontFamily: Fonts.bold,
  },
  campaignMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  campaignMetric: {
    alignItems: 'center',
    flex: 1,
  },
  campaignMetricValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
  },
  campaignMetricLabel: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  campaignActionButton: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  campaignActionText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
  },
  campaignDraftText: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  campaignActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  campaignTextButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  campaignTextButtonText: {
    color: Colors.bordeaux,
    fontFamily: Fonts.medium,

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalScroll: {
    paddingBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Fonts.size.lg,
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.medium,
  },
  fieldInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    elevation : 1,
  },
  fieldInputText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  fieldPlaceholder: {
    color: Colors.textSecondary,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.bordeaux,
  },
  toggleButtonText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bordeaux,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  modalCancelText: {
    color: Colors.bordeaux,
    fontFamily: Fonts.medium,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
  },
  errorText: {
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
