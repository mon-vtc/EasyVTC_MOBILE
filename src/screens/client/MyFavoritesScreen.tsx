import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../hooks/useFavorites';
import { useToast } from '../../hooks/useToast';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';
import type { FavoriteAddress, FavoriteAddressType } from '../../types/favorites.types';
import { FormField } from '../../components/forms/FormField';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation }  from '@react-navigation/native';
import { AppIcon } from '../../components/common/AppIcon';
import { Logo } from '../../constants/logo'


const ICONS_MAP: Record<FavoriteAddressType, { name: React.ComponentProps<typeof Ionicons>['name'], color: string, bg: string }> = {
  home: { name: 'home', color: '#3B82F6', bg: '#DBEAFE' },
  office: { name: 'briefcase', color: '#8B5CF6', bg: '#EDE9FE' },
  airport: { name: 'airplane', color: '#10B981', bg: '#D1FAE5' },
  station: { name: 'train', color: '#F97316', bg: '#FFEDD5' },
  custom: { name: 'location', color: '#6B7280', bg: '#F3F4F6' },
};

const addFavoriteSchema = z.object({
  label: z.string().min(1, 'Le nom est requis'),
  address: z.string().min(5, 'L\'adresse est requise'),
});
type AddFavoriteForm = z.infer<typeof addFavoriteSchema>;

const getIconForFavorite = (label: string): FavoriteAddressType => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('domicile') || lowerLabel.includes('maison')) return 'home';
  if (lowerLabel.includes('bureau') || lowerLabel.includes('travail')) return 'office';
  if (lowerLabel.includes('aéroport') || lowerLabel.includes('airport') || lowerLabel.includes('cdg') || lowerLabel.includes('orly')) return 'airport';
  if (lowerLabel.includes('gare')) return 'station';
  return 'custom';
};

export default function MyFavoritesScreen({ navigation }: any) {
  const { favorites, isLoading, isSaving, fetchFavorites, addFavorite, deleteFavorite } = useFavorites();
  const { showToast } = useToast();
  const [isModalVisible, setModalVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm<AddFavoriteForm>({
    resolver: zodResolver(addFavoriteSchema),
  });

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = (id: string, label: string) => {
    Alert.alert(
      'Supprimer ce favori ?',
      `Voulez-vous vraiment supprimer "${label}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFavorite(id);
              showToast({ type: 'success', title: 'Favori supprimé', message: `"${label}" a été retiré de vos favoris.` });
            } catch (e: any) {
              showToast({ type: 'error', title: 'Erreur', message: e.message || 'Impossible de supprimer le favori.' });
            }
          },
        },
      ],
    );
  };

  const handleAdd = async (data: AddFavoriteForm) => {
    try {
      const { res, err } = await addFavorite({ label: data.label, address: data.address });
      if (err) {
        showToast({ type: 'error', title: 'Erreur', message: err.message || 'Impossible d\'ajouter le favori.' });
      } else if (res) {
        showToast({ type: 'success', title: 'Favori ajouté !', message: `"${data.label}" a été ajouté à vos favoris.` });
        setModalVisible(false);
        reset();
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erreur inattendue', message: 'Une erreur s\'est produite.' });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={80} color={Colors.border} />
      <Text style={styles.emptyTitle}>Aucun favori enregistré</Text>
      <Text style={styles.emptySubtitle}>Ajoutez vos adresses préférées pour réserver plus rapidement.</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.emptyButtonText}>Ajouter une adresse</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (item: FavoriteAddress) => {
    const favoriteType = getIconForFavorite(item.label);
    const iconInfo = ICONS_MAP[favoriteType];
    return (
      <View key={item.id} style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
          <Ionicons name={iconInfo.name} size={24} color={iconInfo.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardAddress}>{item.address}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.label)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <AppIcon name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Image source={Logo.LogoEasyVTC} style={{ width: 32, height: 32 }} />
        <View style={styles.headerBtn} />
      </View>
      <View style={styles.titleZone}>
        <View>
          <Text style={styles.mainTitle}>Mes favoris</Text>
          <Text style={styles.subtitle}>
            {favorites.length} adresse{favorites.length > 1 ? 's' : ''} enregistrée{favorites.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.bordeaux} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {favorites.length === 0 ? renderEmptyState() : favorites.map(renderCard)}
        </ScrollView>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Ajouter un favori</Text>
            <FormField
              name="label"
              control={control}
              label="Nom du favori (ex: Maison, Travail...)"
              placeholder="Domicile"
            />
            <FormField
              name="address"
              control={control}
              label="Adresse complète"
              placeholder="15 Rue de la Paix, 75002 Paris"
              multiline
              numberOfLines={3}
            />
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnCancel]}
                onPress={() => { setModalVisible(false); reset(); }}
              >
                <Text style={modalStyles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnConfirm]}
                onPress={handleSubmit(handleAdd)}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={modalStyles.btnConfirmText}>Ajouter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },
  titleZone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  mainTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: '700',
    color: Colors.bordeaux,
  },
  subtitle: {
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
    marginTop: 4,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 28,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: Fonts.size.md,
    fontWeight: '700',
    color: Colors.bordeaux,
  },
  cardAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: '20%',
  },
  emptyTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.xl,
  },
  emptyButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Fonts.size.md,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.lg,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  btnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Fonts.size.md,
  },
  btnConfirm: {
    backgroundColor: Colors.bordeaux,
  },
  btnConfirmText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Fonts.size.md,
  },
});