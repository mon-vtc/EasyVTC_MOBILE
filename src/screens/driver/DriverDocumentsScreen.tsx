import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  Modal, Image, Pressable, RefreshControl,
} from 'react-native';
import { Ionicons }              from '@expo/vector-icons';
import { useSafeAreaInsets }     from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useToast } from '../../hooks/useToast';
import { DocumentCard }          from '../../components/common/DocumentCard';
import { UploadModal }           from '../../components/common/UploadModal';
import type { UploadPayload }    from '../../components/common/UploadModal';
import { useDocuments }          from '../../hooks/useDocuments';
import type { DocumentView }     from '../../types/document.types';


const completionPercent = (uploaded: number, total: number) =>
  total === 0 ? 0 : Math.round((uploaded / total) * 100);

export default function DriverDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    documentViews, isLoading, isUploading, error,
    fetchDocuments, uploadFromGallery, uploadFromFiles,
    clearError, uploadedCount, missingCount,
    requiredMissing, pendingCount, rejectedCount,
  } = useDocuments();
  const { showToast } = useToast();

  const [refreshing,         setRefreshing]         = useState(false);
  const [viewerDoc,          setViewerDoc]          = useState<DocumentView | null>(null);
  const [viewerVisible,      setViewerVisible]      = useState(false);
  const [uploadModalView,    setUploadModalView]    = useState<DocumentView | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchDocuments(); } finally { setRefreshing(false); }
  }, [fetchDocuments]);

  useEffect(() => {
    if (error) { showToast({ type: 'error', title: 'Erreur', message: error }); clearError(); }
  }, [error]);

  // ── Ouvre le modal d'upload ───────────────────────────────
  const handleUpload = (view: DocumentView) => {
    setUploadModalView(view);
    setUploadModalVisible(true);
  };

  // ── Appelé lors de la validation dans le modal ────────────
  const handleUploadConfirm = async ({ file, expiryDate }: UploadPayload) => {
    if (!uploadModalView) return;
    const docType = uploadModalView.type;
    try {
      if (file.type === 'application/pdf') {
        await uploadFromFiles(docType, file.uri, expiryDate);
      } else {
        await uploadFromGallery(docType, file.uri, expiryDate);
      }
      setUploadModalVisible(false);
      setUploadModalView(null);
    } catch {
      // L'erreur est gérée par le hook via `error`
    }
  };

  const handleView = (view: DocumentView) => {
    setViewerDoc(view);
    setViewerVisible(true);
  };

  const total    = documentViews.length;
  const pct      = completionPercent(uploadedCount, total);
  const barColor = pct === 100 ? Colors.success : requiredMissing > 0 ? Colors.bordeaux : Colors.borderFocus;

  return (
    <View style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Vos documents</Text>
        <Text style={s.headerSub}>
          Gardez vos documents à jour pour continuer à recevoir des courses
        </Text>
      </View>

      {/* ── Barre de progression ── */}
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={[s.progressPct, { color: barColor }]}>{pct}%</Text>
      </View>

      {/* ── Pastilles de statut ── */}
      <View style={s.statsRow}>
        <Chip icon="checkmark-circle" label={`${uploadedCount} fournis`}   bg="#E8F5E9" color="#2E7D32" />
        <Chip icon="time-outline"     label={`${pendingCount} en attente`} bg="#E3F2FD" color="#1565C0" />
        <Chip icon="close-circle"     label={`${rejectedCount} refusés`}   bg="#FFEBEE" color="#C62828" />
        <Chip icon="alert-circle"     label={`${missingCount} manquants`}  bg="#FFF3E0" color="#E65100" />
      </View>

      {/* ── Loader initial ── */}
      {isLoading && !refreshing && (
        <View style={s.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={s.loaderText}>Chargement…</Text>
        </View>
      )}

      {/* ── Liste des documents ── */}
      {(!isLoading || refreshing) && (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.bordeaux}
              colors={[Colors.bordeaux]}
            />
          }
        >
          {/* Requis */}
          {documentViews.filter(v => v.required).map(view => (
            <DocumentCard
              key={view.type}
              title={view.label}
              icon={view.icon as any}
              required={view.required}
              uploaded={view.uploaded}
              status={view.document?.status ?? null}
              expiryDate={view.document?.expiry_date ?? undefined}
              rejectedReason={view.document?.rejection_reason ?? undefined}
              onUpload={() => handleUpload(view)}
              onView={view.uploaded ? () => handleView(view) : undefined}
            />
          ))}

          {/* Optionnels */}
          {documentViews.filter(v => !v.required).map(view => (
            <DocumentCard
              key={view.type}
              title={view.label}
              icon={view.icon as any}
              required={view.required}
              uploaded={view.uploaded}
              status={view.document?.status ?? null}
              expiryDate={view.document?.expiry_date ?? undefined}
              rejectedReason={view.document?.rejection_reason ?? undefined}
              onUpload={() => handleUpload(view)}
              onView={view.uploaded ? () => handleView(view) : undefined}
            />
          ))}

          <View style={{ height: insets.bottom + 32 }} />
        </ScrollView>
      )}

      {/* ── Overlay upload en cours ── */}
      {isUploading && (
        <View style={s.uploadOverlay}>
          <View style={s.uploadCard}>
            <ActivityIndicator size="large" color={Colors.bordeaux} />
            <Text style={s.uploadText}>Envoi en cours…</Text>
          </View>
        </View>
      )}

      {/* ── Modal d'upload (fichier + date expiration) ── */}
      <UploadModal
        visible={uploadModalVisible}
        view={uploadModalView}
        isUploading={isUploading}
        onClose={() => {
          setUploadModalVisible(false);
          setUploadModalView(null);
        }}
        onConfirm={handleUploadConfirm}
      />

      {/* ── Visionneuse document existant ── */}
      <DocumentViewer
        visible={viewerVisible}
        view={viewerDoc}
        onClose={() => { setViewerVisible(false); setViewerDoc(null); }}
        onReplace={() => {
          setViewerVisible(false);
          if (viewerDoc) handleUpload(viewerDoc);
        }}
      />
    </View>
  );
}

// ─── Chip ─────────────────────────────────────────────────────

const Chip = ({ icon, label, bg, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  color: string;
}) => (
  <View style={[chip.wrap, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={11} color={color} />
    <Text style={[chip.text, { color }]}>{label}</Text>
  </View>
);

// ─── DocumentViewer ──────────────────────────────────────────

interface ViewerProps {
  visible:   boolean;
  view:      DocumentView | null;
  onClose:   () => void;
  onReplace: () => void;
}

const DocumentViewer = ({ visible, view, onClose, onReplace }: ViewerProps) => {
  if (!view?.document) return null;

  const doc       = view.document;
  const isPdf     = doc.file_url?.toLowerCase().endsWith('.pdf');
  const signedUrl = doc.signed_url ?? doc.file_url;

  const statusLabel =
    doc.status === 'validated'  ? 'Document validé'
    : doc.status === 'rejected' ? `Refusé — ${doc.rejection_reason ?? 'motif non précisé'}`
    : doc.status === 'expired'  ? 'Document expiré'
    : 'En cours de vérification';

  const statusIcon: keyof typeof Ionicons.glyphMap =
    doc.status === 'validated'  ? 'checkmark-circle'
    : doc.status === 'rejected' ? 'close-circle'
    : doc.status === 'expired'  ? 'alert-circle'
    : 'time-outline';

  const statusColor =
    doc.status === 'validated'  ? '#2E7D32'
    : doc.status === 'rejected' ? '#C62828'
    : doc.status === 'expired'  ? '#E65100'
    : '#1565C0';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={m.root}>

        <View style={m.header}>
          <View style={{ flex: 1 }}>
            <Text style={m.title}>{view.label}</Text>
            <Text style={m.sub}>
              {doc.expiry_date
                ? `Expire le ${doc.expiry_date}`
                : "Pas de date d'expiration"}
            </Text>
          </View>
          <Pressable onPress={onClose} style={m.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.bordeauxDark} />
          </Pressable>
        </View>

        <View style={m.body}>
          {isPdf ? (
            <View style={m.pdfPlaceholder}>
              <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
              <Text style={m.pdfText}>Aperçu PDF non disponible</Text>
              <Text style={m.pdfSub}>Ouvrez le fichier dans votre navigateur.</Text>
            </View>
          ) : (
            <Image source={{ uri: signedUrl }} style={m.image} resizeMode="contain" />
          )}
        </View>

        <View style={m.statusRow}>
          <Ionicons name={statusIcon} size={18} color={statusColor} />
          <Text style={m.statusText}>{statusLabel}</Text>
        </View>

        <View style={m.actions}>
          <TouchableOpacity style={m.btnReplace} onPress={onReplace}>
            <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
            <Text style={m.btnReplaceText}>Remplacer le document</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Fonts.size.xl,
    fontFamily: Fonts.bold, fontWeight: '800',
    color: Colors.white,
  },
  headerSub: {
    fontSize: Fonts.size.sm,
    color: Colors.beigeLight,
    marginTop: 2,
  },

  progressWrap: {
    borderTopRightRadius: Radius.lg, borderTopLeftRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white ?? '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginHorizontal: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: '#EDE0DF',
    borderRadius: 4, overflow: 'hidden',
  },
  progressBar: { height: 8, borderRadius: 4 },
  progressPct: {
    fontSize: Fonts.size.sm ?? 13, fontFamily: Fonts.bold, fontWeight: '700',
    width: 36, textAlign: 'right',
  },

  statsRow: {
    flexDirection: 'row', gap: 1 , flexWrap: 'wrap',
    justifyContent: 'center', 
    paddingVertical:Spacing.md, paddingHorizontal: 1, 
    backgroundColor: Colors.white ?? '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    borderBottomRightRadius : Radius.lg, borderBottomLeftRadius : Radius.lg,
    marginHorizontal: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  loaderCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loaderText: { color: Colors.textMuted, fontSize: Fonts.size.sm ?? 13 },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadCard: {
    backgroundColor: '#fff', borderRadius: Radius.md ?? 12,
    padding: 32, alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  uploadText: {
    fontSize: Fonts.size.md ?? 15, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.bordeauxDark,
  },
});

const chip = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  text: { fontSize: 10, fontFamily: Fonts.bold, fontWeight: '700' },
});

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background,},

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Fonts.size.md ?? 15, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeauxDark },
  sub:   { fontSize: Fonts.size.xs ?? 11, color: Colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },

  body: {
    flex: 1, backgroundColor: '#F8F3F3',
    alignItems: 'center', justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  pdfPlaceholder: { alignItems: 'center', gap: 12, padding: Spacing.md },
  pdfText: { fontSize: Fonts.size.md ?? 15, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.bordeauxDark },
  pdfSub:  { fontSize: Fonts.size.sm ?? 13, color: Colors.textMuted, textAlign: 'center' },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  statusText: {
    flex: 1, fontSize: Fonts.size.sm ?? 13,
    color: Colors.bordeauxDark, fontFamily: Fonts.medium, fontWeight: '500',
  },

  actions: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    paddingBottom: 24, backgroundColor: '#fff',
  },
  btnReplace: {
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: Radius.md ?? 12, gap: 8,
  },
  btnReplaceText: {
    color: '#fff', fontSize: Fonts.size.md ?? 15, fontFamily: Fonts.bold, fontWeight: '700',
  },
});