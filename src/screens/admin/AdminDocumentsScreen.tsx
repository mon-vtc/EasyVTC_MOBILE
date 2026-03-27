// src/screens/admin/AdminDocumentsScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Image, Modal, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAdminDocuments }  from '../../hooks/useAdminDocuments';
import DocumentViewer         from '../../components/admin/DocumentViewer';
import type { AdminDocument } from '../../services/api/admin.document.api';



// ── URL de base Supabase Storage ─────────────────────────────
// file_url = chemin relatif → on préfixe pour obtenir l'URL publique
const SUPABASE_STORAGE_URL = process.env.SUPABASE_STORAGE_URL;

function resolveFileUrl(doc: AdminDocument): string {
  // Priorité : signed_url > file_url préfixée
  if (doc.signed_url && doc.signed_url.startsWith('http')) return doc.signed_url;
  if (doc.file_url   && doc.file_url.startsWith('http'))   return doc.file_url;
  if (doc.file_url) return `${SUPABASE_STORAGE_URL}${doc.file_url}`;
  return '';
}

type Props = { navigation: any };

const DOC_TYPE_LABELS: Record<string, string> = {
  license:     'Permis de conduire',
  insurance:   'Assurance véhicule',
  vtc_card:    'Carte VTC',
  kbis:        'KBIS',
  company_doc: 'Document société',
};

type DocStatus = 'pending' | 'validated' | 'rejected' | 'expired';
type FilterTab = 'all' | 'pending' | 'validated' | 'rejected';

const STATUS_CONFIG: Record<DocStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: 'En attente', bg: '#FFF3E0', color: '#E65100' },
  validated: { label: 'Validé',     bg: Colors.validatedBackground, color: '#2E7D32' },
  rejected:  { label: 'Rejeté',     bg: '#f5e2e2', color: '#C62828' },
  expired:   { label: 'Expiré',     bg: '#F3E5F5', color: '#6A1B9A' },
};

const TABS: { key: FilterTab; label: string; statusFilter?: DocStatus }[] = [
  { key: 'all',       label: 'Tous'        },
  { key: 'pending',   label: 'En attente',  statusFilter: 'pending'   },
  { key: 'validated', label: 'Validés',     statusFilter: 'validated' },
  { key: 'rejected',  label: 'Rejetés',     statusFilter: 'rejected'  },
];

function isPdf(filename: string, url: string) {
  return filename?.toLowerCase().endsWith('.pdf') || url?.toLowerCase().includes('.pdf');
}

// ── Miniature cliquable ───────────────────────────────────────
function FileThumbnail({ doc, onPress, loading }: {
  doc: AdminDocument; onPress: () => void; loading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const url      = resolveFileUrl(doc);
  const filename = doc.file_url?.split('/').pop() ?? 'document';
  const isDoc    = isPdf(filename, url) || imgError;

  return (
    <TouchableOpacity style={thumbStyles.wrapper} onPress={onPress} activeOpacity={0.75} disabled={loading}>
      {isDoc ? (
        <View style={thumbStyles.pdfRow}>
          <View style={thumbStyles.pdfIcon}>
            <Ionicons name="document-text" size={22} color="#E53935" />
          </View>
          <Text style={thumbStyles.filename} numberOfLines={1}>{filename}</Text>
          {loading
            ? <ActivityIndicator size="small" color={Colors.bordeaux} />
            : <Ionicons name="eye-outline" size={18} color={Colors.bordeaux} />
          }
        </View>
      ) : (
        <View style={thumbStyles.imgRow}>
          <Image
            source={{ uri: url }}
            style={thumbStyles.img}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
          <View style={thumbStyles.imgOverlay}>
            {loading
              ? <ActivityIndicator size="small" color={Colors.bordeaux} />
              : <><Ionicons name="eye-outline" size={22} color={Colors.textSecondary} /><Text style={thumbStyles.imgLabel}>Voir le document</Text></>
            }
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const thumbStyles = StyleSheet.create({
  wrapper:    { marginVertical: Spacing.xs },
  pdfRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.background, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm },
  pdfIcon:    { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  filename:   { fontSize: Fonts.size.sm, color: Colors.textSecondary, flex: 1 },
  imgRow:     { borderRadius: Radius.sm, overflow: 'hidden', height: 100,  borderColor: Colors.border,},
  img:        { width: '100%', height: '100%' },
  imgOverlay: { ...StyleSheet.absoluteFillObject,  backgroundColor: Colors.background, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', gap: 4 },
  imgLabel:   { color: Colors.textSecondary, fontSize: Fonts.size.xs, fontWeight: '600' },
});

// ── Carte document ────────────────────────────────────────────
function DocumentCard({ doc, onOpenViewer, onValidate, onReject, isActing, isFetchingThis }: {
  doc: AdminDocument; onOpenViewer: () => void;
  onValidate: () => void; onReject: () => void;
  isActing: boolean; isFetchingThis: boolean;
}) {
  const driver    = doc.driver?.user;
  const status    = (doc.status ?? 'pending') as DocStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const typeLabel = DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type;
  const initials  = driver ? `${driver.first_name?.[0] ?? ''}${driver.last_name?.[0] ?? ''}`.toUpperCase() : '?';
  const submittedAt = doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const expiresAt   = doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <View style={cStyles.wrapper}>
      <View style={cStyles.header}>
        <View style={cStyles.avatar}>
          {driver?.profile_photo_url
            ? <Image source={{ uri: driver.profile_photo_url }} style={cStyles.avatarImg} />
            : <Text style={cStyles.initials}>{initials}</Text>}
        </View>
        <View style={cStyles.driverInfo}>
          <Text style={cStyles.driverName}>{driver ? `${driver.first_name} ${driver.last_name}` : 'Chauffeur inconnu'}</Text>
          <Text style={cStyles.docType}>{typeLabel}</Text>
        </View>
        <View style={[cStyles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[cStyles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Miniature — tap → fetch signed_url → ouvre viewer */}
      <FileThumbnail doc={doc} onPress={onOpenViewer} loading={isFetchingThis} />

      <Text style={cStyles.dates}>
        Soumis le {submittedAt}{expiresAt ? `   ·   Expire le ${expiresAt}` : ''}
      </Text>

      {status === 'rejected' && doc.rejection_reason && (
        <View style={cStyles.rejectionBox}>
          <Ionicons name="information-circle-outline" size={14} color="#C62828" />
          <Text style={cStyles.rejectionText}>{doc.rejection_reason}</Text>
        </View>
      )}

      {status === 'pending' && (
        <View style={cStyles.actions}>
          <TouchableOpacity style={[cStyles.btn, { backgroundColor: '#43A047' }]} onPress={onValidate} disabled={isActing} activeOpacity={0.85}>
            {isActing ? <ActivityIndicator size="small" color={Colors.white} /> : <><Ionicons name="checkmark" size={16} color={Colors.white} /><Text style={cStyles.btnText}>Valider</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={[cStyles.btn, { backgroundColor: '#E53935' }]} onPress={onReject} disabled={isActing} activeOpacity={0.85}>
            <Ionicons name="close" size={16} color={Colors.white} /><Text style={cStyles.btnText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === 'validated' && (
        <View style={[cStyles.statusRow, { backgroundColor: Colors.validatedBackground }]}>
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          <Text style={[cStyles.statusRowText, { color: '#2E7D32' }]}>Document validé</Text>
        </View>
      )}
      {status === 'rejected' && (
        <View style={[cStyles.statusRow, { backgroundColor: Colors.rejectedBackground  }]}>
          <Ionicons name="close-circle" size={18} color="#C62828" />
          <Text style={[cStyles.statusRowText, { color: '#C62828' }]}>Document rejeté</Text>
        </View>
      )}
    </View>
  );
}

const cStyles = StyleSheet.create({
  wrapper:       { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  header:        { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.beigeLight ?? '#F0EAE8', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, overflow: 'hidden' },
  avatarImg:     { width: '100%', height: '100%' },
  initials:      { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  driverInfo:    { flex: 1 },
  driverName:    { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  docType:       { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  badge:         { borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  badgeText:     { fontSize: Fonts.size.xs, fontWeight: '700' },
  dates:         { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  rejectionBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: '#f5e2e2', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  rejectionText: { fontSize: Fonts.size.xs, color: '#C62828', flex: 1 },
  actions:       { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  btn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: 12, borderRadius: Radius.md },
  btnText:       { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.sm },
  statusRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.md, marginTop: Spacing.xs },
  statusRowText: { fontWeight: '700', fontSize: Fonts.size.sm },
});

// ── Modal motif rejet ─────────────────────────────────────────
function RejectModal({ visible, onClose, onConfirm, isActing }: {
  visible: boolean; onClose: () => void; onConfirm: (r: string) => void; isActing: boolean;
}) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { setReason(''); onClose(); }}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          <Text style={mStyles.title}>Motif de rejet</Text>
          <Text style={mStyles.subtitle}>Expliquez pourquoi ce document est rejeté (min. 10 caractères).</Text>
          <TextInput style={mStyles.input} multiline numberOfLines={4} placeholder="Ex: Document illisible..." placeholderTextColor={Colors.textMuted} value={reason} onChangeText={setReason} autoFocus />
          <Text style={[mStyles.counter, { color: isValid ? '#43A047' : Colors.textMuted }]}>{reason.trim().length} / 10 caractères minimum</Text>
          <View style={mStyles.actions}>
            <TouchableOpacity style={mStyles.btnCancel} onPress={() => { setReason(''); onClose(); }}><Text style={mStyles.btnCancelText}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={[mStyles.btnConfirm, !isValid && { opacity: 0.5 }]} onPress={() => { if (isValid) { onConfirm(reason.trim()); setReason(''); } }} disabled={!isValid || isActing}>
              {isActing ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={mStyles.btnConfirmText}>Rejeter</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  card:          { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg },
  title:         { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle:      { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  input:         { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Fonts.size.md, color: Colors.textPrimary, textAlignVertical: 'top', minHeight: 100, backgroundColor: Colors.background },
  counter:       { fontSize: Fonts.size.xs, marginTop: Spacing.xs, marginBottom: Spacing.md },
  actions:       { flexDirection: 'row', gap: Spacing.sm },
  btnCancel:     { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnCancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Fonts.size.sm },
  btnConfirm:    { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: '#E53935', alignItems: 'center' },
  btnConfirmText:{ color: Colors.white, fontWeight: '700', fontSize: Fonts.size.sm },
});

// ── Screen ────────────────────────────────────────────────────
export default function AdminDocumentsScreen({ navigation }: Props) {
  const {
    documents, stats, isLoading, isActing, isFetching, error,
    fetchDocuments, fetchStats, fetchDocumentById,
    validateDocument, rejectDocument, clearError,
  } = useAdminDocuments();

  const [activeTab,    setActiveTab]    = useState<FilterTab>('all');
  const [refreshing,   setRefreshing]   = useState(false);
  const [actingId,     setActingId]     = useState<string | null>(null);
  const [fetchingId,   setFetchingId]   = useState<string | null>(null); // doc en cours de fetch
  const [viewerDoc,    setViewerDoc]    = useState<AdminDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const sf = TABS.find(t => t.key === activeTabRef.current)?.statusFilter;
    await Promise.all([fetchDocuments(sf ? { status: sf } : undefined), fetchStats()]);
    if (showRefresh) setRefreshing(false);
  }, [fetchDocuments, fetchStats]);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    const sf = TABS.find(t => t.key === tab)?.statusFilter;
    fetchDocuments(sf ? { status: sf } : undefined);
  };

  // ── Ouvrir le viewer — fetch le détail pour récupérer signed_url ──
  const handleOpenViewer = useCallback(async (doc: AdminDocument) => {
    setFetchingId(doc.id);
    try {
      // Tente de récupérer le détail avec signed_url
      const detail = await fetchDocumentById(doc.id);
      const resolved = detail ?? doc;

      // Construit l'URL finale
      const fileUrl = resolveFileUrl(resolved);
      if (!fileUrl) {
        Alert.alert('Erreur', 'URL du document introuvable.');
        return;
      }

      setViewerDoc({ ...resolved, signed_url: fileUrl });
    } finally {
      setFetchingId(null);
    }
  }, [fetchDocumentById]);

  // ── Valider ───────────────────────────────────────────────────
  const handleValidate = (docId: string) => {
    Alert.alert('Valider ce document ?', 'Le chauffeur sera notifié.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', onPress: async () => {
          setActingId(docId);
          const ok = await validateDocument(docId);
          setActingId(null);
          if (ok) setViewerDoc(p => p?.id === docId ? { ...p, status: 'validated' } : p);
          else Alert.alert('Erreur', error ?? 'Impossible de valider.');
        },
      },
    ]);
  };

  // ── Rejeter ───────────────────────────────────────────────────
  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const docId = rejectTarget;
    setRejectTarget(null);
    setActingId(docId);
    const ok = await rejectDocument(docId, { reason });
    setActingId(null);
    if (ok) setViewerDoc(p => p?.id === docId ? { ...p, status: 'rejected', rejection_reason: reason } : p);
    else Alert.alert('Erreur', error ?? 'Impossible de rejeter.');
  };

  const tabCounts = useMemo(() => ({
    all: stats?.total ?? 0, pending: stats?.pending ?? 0,
    validated: stats?.validated ?? 0, rejected: stats?.rejected ?? 0,
  }), [stats]);

  return (
    <View style={s.flex}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Documents chauffeurs</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && s.tabActive]} onPress={() => handleTabChange(tab.key)}>
              <Text style={[s.tabCount, activeTab === tab.key && s.tabCountActive]}>{tabCounts[tab.key]}</Text>
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={clearError}>
          <Text style={s.errorText}>⚠️ {error}</Text>
        </TouchableOpacity>
      )}

      {isLoading && !refreshing ? (
        <View style={s.centered}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>
      ) : (
        <ScrollView style={s.flex} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.bordeaux]} tintColor={Colors.bordeaux} />}
        >
          {documents.length === 0
            ? <View style={s.empty}><Ionicons name="document-outline" size={52} color={Colors.textMuted} /><Text style={s.emptyText}>Aucun document trouvé</Text></View>
            : documents.map(doc => (
                <DocumentCard
                  key={doc.id} doc={doc}
                  onOpenViewer={() => handleOpenViewer(doc)}
                  onValidate={()   => handleValidate(doc.id)}
                  onReject={()     => setRejectTarget(doc.id)}
                  isActing={isActing && actingId === doc.id}
                  isFetchingThis={isFetching && fetchingId === doc.id}
                />
              ))
          }
        </ScrollView>
      )}

      {/* ── Viewer plein écran ── */}
      {viewerDoc && (
        <DocumentViewer
          visible={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          fileUrl={viewerDoc.signed_url ?? ''}
          filename={viewerDoc.file_url?.split('/').pop() ?? 'document'}
          docType={DOC_TYPE_LABELS[viewerDoc.doc_type] ?? viewerDoc.doc_type}
          driverName={viewerDoc.driver?.user ? `${viewerDoc.driver.user.first_name} ${viewerDoc.driver.user.last_name}` : 'Chauffeur'}
          status={viewerDoc.status as any}
          onValidate={viewerDoc.status === 'pending' ? () => handleValidate(viewerDoc.id) : undefined}
          onReject={viewerDoc.status === 'pending'   ? () => setRejectTarget(viewerDoc.id) : undefined}
          isActing={isActing && actingId === viewerDoc.id}
        />
      )}

      <RejectModal
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        isActing={isActing}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: Colors.background },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:        { padding: Spacing.md, paddingTop: Spacing.sm },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
  headerBtn:     { padding: Spacing.sm, width: 40 },
  headerTitle:   { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },
  tabsContainer: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection : 'row', alignItems: 'center', marginHorizontal : Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.sm },
  tabs:          { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs },
  tab:           { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, minWidth: 72, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, },
  tabActive:     { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
  tabCount:      { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
  tabCountActive:{ color: Colors.white },
  tabLabel:      { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  tabLabelActive:{ color: 'rgba(255,255,255,0.85)' },
  errorBanner:   { backgroundColor: Colors.errorLight ?? '#f5e2e2', borderLeftWidth: 3, borderLeftColor: Colors.error ?? '#E53935', padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.sm },
  errorText:     { color: Colors.error ?? '#E53935', fontSize: Fonts.size.sm },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText:     { color: Colors.textMuted, fontSize: Fonts.size.md },
});