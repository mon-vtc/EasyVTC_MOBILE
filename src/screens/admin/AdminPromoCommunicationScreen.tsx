import React, { useCallback, useEffect, useMemo, useState , useRef} from 'react';
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
  FlatList as RNFlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAdmin } from '../../hooks/useAdmin';
import CustomCalendarModal from '../../components/common/CustomCalendarModal';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { PromoCode, ClientSummary, DiscountType, CampaignType, CreateCampaignDto, MarketingCampaign, ClientWithStats, BulkAssignDto, CreatePromoCodeDto, ClientBaseFilters } from '../../types';
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

const PROMO_MODES = [
  { key: 'public', label: 'Public', icon: 'barcode-outline'},
  { key: 'single', label: '1 client', icon: 'person-outline'},
  { key: 'bulk',   label: 'multi-clients', icon: 'people-outline'},
] as const;
type PromoCreationMode = typeof PROMO_MODES[number]['key'];

type TabKey = typeof TAB_ITEMS[number]['key'];

type PromoFormValues = CreatePromoCodeDto;

const promoFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(3, 'Le nom est requis (3 caractères min).'),
  description: z.string().optional(),
  code_radical: z.string().optional(),
  assigned_user_id: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().positive('La valeur doit être positive'),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  max_uses: z.number().optional(),
  max_uses_per_user: z.number().optional(),
  min_order_amount: z.number().optional(),
  condition_label: z.string().optional(),
  condition_type: z.enum(['none', 'pickup_location']).optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  pickup_radius_meters: z.number().optional(),
}).refine(
  (d) => {
    if (d.assigned_user_id) return !!d.code_radical;
    return !!d.code;
  },
  (d) => d.assigned_user_id
    ? { message: 'Le radical est requis.', path: ['code_radical'] }
    : { message: 'Le code est requis.', path: ['code'] },
);

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
    marketingClientPage, marketingClientTotalPages,
    createPromoCode,
    updatePromoCode,
    bulkAssignPromoCode,
    deletePromoCode,
    clearPromoCodesError,
    
    createCampaign,
    fetchCampaigns,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
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
  const [isClientSelectorVisible, setClientSelectorVisible] = useState(false);
  const [promoCreationMode, setPromoCreationMode] = useState<PromoCreationMode>('public');
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [selectedClients, setSelectedClients] = useState<ClientWithStats[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const { clients: allClients, fetchAdminClients: fetchAllClients } = useAdmin();
  const [calendarTarget, setCalendarTarget] = useState<'valid_from' | 'valid_until'>('valid_until');
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
      name: '',
      description: '',
      code_radical: '',
      assigned_user_id: '',
      discount_type: 'percent',
      discount_value: undefined,
      valid_from: '',
      valid_until: '',
      max_uses: undefined,
      max_uses_per_user: undefined,
      min_order_amount: undefined,
      condition_label: '',
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
    if (isClientSelectorVisible) {
      fetchAllClients({ search: clientSearchQuery, limit: 50 });
    }
  }, [isClientSelectorVisible, clientSearchQuery, fetchAllClients]);

  useEffect(() => {
    if (activeTab === 'promo') fetchPromoCodes({ page: 1, limit: 20 });
    if (activeTab === 'campaigns') fetchCampaigns(1, 20);
  }, [activeTab, fetchPromoCodes, fetchCampaigns]);

  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    if (activeTab !== 'clients') return;
    isInitialLoadDone.current = false; // reset à chaque changement de filtre

    const filters: ClientBaseFilters = { page: 1, limit: 20 };
    const trimmed = searchClients.trim();
    if (trimmed) filters.search = trimmed;
    if (activeClientFilter !== 'all') filters.consent = activeClientFilter;

    fetchMarketingClients(filters).finally(() => {
      isInitialLoadDone.current = true;
    });
  }, [activeTab, searchClients, activeClientFilter, fetchMarketingClients]);
  
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

  const loadMoreClients = useCallback(() => {
    if (!isInitialLoadDone.current) return;
    if (isMarketingLoading || isFetchingNextMarketingPage || marketingClientPage >= marketingClientTotalPages) {
      return;
    }

    const nextPage = marketingClientPage + 1;
    const filters: ClientBaseFilters = { page: nextPage, limit: 20 };

    const trimmed = searchClients.trim();
    if (trimmed) filters.search = trimmed;
    if (activeClientFilter !== 'all') filters.consent = activeClientFilter;

    fetchMarketingClients(filters);
  }, [isMarketingLoading, isFetchingNextMarketingPage, marketingClientPage, marketingClientTotalPages, fetchMarketingClients, searchClients, activeClientFilter]);

  const onChangeTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, [fetchPromoCodes, fetchAdminClients, searchClients]);

  const openCreatePromoModal = useCallback(() => {
    setEditingPromo(null);
    setPromoCreationMode('public');
    setSelectedClients([]);
    reset({
      code: '',
      name: '',
      description: '',
      code_radical: '',
      assigned_user_id: '',
      discount_type: 'percent',
      discount_value: 0,
      valid_from: '',
      valid_until: '',
      max_uses: undefined,
      max_uses_per_user: undefined,
      min_order_amount: undefined,
      condition_label: '',
    });
    setModalVisible(true);
  }, [reset]);

  const openEditPromoModal = useCallback((promo: PromoCode) => {
    setEditingPromo(promo);
    const validFromDate = promo.valid_from ? promo.valid_from.split('T')[0] : '';
    const validUntilDate = promo.valid_until ? promo.valid_until.split('T')[0] : '';
    reset({
      code: promo.code ?? '',
      name: promo.name ?? '',
      description: promo.description ?? '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      valid_from: validFromDate,
      valid_until: validUntilDate,
      max_uses: promo.max_uses ?? undefined,
      min_order_amount: promo.min_order_amount ?? undefined,
    });
    setModalVisible(true);
  }, [reset]);

  const handleSavePromo = useCallback(async (values: PromoFormValues) => {
    try {
      const toIsoDateTime = (dateStr: string) => dateStr ? `${dateStr}T00:00:00Z` : undefined;

      const cleanedValues = { ...values };
      (Object.keys(cleanedValues) as Array<keyof PromoFormValues>).forEach(key => {
        const val = cleanedValues[key];
        if (val === '' || val === 0) {
          (cleanedValues as any)[key] = undefined;
        } else if (typeof val === 'string') {
          (cleanedValues as any)[key] = val.trim();
        }
      });
      
      const dto: CreatePromoCodeDto = {
        ...cleanedValues,
        code: cleanedValues.code?.trim().toUpperCase(),
        name: cleanedValues.name?.trim(),
        assigned_user_id: undefined,
        valid_from: toIsoDateTime(cleanedValues.valid_from || ''),
        valid_until: toIsoDateTime(cleanedValues.valid_until || ''),
      };

      if (editingPromo) {
        await updatePromoCode(editingPromo.id, dto);
        showToast({ title: 'Succès', message: 'Code promo mis à jour.', type: 'success' });
      } else if (promoCreationMode === 'public') {
        console.log(dto);
        await createPromoCode(dto);
        showToast({ title: 'Succès', message: 'Nouveau code promo public créé.', type: 'success' });
      } else if (promoCreationMode === 'single' && selectedClients.length === 1) {
        console.log(dto);
        dto.assigned_user_id = selectedClients[0].id;
        await createPromoCode(dto);
        showToast({ title: 'Succès', message: `Code assigné à ${selectedClients[0].first_name}.`, type: 'success' });
      } else if (promoCreationMode === 'bulk' && selectedClients.length > 0) {
        const templateDto: CreatePromoCodeDto = {
          ...dto,
          code: undefined,
          assigned_user_id: selectedClients[0].id,
        };
        const template = await createPromoCode(templateDto);
        if (!template) throw new Error('Impossible de créer le template.');
      
        const bulkDto: BulkAssignDto = {
          user_ids: selectedClients.map(c => c.id),
        };
        await bulkAssignPromoCode(template.id, bulkDto);
        showToast({ 
          title: 'Succès', 
          message: `${selectedClients.length} codes générés et assignés.`, 
          type: 'success' 
        });
      } else {
        showToast({ title: 'Action requise', message: 'Veuillez sélectionner un ou plusieurs clients.', type: 'info' });
        return;
      }

      setModalVisible(false);
      fetchPromoCodes({ page: 1, limit: 20 });
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de sauvegarder le code promo.', type: 'error' });
    }
  }, [createPromoCode, editingPromo, fetchPromoCodes, updatePromoCode, promoCreationMode, selectedClients, bulkAssignPromoCode, showToast]);

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
    try {
      await updatePromoCode(promo.id, { is_active: nextValue });
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de mettre à jour le statut.', type: 'error' });
    }
  }, [updatePromoCode]);

  const loadMoreCampaigns = useCallback(() => {
    if (isMarketingLoading || isFetchingNextMarketingPage || campaignsPage >= campaignsTotalPages) return;
    fetchCampaigns(campaignsPage + 1);
  }, [isMarketingLoading, isFetchingNextMarketingPage, campaignsPage, campaignsTotalPages, fetchCampaigns]);

  const openCreateCampaignModal = useCallback(() => {
    setEditingCampaign(null);
    resetCampaignForm({ name: '', type: 'email', subject: '', body: '' });
    setCampaignModalVisible(true);
  }, [resetCampaignForm]);

  const openEditCampaignModal = useCallback((campaign: MarketingCampaign) => {
    setEditingCampaign(campaign);
    resetCampaignForm({
      name: campaign.name,
      type: campaign.type,
      subject: campaign.subject ?? '',
      body: campaign.body,
    });
    setCampaignModalVisible(true);
  }, [resetCampaignForm]);

  const handleSaveCampaign = useCallback(async (values: CampaignFormValues) => {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, values as CreateCampaignDto);
        showToast({ title: 'Succès', message: 'Campagne mise à jour.', type: 'success' });
      } else {
        await createCampaign(values as CreateCampaignDto);
        showToast({ title: 'Succès', message: 'Campagne créée en tant que brouillon.', type: 'success' });
      }
      setCampaignModalVisible(false);
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de créer la campagne.', type: 'error' });
    }
  }, [createCampaign, updateCampaign, editingCampaign, showToast]);

  const handleDeleteCampaign = useCallback((campaign: MarketingCampaign) => {
    Alert.alert(
      'Supprimer la campagne',
      `Êtes-vous sûr de vouloir supprimer le brouillon "${campaign.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCampaign(campaign.id);
              showToast({ title: 'Supprimé', message: 'La campagne a été supprimée.', type: 'success' });
            } catch (error: any) {
              showToast({ title: 'Erreur', message: error?.message ?? 'Impossible de supprimer.', type: 'error' });
            }
          },
        },
      ],
    );
  }, [deleteCampaign, showToast]);

  const handleSendCampaign = useCallback((campaign: MarketingCampaign) => {
    Alert.alert('Envoyer la campagne', `Envoyer "${campaign.name}" à tous les clients éligibles ? Cette action est irréversible.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Envoyer', style: 'default', onPress: async () => {
        try {
          const result = await sendCampaign(campaign.id);
          showToast({ title: 'Envoi en cours', message: `Campagne envoyée à ${result?.sent_count ?? 0} destinataires.`, type: 'success' });
        } catch (error: any) {
          showToast({ title: 'Erreur', message: error?.message ?? 'Impossible d\'envoyer la campagne.', type: 'error' });
        }
      }},
    ]);
  }, [sendCampaign, showToast]);

  const renderPromoCard = ({ item: promo }: { item: PromoCode }) => {
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
              <Text style={styles.promoName}>{promo.name ?? promo.code}</Text>
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
              <TouchableOpacity style={styles.campaignTextButton} onPress={() => handleSendCampaign(item)}>
                <Text style={styles.campaignTextButtonText}>Envoyer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.campaignTextButton} onPress={() => openEditCampaignModal(item)}>
                <Text style={styles.campaignTextButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.campaignTextButton} onPress={() => handleDeleteCampaign(item)}>
                <Text style={[styles.campaignTextButtonText, { color: Colors.error }]}>Supprimer</Text>
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

  // ─── Header components for each tab ──────────────────────────────────────────

  const PromoListHeader = useCallback(() => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Codes promotionnels</Text>
      <TouchableOpacity style={styles.addButton} onPress={openCreatePromoModal}>
        <AppIcon name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  ), [openCreatePromoModal]);

  const CampaignListHeader = useCallback(() => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Campagnes marketing</Text>
      <TouchableOpacity style={styles.addButton} onPress={openCreateCampaignModal}>
        <AppIcon name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  ), [openCreateCampaignModal]);

  const ClientListHeader = useCallback(() => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Base clients</Text>
        {/* <View style={styles.addButton} /> */}
      </View>
      <View style={styles.statsGrid}>
        <View style={[styles.kpiCardClient, styles.kpiCard]}>
          <View style={styles.kpiIcon}><AppIcon name="people-outline" size={20} color={Colors.white} /></View>
          <Text style={styles.kpiValue}>{marketingStats?.total_clients ?? 0}</Text>
          <Text style={styles.kpiLabel}>Total Clients</Text>
        </View>
        <View style={[styles.kpiCardEmail, styles.kpiCard]}>
          <View style={styles.kpiIcon}><AppIcon name="mail-outline" size={20} color={Colors.white} /></View>
          <Text style={styles.kpiValue}>{marketingStats?.opt_in_email ?? 0}</Text>
          <Text style={styles.kpiLabel}>Opt-in Email</Text>
        </View>
        <View style={[styles.kpiCardChat, styles.kpiCard]}>
          <View style={styles.kpiIcon}><AppIcon name="chatbubble-ellipses-outline" size={20} color={Colors.white} /></View>
          <Text style={styles.kpiValue}>{marketingStats?.opt_in_sms ?? 0}</Text>
          <Text style={styles.kpiLabel}>Opt-in SMS</Text>
        </View>
        <View style={[styles.kpiCardNotif, styles.kpiCard]}>
          <View style={styles.kpiIcon}><AppIcon name="notifications-outline" size={20} color={Colors.white} /></View>
          <Text style={styles.kpiValue}>{marketingStats?.opt_in_push ?? 0}</Text>
          <Text style={styles.kpiLabel}>Opt-in Push</Text>
        </View>
      </View>
      <View style={styles.filterContent}>
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
    </>
  ), [marketingStats, searchClients, activeClientFilter, fetchMarketingClients]);

  // ─────────────────────────────────────────────────────────────────────────────

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
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Onglet Promo ── */}
      {activeTab === 'promo' && (
        <FlatList
          data={promoCodes}
          renderItem={renderPromoCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<PromoListHeader />}
          ListEmptyComponent={
            isPromoCodesLoading
              ? <ActivityIndicator size="large" color={Colors.bordeaux} style={styles.loader} />
              : <Text style={styles.emptyText}>Aucun code promo n'est disponible.</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Onglet Clients ── */}
      {activeTab === 'clients' && (
        <FlatList
          data={marketingClients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMoreClients}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<ClientListHeader />}
          renderItem={({ item: client }) => (
            <View style={styles.clientCard}>
              <View style={styles.clientInfoRow}>
                <View style={styles.clientAvatar}>
                  <AppIcon name="person-outline" size={20} color={Colors.white} />
                </View>
                <View style={styles.clientTextGroup}>
                  <Text style={styles.clientName}>{client.first_name} {client.last_name}</Text>
                  <Text style={styles.clientEmail}>{client.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.clientActionButton}
                  onPress={() => showToast({ title: 'Détails client', message: 'Fonctionnalité de fiche client à venir', type: 'info' })}
                >
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
                  <Text style={styles.clientStatValue}>{client.total_spent} €</Text>
                  <Text style={styles.clientStatLabel}>Dépensé</Text>
                </View>
                <View style={styles.clientStatItem}>
                  <Text style={styles.clientStatValue}>
                    {client.last_ride_date ? new Date(client.last_ride_date).toLocaleDateString('fr-FR') : 'Aucune'}
                  </Text>
                  <Text style={styles.clientStatLabel}>Dernière activité</Text>
                </View>
              </View>
              <View style={styles.badgesRow}>
                {client.marketing_email_opt_in && (
                  <View style={styles.badge}>
                    <AppIcon name={CANAL.email.icon} size={12} color={Colors.textSecondary} />
                    <Text style={styles.badgeText}>{CANAL.email.label}</Text>
                  </View>
                )}
                {client.marketing_sms_opt_in && (
                  <View style={styles.badge}>
                    <AppIcon name={CANAL.sms.icon} size={12} color={Colors.textSecondary} />
                    <Text style={styles.badgeText}>{CANAL.sms.label}</Text>
                  </View>
                )}
                {client.marketing_push_opt_in && (
                  <View style={styles.badge}>
                    <AppIcon name={CANAL.push.icon} size={12} color={Colors.textSecondary} />
                    <Text style={styles.badgeText}>{CANAL.push.label}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isMarketingLoading
              ? <Text style={styles.emptyText}>Aucun client trouvé.</Text>
              : null
          }
          ListFooterComponent={
            isFetchingNextMarketingPage
              ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} />
              : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Onglet Campagnes ── */}
      {activeTab === 'campaigns' && (
        <FlatList
          data={campaigns}
          renderItem={renderCampaignCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMoreCampaigns}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<CampaignListHeader />}
          ListEmptyComponent={
            isMarketingLoading && campaigns.length === 0
              ? <ActivityIndicator size="large" color={Colors.bordeaux} style={styles.loader} />
              : <Text style={styles.emptyText}>Aucune campagne trouvée.</Text>
          }
          ListFooterComponent={
            isFetchingNextMarketingPage
              ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} />
              : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Modal Promo ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingPromo ? 'Modifier un code promo' : 'Nouveau code promo'}</Text>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!editingPromo && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Mode de création</Text>
                  <View style={styles.toggleRow}>
                    {PROMO_MODES.map((mode) => (
                      <TouchableOpacity
                        key={mode.key}
                        style={[styles.toggleButton, promoCreationMode === mode.key && styles.toggleButtonActive]}
                        onPress={() => setPromoCreationMode(mode.key)}
                      >
                        <Text style={[styles.toggleButtonText, promoCreationMode === mode.key && styles.toggleButtonTextActive]}>
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {promoCreationMode === 'public' && !editingPromo ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Code (public)</Text>
                  <Controller
                    control={control}
                    name="code"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.fieldInputWrapper}>
                        <AppIcon name="barcode-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                          style={styles.fieldInput}
                          value={value || ''}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="Ex: SUMMER20"
                          placeholderTextColor={Colors.textSecondary}
                        />
                      </View>
                    )}
                  />
                  {errors.code && <Text style={styles.errorText}>{errors.code.message}</Text>}
                </View>
              ) : !editingPromo && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Radical du code (pour assignation)</Text>
                  <Controller
                    control={control}
                    name="code_radical"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.fieldInputWrapper}>
                        <AppIcon name="key-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                          style={styles.fieldInput}
                          value={value || ''}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="Ex: BIENVENUE"
                          placeholderTextColor={Colors.textSecondary}
                        />
                      </View>
                    )}
                  />
                  {errors.code_radical && <Text style={styles.errorText}>{errors.code_radical.message}</Text>}
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nom de la promotion</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.fieldInputWrapper}>
                      <AppIcon name="pricetag-outline" size={20} color={Colors.textSecondary} />
                      <TextInput
                        style={styles.fieldInput}
                        value={value || ''}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Ex: Offre de bienvenue"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  )}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.fieldInputWrapper}>
                      <AppIcon name="document-text-outline" size={20} color={Colors.textSecondary} />
                      <TextInput
                        style={styles.fieldInput}
                        value={value || ''}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Ex: -20% sur la première course"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  )}
                />
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
                    <View style={styles.fieldInputWrapper}>
                      <AppIcon name="cash-outline" size={20} color={Colors.textSecondary} />
                      <TextInput
                        style={styles.fieldInput}
                        value={value == null ? '' : String(value)}
                        onBlur={onBlur}
                        onChangeText={(text) => {
                          const cleanedText = text.replace(',', '.').trim();
                          onChange(cleanedText === '' ? undefined : parseFloat(cleanedText));
                        }}
                        placeholder="10"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
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
                    <View style={styles.fieldInputWrapper}>
                      <AppIcon name="calendar-outline" size={20} color={Colors.textSecondary} />
                      <TouchableOpacity
                        style={styles.fieldInput}
                        onPress={() => {
                          setCalendarTarget('valid_until');
                          setCalendarVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.fieldInputText, !value && styles.fieldPlaceholder]}>
                          {value || 'YYYY-MM-JJ'}
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                      <View style={styles.fieldInputWrapper}>
                        <AppIcon name="infinite-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                          style={styles.fieldInput}
                          value={value == null ? '' : String(value)}
                          onBlur={onBlur}
                          onChangeText={(text) => {
                            const cleanedText = text.trim();
                            onChange(cleanedText === '' ? undefined : parseInt(cleanedText, 10));
                          }}
                          placeholder="Illimité"
                          placeholderTextColor={Colors.textSecondary}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Montant min</Text>
                  <Controller
                    control={control}
                    name="min_order_amount"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.fieldInputWrapper}>
                        <AppIcon name="cart-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                          style={styles.fieldInput}
                          value={value == null ? '' : String(value)}
                          onBlur={onBlur}
                          onChangeText={(text) => {
                            const cleanedText = text.trim();
                            onChange(cleanedText === '' ? undefined : parseInt(cleanedText, 10));
                          }}
                          placeholder="0"
                          placeholderTextColor={Colors.textSecondary}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  />
                </View>
              </View>

              {!editingPromo && (promoCreationMode === 'single' || promoCreationMode === 'bulk') && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    {promoCreationMode === 'single' ? 'Client assigné' : 'Clients assignés'}
                  </Text>
                  <View style={styles.fieldInputWrapper}>
                    <AppIcon name="person-add-outline" size={20} color={Colors.textSecondary} />
                    <TouchableOpacity style={styles.fieldInput} onPress={() => setClientSelectorVisible(true)}>
                      <Text style={[styles.fieldInputText, selectedClients.length === 0 && styles.fieldPlaceholder]}>
                        {selectedClients.length > 0
                          ? `${selectedClients.length} client(s) sélectionné(s)`
                          : 'Sélectionner...'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {selectedClients.length > 0 && (
                    <Text style={styles.selectedClientsPreview} numberOfLines={1}>
                      {selectedClients.map(c => `${c.first_name} ${c.last_name}`).join(', ')}
                    </Text>
                  )}
                </View>
              )}

              <CustomCalendarModal
                visible={isCalendarVisible}
                selectedDate={watch(calendarTarget) || null}
                onConfirm={(date) => {
                  setValue(calendarTarget, date, { shouldValidate: true, shouldDirty: true });
                  setCalendarVisible(false);
                }}
                onCancel={() => setCalendarVisible(false)}
              />

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

      {/* ── Modal Sélection clients ── */}
      <Modal visible={isClientSelectorVisible} animationType="slide" transparent onRequestClose={() => setClientSelectorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner des clients</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              value={clientSearchQuery}
              onChangeText={setClientSearchQuery}
            />
            <RNFlatList
              data={allClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedClients.some(c => c.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.clientItem, isSelected && styles.clientItemSelected]}
                    onPress={() => {
                      if (promoCreationMode === 'single') {
                        setSelectedClients([item]);
                      } else {
                        setSelectedClients(prev =>
                          isSelected ? prev.filter(c => c.id !== item.id) : [...prev, item]
                        );
                      }
                    }}
                  >
                    <Text style={styles.clientItemText}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.clientItemSubText}>{item.email}</Text>
                    {isSelected && <AppIcon name="checkmark-circle" size={24} color={Colors.bordeaux} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun client trouvé.</Text>}
              style={{ maxHeight: 300 }}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setSelectedClients([]);
                  setClientSelectorVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  if (promoCreationMode === 'single' && selectedClients.length === 1) {
                    setValue('assigned_user_id', selectedClients[0].id);
                  } else if (promoCreationMode === 'bulk' && selectedClients.length > 0) {
                    setValue('assigned_user_id', selectedClients[0].id);
                  }
                  setClientSelectorVisible(false);
                }}
              >
                <Text style={styles.modalSaveText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Campagne ── */}
      <Modal visible={isCampaignModalVisible} animationType="slide" transparent onRequestClose={() => setCampaignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCampaign ? 'Modifier la campagne' : 'Nouvelle Campagne'}</Text>
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
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setCampaignModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, isCampaignSubmitting && styles.modalSaveButtonDisabled]}
                  onPress={handleCampaignSubmit(handleSaveCampaign)}
                  disabled={isCampaignSubmitting}
                >
                  {isCampaignSubmitting
                    ? <ActivityIndicator color={Colors.white} /> 
                    : <Text style={styles.modalSaveText}>{editingCampaign ? 'Mettre à jour' : 'Créer'}</Text>
                  }
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
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    elevation: 1,
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
  // Remplace l'ancien style `content` (ScrollView) — maintenant c'est le contentContainerStyle des FlatLists
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.bordeauxLight,
    fontSize: Fonts.size.xl,
    fontFamily: Fonts.bold,
    fontWeight: 'bold',
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
    padding: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
    elevation: 1,
  },
  filterContent: {
    backgroundColor: Colors.white,
    elevation: 1,
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
    elevation: 1,
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
    fontWeight: 'bold',
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
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
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
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.xxl + 32,
  },
  modalScroll: {
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: Fonts.size.xl,
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.medium,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    elevation: 1,
  },
  fieldIcon: {
    marginRight: Spacing.xs,
  },
  fieldInput: {
    flex: 1,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.regular,
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
    marginBottom: Spacing.lg,
  },
  fieldHalf: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    elevation: 1,
    padding: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.lg,
    elevation: 2,
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
    paddingVertical: Spacing.md,
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
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  selectedClientsPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  clientItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientItemSelected: {
    backgroundColor: '#EFEAEA',
    borderRadius: Radius.sm,
  },
  clientItemText: {
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  clientItemSubText: {
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});