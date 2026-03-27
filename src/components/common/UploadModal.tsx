import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Image,
  TouchableOpacity, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons }        from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
}                          from '@react-native-community/datetimepicker';
import * as ImagePicker    from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { DocumentView } from '../../types/document.types';

// ─── Types ────────────────────────────────────────────────────

export interface UploadPayload {
  file: {
    uri:  string;
    name: string;
    type: string;
  };
  expiryDate: string; // ISO : AAAA-MM-JJ
}

interface Props {
  visible:     boolean;
  view:        DocumentView | null;
  isUploading: boolean;
  onClose:     () => void;
  onConfirm:   (payload: UploadPayload) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

const formatDisplay = (d: Date): string => {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toIso = (d: Date): string => {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const maxDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 20);
  return d;
};

// ─── Composant ───────────────────────────────────────────────

export const UploadModal = ({ visible, view, isUploading, onClose, onConfirm }: Props) => {

  const [selectedFile,      setSelectedFile]      = useState<UploadPayload['file'] | null>(null);
  const [expiryDate,        setExpiryDate]        = useState<Date | null>(null);
  // Android uniquement : contrôle l'affichage du dialog natif
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedFile(null);
      setExpiryDate(null);
      setShowAndroidPicker(false);
    }
  }, [visible]);

  // ── Sélection fichier ──────────────────────────────────────

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setSelectedFile({
        uri:  a.uri,
        name: a.fileName ?? 'photo.jpg',
        type: a.mimeType ?? 'image/jpeg',
      });
    }
  };

  const pickFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setSelectedFile({
        uri:  a.uri,
        name: a.name,
        type: a.mimeType ?? 'application/octet-stream',
      });
    }
  };

  // ── Gestion du changement de date ─────────────────────────

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    // Android : ferme le dialog dans tous les cas (OK ou annuler)
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (_event.type === 'set' && date) setExpiryDate(date);
    } else {
      // iOS : spinner inline, mise à jour continue
      if (date) setExpiryDate(date);
    }
  };

  // ── Validation ─────────────────────────────────────────────

  const isReady = !!selectedFile && !!expiryDate;

  const handleConfirm = () => {
    if (!selectedFile || !expiryDate) return;
    onConfirm({ file: selectedFile, expiryDate: toIso(expiryDate) });
  };

  // ── Rendu ──────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.root}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.title} numberOfLines={1}>
              {view?.uploaded
                ? `Remplacer — ${view?.label}`
                : `Ajouter — ${view?.label}`}
            </Text>
            <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={20} color="#3A1F1E" />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Section fichier ── */}
            <Text style={s.sectionLabel}>
              Fichier <Text style={s.required}>*</Text>
            </Text>

            {selectedFile ? (
              <View style={s.filePreview}>
                {selectedFile.type.startsWith('image') ? (
                  <Image
                    source={{ uri: selectedFile.uri }}
                    style={s.previewImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={s.pdfBox}>
                    <Ionicons name="document-text-outline" size={40} color="#A08080" />
                    <Text style={s.pdfName} numberOfLines={1}>{selectedFile.name}</Text>
                  </View>
                )}
                <TouchableOpacity style={s.changeBtn} onPress={pickFromGallery}>
                  <Ionicons name="swap-horizontal-outline" size={14} color="#5D3332" />
                  <Text style={s.changeBtnTxt}>Changer de fichier</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.dropZone}>
                <View style={s.dropIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#5D3332" />
                </View>
                <Text style={s.dropText}>Cliquez ou glissez votre fichier ici</Text>
                <Text style={s.dropSub}>PDF, JPG ou PNG (max 5 Mo)</Text>
                <View style={s.pickRow}>
                  <TouchableOpacity style={s.pickBtn} onPress={pickFromGallery}>
                    <Ionicons name="image-outline" size={15} color="#5D3332" />
                    <Text style={s.pickBtnTxt}>Galerie</Text>
                  </TouchableOpacity>
                  {view?.acceptPdf && (
                    <TouchableOpacity style={s.pickBtn} onPress={pickFromFiles}>
                      <Ionicons name="document-outline" size={15} color="#5D3332" />
                      <Text style={s.pickBtnTxt}>Fichiers</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ── Section date d'expiration ── */}
            <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>
              Date d'expiration <Text style={s.required}>*</Text>
            </Text>

            {/* Android : bouton qui ouvre le dialog natif */}
            {Platform.OS === 'android' && (
              <>
                <TouchableOpacity
                  style={[s.dateField, expiryDate ? s.dateFieldFilled : null]}
                  onPress={() => setShowAndroidPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={expiryDate ? '#5D3332' : '#A08080'}
                  />
                  <Text style={[s.dateFieldTxt, expiryDate ? s.dateFieldTxtFilled : null]}>
                    {expiryDate
                      ? formatDisplay(expiryDate)
                      : "Sélectionner la date d'expiration"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={expiryDate ? '#5D3332' : '#C4A9A8'}
                  />
                </TouchableOpacity>

                {showAndroidPicker && (
                  <DateTimePicker
                    value={expiryDate ?? todayDate()}
                    mode="date"
                    display="default"
                    minimumDate={todayDate()}
                    maximumDate={maxDate()}
                    onChange={onDateChange}
                    locale="fr-FR"
                  />
                )}
              </>
            )}

            {/* iOS : spinner inline dans le modal */}
            {Platform.OS === 'ios' && (
              <>
                <TouchableOpacity
                  style={[s.dateField, expiryDate ? s.dateFieldFilled : null]}
                  activeOpacity={1}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={expiryDate ? '#5D3332' : '#A08080'}
                  />
                  <Text style={[s.dateFieldTxt, expiryDate ? s.dateFieldTxtFilled : null]}>
                    {expiryDate
                      ? formatDisplay(expiryDate)
                      : "Sélectionnez une date ci-dessous"}
                  </Text>
                </TouchableOpacity>

                <View style={s.iosPickerWrap}>
                  <DateTimePicker
                    value={expiryDate ?? todayDate()}
                    mode="date"
                    display="spinner"
                    minimumDate={todayDate()}
                    maximumDate={maxDate()}
                    onChange={onDateChange}
                    locale="fr-FR"
                    style={s.iosPicker}
                    textColor="#3A1F1E"
                  />
                </View>
              </>
            )}

            {expiryDate && (
              <View style={s.dateConfirmed}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={s.dateConfirmedTxt}>
                  Expire le {formatDisplay(expiryDate)}
                </Text>
              </View>
            )}

            {!expiryDate && (
              <Text style={s.dateHint}>
                Renseignez la date figurant sur votre document
              </Text>
            )}

          </ScrollView>

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btnConfirm, !isReady && s.btnDisabled]}
              onPress={handleConfirm}
              disabled={!isReady || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={s.btnConfirmTxt}>Téléverser</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnCancel}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={s.btnCancelTxt}>Annuler</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────

const BRAND = {
  primary: '#5D3332',
  dark:    '#3A1F1E',
  muted:   '#A08080',
  border:  '#E8DEDD',
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF6F5' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: BRAND.border,
    gap: 12,
  },
  title: {
    flex: 1, fontSize: Fonts.size.md ?? 15,
    fontWeight: '700', color: BRAND.dark,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: Spacing.md, gap: 6 },

  sectionLabel: {
    fontSize: Fonts.size.sm ?? 13, fontWeight: '700',
    color: BRAND.dark, marginBottom: 8,
  },
  required: { color: BRAND.primary },

  // Drop zone
  dropZone: {
    borderWidth: 2, borderColor: BRAND.border, borderStyle: 'dashed',
    borderRadius: Radius.md ?? 12, padding: 28,
    alignItems: 'center', backgroundColor: '#fff',
  },
  dropIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F5EDEC',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  dropText: {
    fontWeight: '600', color: BRAND.dark,
    textAlign: 'center', fontSize: Fonts.size.sm ?? 13,
  },
  dropSub:  { fontSize: 11, color: BRAND.muted, marginTop: 4 },
  pickRow:  { flexDirection: 'row', gap: 12, marginTop: 16 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: BRAND.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  pickBtnTxt: { fontSize: 13, fontWeight: '600', color: BRAND.primary },

  // File preview
  filePreview: {
    borderRadius: Radius.md ?? 12, overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: BRAND.border,
  },
  previewImg: { width: '100%', height: 180 },
  pdfBox: {
    height: 100, alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 16,
  },
  pdfName: { fontSize: 12, color: BRAND.muted },
  changeBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    padding: 10,
    borderTopWidth: 1, borderTopColor: BRAND.border,
  },
  changeBtnTxt: { fontSize: 13, fontWeight: '600', color: BRAND.primary },

  // Date field
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: BRAND.border,
    borderRadius: Radius.sm ?? 8,
    paddingHorizontal: 14, height: 52,
    backgroundColor: '#fff',
  },
  dateFieldFilled: {
    borderColor: BRAND.primary, backgroundColor: '#FDF8F7',
  },
  dateFieldTxt: {
    flex: 1, fontSize: Fonts.size.md ?? 15, color: BRAND.muted,
  },
  dateFieldTxtFilled: { color: BRAND.dark, fontWeight: '600' },

  // iOS spinner inline
  iosPickerWrap: {
    backgroundColor: '#fff',
    borderRadius: Radius.md ?? 12,
    borderWidth: 1, borderColor: BRAND.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  iosPicker: { width: '100%', height: 180 },

  dateConfirmed: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
  },
  dateConfirmedTxt: { fontSize: 12, color: '#2E7D32', fontWeight: '500' },
  dateHint: { fontSize: 11, color: BRAND.muted, marginTop: 5 },

  // Actions
  actions: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    paddingBottom: 28, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: BRAND.border,
    gap: 10,
  },
  btnConfirm: {
    backgroundColor: BRAND.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 15,
    borderRadius: Radius.md ?? 12, gap: 8,
  },
  btnDisabled: { backgroundColor: '#C4A9A8' },
  btnConfirmTxt: { color: '#fff', fontSize: Fonts.size.md ?? 15, fontWeight: '700' },
  btnCancel: {
    paddingVertical: 13, borderRadius: Radius.md ?? 12,
    alignItems: 'center', backgroundColor: '#F5F0F0',
  },
  btnCancelTxt: { color: BRAND.dark, fontSize: Fonts.size.md ?? 15, fontWeight: '600' },
});