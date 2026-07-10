import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../hooks/useFavorites';
import { useToast } from '../../hooks/useToast';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';
import { useAlert } from '../../hooks/useAlert';
import type { FavoriteAddress, FavoriteAddressType } from '../../types/favorites.types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';
import { useDebounce } from '../../hooks/useDebounce';


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

function AddressAutocomplete({ control, suggestions, onSelectSuggestion }: {
  control: any;
  suggestions: any[];
  onSelectSuggestion: (suggestion: any) => void;
}) {
  return (
    <View>
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View style={fieldStyles.wrapper}>
            <Text style={fieldStyles.label}>Adresse complète</Text>
            <View style={[fieldStyles.inputWrapper, error ? { borderColor: Colors.error } : {}]}>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="15 Rue de la Paix, 75002 Paris"
                style={fieldStyles.input}
                multiline
                numberOfLines={2}
              />
            </View>
            {error && <Text style={fieldStyles.errorText}>{error.message}</Text>}
          </View>
        )}
      />
      {suggestions.length > 0 && (
        <ScrollView style={modalStyles.suggestionsContainer} keyboardShouldPersistTaps="handled">
          {suggestions.map((suggestion: any) => (
            <TouchableOpacity
              key={suggestion.properties.id}
              style={modalStyles.suggestionItem}
              onPress={() => onSelectSuggestion(suggestion)}
            >
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
              <Text style={modalStyles.suggestionText}>{suggestion.properties.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function AddFavoriteModal({
  visible,
  isSaving,
  onClose,
  onAdd,
}: {
  visible: boolean;
  isSaving: boolean;
  onClose: () => void;
  onAdd: (data: AddFavoriteForm) => Promise<void>;
}) {
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddFavoriteForm>({
    resolver: zodResolver(addFavoriteSchema),
    defaultValues: { label: '', address: '' },
  });

  const addressInput = watch('address');
  const debouncedAddress = useDebounce(addressInput, 300);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    // Réinitialiser les suggestions quand la modale s'ouvre ou se ferme
    if (!visible) {
      setSuggestions([]);
      reset({ label: '', address: '' }); // Réinitialise le formulaire interne de la modale
    }
    if (debouncedAddress.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const url = `https://data.geopf.fr/geocodage/search/?q=${encodeURIComponent(debouncedAddress)}&limit=5`;
      try {
        const response = await fetch(url);
        const json = await response.json();
        setSuggestions(json.features || []);
      } catch (error) {
        console.error('Address API error:', error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  const handleSelectSuggestion = (suggestion: any) => {
    setValue('address', suggestion.properties.label, { shouldValidate: true });
    setSuggestions([]);
  };

  const handleAddSubmit = async (data: AddFavoriteForm) => {
    try {
      await onAdd(data); // Appelle la fonction onAdd du parent
      reset({ label: '', address: '' }); // Réinitialise le formulaire après succès
      setSuggestions([]);
      onClose(); // Ferme la modale
    } catch (e) {
      // L'erreur est gérée par le onAdd du parent, pas besoin de la propager ici
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Ajouter un favori</Text>
          <Controller
            control={control}
            name="label"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={fieldStyles.wrapper}>
                <Text style={fieldStyles.label}>Nom du favori (ex: Maison, Travail...)</Text>
                <View style={[fieldStyles.inputWrapper, error ? { borderColor: Colors.error } : {}]}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Domicile"
                    style={fieldStyles.input}
                  />
                </View>
                {error && <Text style={fieldStyles.errorText}>{error.message}</Text>}
              </View>
            )} />
          <AddressAutocomplete
            control={control}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
          <View style={modalStyles.actions}>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={modalStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.btnConfirm]} onPress={handleSubmit(handleAddSubmit)} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={modalStyles.btnConfirmText}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MyFavoritesScreen({ navigation }: any) {
  const { favorites, isLoading, isSaving, fetchFavorites, addFavorite, deleteFavorite } = useFavorites();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = (id: string, label: string) => {
    showAlert({
      title: 'Supprimer ce favori ?',
      message: `Voulez-vous vraiment supprimer "${label}" de vos favoris ?`,
      buttons: [
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
    });
  };

  const handleAdd = async (data: AddFavoriteForm) => {
    try {
      const { res, err } = await addFavorite({ label: data.label, address: data.address });
      if (err) {
        showToast({ type: 'error', title: 'Erreur', message: err.message || 'Impossible d\'ajouter le favori.' });
        throw new Error(err.message || 'Impossible d\'ajouter le favori.'); // Propager l'erreur pour que la modale puisse la gérer
      } else if (res) {
        showToast({ type: 'success', title: 'Favori ajouté !', message: `"${data.label}" a été ajouté à vos favoris.` });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erreur inattendue', message: 'Une erreur s\'est produite.' });
      throw e; // Repropager l'erreur
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
      <AppHeader left="back" title="Mes favoris" />

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.bordeaux} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderCard(item)}
          ListHeaderComponent={
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
          }
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={styles.scrollContent}
        />
      )}

      <AddFavoriteModal
        visible={isModalVisible}
        isSaving={isSaving}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { fontSize: Fonts.size.sm, color: Colors.textCallToAction, marginBottom: Spacing.xs },
  inputWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : 8,
    backgroundColor: Colors.white,
  },
  input: { fontSize: Fonts.size.md, color: Colors.textPrimary },
  errorText: { color: Colors.error, fontSize: Fonts.size.xs, marginTop: 4 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
    fontFamily: Fonts.bold, fontWeight: '700',
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
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.lg,
  },
  suggestionsContainer: {
    maxHeight: 150,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    marginTop: -8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    marginLeft: Spacing.sm,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontFamily: Fonts.bold, fontWeight: '800',
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
    fontFamily: Fonts.semibold, fontWeight: '600',
    fontSize: Fonts.size.md,
  },
  btnConfirm: {
    backgroundColor: Colors.bordeaux,
  },
  btnConfirmText: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
    fontSize: Fonts.size.md,
  },
});