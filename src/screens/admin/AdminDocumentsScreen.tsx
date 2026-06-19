// src/screens/admin/AdminDocumentsScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Image, Modal, TextInput,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAdminDocuments }  from '../../hooks/useAdminDocuments';
import { useAlert } from '../../hooks/useAlert';
import DocumentViewer         from '../../components/admin/DocumentViewer';
import type { AdminDocument } from '../../services/api/admin.document.api';
import { useToast } from '../../hooks/useToast';

// ── URL de base Supabase Storage ─────────────────────────────
const SUPABASE_STORAGE_URL = process.env.SUPABASE_STORAGE_URL;

function resolveFileUrl(doc: AdminDocument): string {
  if (doc.signed_url && doc.signed_url.startsWith('http')) return doc.signed_url;
  if (doc.file_url   && doc.file_url.startsWith('http'))   return doc.file_url;
  if (doc.file_url) return `${SUPABASE_STORAGE_URL}${doc.file_url}`;
  return '';
}

type Props = { navigation: any };

// ── Types de documents FIXES (ordre canonique) ───────────────
const DOC_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; required: boolean }[] = [
  { key: 'license',          label: 'Permis de conduire',          icon: 'card-outline',             required: true  },
  { key: 'vtc_card',         label: 'Carte professionnelle VTC',   icon: 'id-card-outline',          required: true  },
  { key: 'medical_visit',    label: 'Visite médicale',             icon: 'medical-outline',          required: true  },
  { key: 'rc_pro',           label: 'Assurance RC Pro',            icon: 'shield-checkmark-outline', required: true  },
  { key: 'kbis',             label: 'Extrait KBIS',                icon: 'business-outline',         required: true  },
  { key: 'vtc_register',     label: 'Certificat registre VTC',     icon: 'document-text-outline',    required: true  },
  { key: 'rir',              label: 'Relevé d\'information RIR',   icon: 'stats-chart-outline',      required: true  },
  { key: 'id_card',          label: 'Pièce d\'identité',           icon: 'person-outline',           required: true  },
  { key: 'vehicle_insurance',label: 'Assurance véhicule',          icon: 'car-outline',              required: true  },
  { key: 'grey_card',        label: 'Carte grise',                 icon: 'document-outline',         required: true  },
];

type DocStatus = 'pending' | 'validated' | 'rejected' | 'expired' | 'missing';
type FilterTab = 'all' | 'pending' | 'validated' | 'rejected';

const STATUS_CONFIG: Record<DocStatus, { label: string; bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:   { label: 'En attente', bg: '#FFF3E0', color: '#E65100', icon: 'time-outline'          },
  validated: { label: 'Validé',     bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle'      },
  rejected:  { label: 'Rejeté',     bg: '#f5e2e2', color: '#C62828', icon: 'close-circle'           },
  expired:   { label: 'Expiré',     bg: '#F3E5F5', color: '#6A1B9A', icon: 'alert-circle-outline'  },
  missing:   { label: 'Manquant',   bg: Colors.background, color: Colors.textMuted, icon: 'add-circle-outline' },
};

const TABS: { key: FilterTab; label: string; statusFilter?: Exclude<DocStatus, 'missing'> }[] = [
  { key: 'all',       label: 'Tous'        },
  { key: 'pending',   label: 'En attente',  statusFilter: 'pending'   },
  { key: 'validated', label: 'Validés',     statusFilter: 'validated' },
  { key: 'rejected',  label: 'Rejetés',     statusFilter: 'rejected'  },
];

// ── Helpers ───────────────────────────────────────────────────
function isPdf(filename: string, url: string) {
  return filename?.toLowerCase().endsWith('.pdf') || url?.toLowerCase().includes('.pdf');
}

/** Regroupe les documents par chauffeur (driverId) */
function groupByDriver(documents: AdminDocument[]): DriverFolder[] {
  const map = new Map<string, DriverFolder>();

  for (const doc of documents) {
    const driverId = doc.driver?.user?.id ?? 'unknown';
    if (!map.has(driverId)) {
      map.set(driverId, {
        driverId,
        driver: doc.driver,
        documents: {},
      });
    }
    const folder = map.get(driverId)!;
    // Un seul doc par type (le plus récent — on garde le premier rencontré si déjà présent)
    if (!folder.documents[doc.doc_type]) {
      folder.documents[doc.doc_type] = doc;
    }
  }

  return Array.from(map.values());
}

interface DriverFolder {
  driverId: string;
  driver:   AdminDocument['driver'];
  documents: Record<string, AdminDocument>; // clé = doc_type
}

function folderStats(folder: DriverFolder) {
  const total     = DOC_TYPES.length;
  const uploaded  = DOC_TYPES.filter(t => !!folder.documents[t.key]).length;
  const pending   = DOC_TYPES.filter(t => folder.documents[t.key]?.status === 'pending').length;
  const validated = DOC_TYPES.filter(t => folder.documents[t.key]?.status === 'validated').length;
  const rejected  = DOC_TYPES.filter(t => folder.documents[t.key]?.status === 'rejected').length;
  const missing   = total - uploaded;
  const pct       = Math.round((uploaded / total) * 100);
  return { total, uploaded, pending, validated, rejected, missing, pct };
}

// ── Chip de statut ────────────────────────────────────────────
function StatusChip({ status, count }: { status: DocStatus; count: number }) {
  if (count === 0) return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[chipS.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[chipS.text, { color: cfg.color }]}>{count} {cfg.label.toLowerCase()}</Text>
    </View>
  );
}
const chipS = StyleSheet.create({
  wrap: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 10, fontWeight: '700' },
});


function SearchBar({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <View style={sbStyles.wrap}>
      <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
      <TextInput
        style={sbStyles.input}
        placeholder="Rechercher un chauffeur..."
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 10, marginBottom: Spacing.sm },
  input: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary, padding: 0 },
});

// ── Carte dossier chauffeur ───────────────────────────────────
function DriverFolderCard({ folder, onPress }: { folder: DriverFolder; onPress: () => void }) {
  const driver     = folder.driver?.user;
  const s          = folderStats(folder);
  const isComplete = s.pct === 100;
  const hasRejected= s.rejected > 0;
  const initials   = driver
    ? `${driver.first_name?.[0] ?? ''}${driver.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  const nameColor = isComplete ? '#1B5E20' : hasRejected ? '#7F0000' : Colors.textPrimary;
  const metaColor = isComplete ? '#2E7D32' : hasRejected ? '#C62828' : Colors.textMuted;

  return (
    <TouchableOpacity style={fStyles.wrap} onPress={onPress} activeOpacity={0.75}>
      {/* Onglet du dossier */}
      <View style={[fStyles.tab, {
        backgroundColor: isComplete ? '#66BB6A' : hasRejected ? '#E57373' : '#D4960A',
      }]}>
        <Text style={[fStyles.tabText, {
          color: isComplete ? '#1B5E20' : hasRejected ? '#7F0000' : '#7A5400',
        }]} numberOfLines={1}>
          {driver ? `${driver.first_name} ${driver.last_name}` : 'Chauffeur inconnu'}
        </Text>
      </View>

      {/* Corps du dossier */}
      <View style={[fStyles.body, {
        backgroundColor: isComplete ? '#C8E6C9' : hasRejected ? '#FFCDD2' : '#F0B429',
        borderColor:     isComplete ? '#66BB6A'  : hasRejected ? '#E57373'  : '#C48B00',
      }]}>
        {/* Avatar initiales */}
        <View style={fStyles.avatar}>
          {driver?.profile_photo_url
            ? <Image source={{ uri: driver.profile_photo_url }} style={fStyles.avatarImg} />
            : <Text style={[fStyles.initials, { color: isComplete ? '#1B5E20' : hasRejected ? '#7F0000' : '#5C3D00' }]}>
                {initials}
              </Text>}
        </View>

        {/* Info */}
        <View style={fStyles.info}>
          <Text style={[fStyles.name, { color: nameColor }]}>
            {driver ? `${driver.first_name} ${driver.last_name}` : 'Chauffeur inconnu'}
          </Text>
          <Text style={[fStyles.meta, { color: metaColor }]}>
            {s.uploaded} / {s.total} documents
          </Text>

          {/* Barre progression */}
          <View style={fStyles.track}>
            <View style={[fStyles.fill, {
              width: `${s.pct}%` as any,
              backgroundColor: isComplete ? '#2E7D32' : hasRejected ? '#C62828' : 'rgba(0,0,0,0.35)',
            }]} />
          </View>

          {/* Chips */}
          <View style={fStyles.chips}>
            {s.validated > 0 && <Text style={[fStyles.chip, fStyles.chipOk]}>{s.validated} validés</Text>}
            {s.pending   > 0 && <Text style={[fStyles.chip, fStyles.chipWait]}>{s.pending} en attente</Text>}
            {s.rejected  > 0 && <Text style={[fStyles.chip, fStyles.chipRej]}>{s.rejected} rejetés</Text>}
            {s.missing   > 0 && <Text style={[fStyles.chip, fStyles.chipMiss]}>{s.missing} manquants</Text>}
          </View>
        </View>

        {/* Mini-docs décoratifs + compteur */}
        <View style={fStyles.docsCol}>
          <View style={fStyles.miniDocs}>
            {DOC_TYPES.slice(0, 4).map(t => {
              const doc    = folder.documents[t.key];
              const status = doc?.status ?? 'missing';
              const lineColor = status === 'validated' ? '#43A047'
                : status === 'pending' ? '#FB8C00'
                : status === 'rejected' ? '#E53935'
                : 'transparent';
              return (
                <View key={t.key} style={[fStyles.miniDoc, { opacity: !doc ? 0.35 : 1 }]}>
                  <View style={fStyles.miniDocEar} />
                  <View style={[fStyles.miniDocLine, { backgroundColor: lineColor }]} />
                  <View style={[fStyles.miniDocLine, { backgroundColor: lineColor, opacity: 0.6, marginTop: 2 }]} />
                </View>
              );
            })}
          </View>
          <Text style={[fStyles.docCount, { color: isComplete ? '#1B5E20' : '#5C3D00' }]}>
            {s.uploaded}/{s.total}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fStyles = StyleSheet.create({
  wrap:        { marginBottom: 14 },
  tab:         { height: 18, width: 120, borderRadius: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginLeft: 14, justifyContent: 'center', paddingHorizontal: 10 },
  tabText:     { fontSize: 10, fontWeight: '700' },
  body:        { borderRadius: 6, borderTopLeftRadius: 0, borderWidth: 1.5, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg:   { width: '100%', height: '100%' },
  initials:    { fontSize: Fonts.size.md, fontWeight: '700' },
  info:        { flex: 1 },
  name:        { fontSize: Fonts.size.sm, fontWeight: '700' },
  meta:        { fontSize: Fonts.size.xs, marginTop: 1 },
  track:       { height: 3, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 3, overflow: 'hidden', marginTop: 5, marginBottom: 5 },
  fill:        { height: 3, borderRadius: 3 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  chip:        { fontSize: 9, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  chipOk:      { backgroundColor: 'rgba(46,125,50,0.18)',  color: '#1B5E20' },
  chipWait:    { backgroundColor: 'rgba(0,0,0,0.12)',      color: '#5C3D00' },
  chipRej:     { backgroundColor: 'rgba(198,40,40,0.18)',  color: '#7F0000' },
  chipMiss:    { backgroundColor: 'rgba(0,0,0,0.10)',      color: '#6D5500' },
  docsCol:     { alignItems: 'center', gap: 4, flexShrink: 0 },
  miniDocs:    { flexDirection: 'row', gap: 3 },
  miniDoc:     { width: 14, height: 18, borderRadius: 2, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', padding: 2, justifyContent: 'flex-end' },
  miniDocEar:  { position: 'absolute', top: 0, right: 0, width: 5, height: 5, backgroundColor: '#E0C88A', borderBottomLeftRadius: 2, borderLeftWidth: 0.5, borderBottomWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)' },
  miniDocLine: { height: 1.5, borderRadius: 1, backgroundColor: 'transparent' },
  docCount:    { fontSize: 9, fontWeight: '700' },
});

// ── Ligne document dans le détail ────────────────────────────
function DocRow({ docType, doc, onOpen, onValidate, onReject, isActing, isFetching }: {
  docType: typeof DOC_TYPES[number];
  doc:     AdminDocument | undefined;
  onOpen:  () => void;
  onValidate: () => void;
  onReject:   () => void;
  isActing:   boolean;
  isFetching: boolean;
}) {
  const status = (doc?.status ?? 'missing') as DocStatus;
  const cfg    = STATUS_CONFIG[status];
  const expiryDate = doc?.expiry_date
    ? new Date(doc.expiry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const submittedAt = doc?.created_at
    ? new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <View style={dStyles.row}>
      {/* Icône type */}
      <View style={[dStyles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={docType.icon} size={20} color={cfg.color} />
      </View>

      {/* Info */}
      <View style={dStyles.info}>
        <View style={dStyles.titleRow}>
          <Text style={dStyles.title}>{docType.label}</Text>
          {docType.required && (
            <View style={dStyles.reqBadge}><Text style={dStyles.reqText}>Requis</Text></View>
          )}
        </View>
        {doc ? (
          <Text style={dStyles.sub}>
            {submittedAt && `Soumis le ${submittedAt}`}
            {expiryDate  && `  ·  Expire ${expiryDate}`}
          </Text>
        ) : (
          <Text style={dStyles.sub}>Non fourni</Text>
        )}
        {status === 'rejected' && doc?.rejection_reason && (
          <Text style={[dStyles.sub, { color: '#C62828' }]} numberOfLines={2}>{doc.rejection_reason}</Text>
        )}
      </View>

      {/* Droite */}
      <View style={dStyles.right}>
        <View style={[dStyles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[dStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {doc && status !== 'missing' && (
          <TouchableOpacity style={dStyles.eyeBtn} onPress={onOpen} disabled={isFetching}>
            {isFetching
              ? <ActivityIndicator size="small" color={Colors.bordeaux} />
              : <Ionicons name="eye-outline" size={16} color={Colors.bordeaux} />}
          </TouchableOpacity>
        )}

        {status === 'pending' && (
          <View style={dStyles.actRow}>
            <TouchableOpacity style={[dStyles.actBtn, { backgroundColor: '#43A047' }]} onPress={onValidate} disabled={isActing}>
              {isActing
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="checkmark" size={13} color="#fff" /><Text style={dStyles.actText}>Valider</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[dStyles.actBtn, { backgroundColor: '#E53935' }]} onPress={onReject} disabled={isActing}>
              <Ionicons name="close" size={13} color="#fff" /><Text style={dStyles.actText}>Rejeter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const dStyles = StyleSheet.create({
  row:      { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info:     { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  title:    { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  reqBadge: { backgroundColor: Colors.bordeaux + '18', borderRadius: Radius.full, paddingHorizontal: 5, paddingVertical: 1 },
  reqText:  { fontSize: 9, fontWeight: '700', color: Colors.bordeaux },
  sub:      { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  right:    { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText:{ fontSize: 10, fontWeight: '700' },
  eyeBtn:   { padding: 4 },
  actRow:   { flexDirection: 'row', gap: 4 },
  actBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm },
  actText:  { color: '#fff', fontWeight: '700', fontSize: 11 },
});

// ── Header dossier chauffeur ──────────────────────────────────
function FolderHeader({ folder }: { folder: DriverFolder }) {
  const driver = folder.driver?.user;
  const stats  = folderStats(folder);
  const barColor = stats.pct === 100 ? '#43A047' : Colors.bordeaux;

  return (
    <View style={hStyles.wrap}>
      <View style={hStyles.row}>
        <View style={hStyles.avatar}>
          {driver?.profile_photo_url
            ? <Image source={{ uri: driver.profile_photo_url }} style={hStyles.avatarImg} />
            : <Text style={hStyles.initials}>
                {driver ? `${driver.first_name?.[0] ?? ''}${driver.last_name?.[0] ?? ''}`.toUpperCase() : '?'}
              </Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hStyles.name}>
            {driver ? `${driver.first_name} ${driver.last_name}` : 'Chauffeur inconnu'}
          </Text>
          <Text style={hStyles.meta}>{stats.pct}% complet · {stats.uploaded}/{stats.total} documents</Text>
          <View style={hStyles.track}>
            <View style={[hStyles.fill, { width: `${stats.pct}%` as any, backgroundColor: barColor }]} />
          </View>
        </View>
      </View>
      <View style={hStyles.chips}>
        <StatusChip status="validated" count={stats.validated} />
        <StatusChip status="pending"   count={stats.pending}   />
        <StatusChip status="rejected"  count={stats.rejected}  />
        <StatusChip status="missing"   count={stats.missing}   />
      </View>
    </View>
  );
}

const hStyles = StyleSheet.create({
  wrap:     { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar:   { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.beigeLight ?? '#F0EAE8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg:{ width: '100%', height: '100%' },
  initials: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.bordeaux },
  name:     { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  meta:     { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  track:    { height: 5, backgroundColor: '#EDE0DF', borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  fill:     { height: 5, borderRadius: 4 },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
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
          <TextInput
            style={mStyles.input} multiline numberOfLines={4}
            placeholder="Ex: Document illisible..." placeholderTextColor={Colors.textMuted}
            value={reason} onChangeText={setReason} autoFocus
          />
          <Text style={[mStyles.counter, { color: isValid ? '#43A047' : Colors.textMuted }]}>
            {reason.trim().length} / 10 caractères minimum
          </Text>
          <View style={mStyles.actions}>
            <TouchableOpacity style={mStyles.btnCancel} onPress={() => { setReason(''); onClose(); }}>
              <Text style={mStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.btnConfirm, !isValid && { opacity: 0.5 }]}
              onPress={() => { if (isValid) { onConfirm(reason.trim()); setReason(''); } }}
              disabled={!isValid || isActing}
            >
              {isActing
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={mStyles.btnConfirmText}>Rejeter</Text>}
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

// ── SCREEN ────────────────────────────────────────────────────
type ScreenView = 'list' | 'detail';

export default function AdminDocumentsScreen({ navigation }: Props) {
  const {
    documents, stats, isLoading, isActing, isFetching, error,
    fetchDocuments, fetchStats, fetchDocumentById,
    validateDocument, rejectDocument, clearError,
  } = useAdminDocuments();

  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const [activeTab,    setActiveTab]    = useState<FilterTab>('all');
  const [refreshing,   setRefreshing]   = useState(false);
  const [actingId,     setActingId]     = useState<string | null>(null);
  const [fetchingId,   setFetchingId]   = useState<string | null>(null);
  const [viewerDoc,    setViewerDoc]    = useState<AdminDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  // ── Navigation interne : liste → dossier ──────────────────
  const [currentView,   setCurrentView]   = useState<ScreenView>('list');
  const [activeFolder,  setActiveFolder]  = useState<DriverFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    // Retour à la liste quand on change d'onglet depuis le détail
    setCurrentView('list');
    setActiveFolder(null);
    setSearchQuery('');
  };

  // ── Groupement par chauffeur ──────────────────────────────
const folders = useMemo(() => {
  const grouped = groupByDriver(documents);
  const filtered = activeTab === 'all'
    ? grouped
    : grouped.filter(f => DOC_TYPES.some(t => f.documents[t.key]?.status === activeTab));

  if (!searchQuery.trim()) return filtered;
  const q = searchQuery.toLowerCase().trim();
  return filtered.filter(f => {
    const u = f.driver?.user;
    if (!u) return false;
    return `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
  });
}, [documents, activeTab, searchQuery]);

  // ── Ouvrir dossier ────────────────────────────────────────
  const openFolder = (folder: DriverFolder) => {
    setActiveFolder(folder);
    setCurrentView('detail');
  };

  const goBackToList = () => {
    setCurrentView('list');
    setActiveFolder(null);
  };

  // ── Ouvrir viewer document ────────────────────────────────
  const handleOpenViewer = useCallback(async (doc: AdminDocument) => {
    setFetchingId(doc.id);
    try {
      const detail  = await fetchDocumentById(doc.id);
      const resolved = detail ?? doc;
      const fileUrl  = resolveFileUrl(resolved);
      if (!fileUrl) { showToast({ type: 'error', title: 'Erreur', message: 'URL du document introuvable.' }); return; }
      setViewerDoc({ ...resolved, signed_url: fileUrl });
    } finally {
      setFetchingId(null);
    }
  }, [fetchDocumentById]);

  // ── Valider ───────────────────────────────────────────────
  const handleValidate = (docId: string) => {
    showAlert({title: 'Valider ce document ?', message: 'Le chauffeur sera notifié.', buttons: [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', onPress: async () => {
          setActingId(docId);
          const ok = await validateDocument(docId);
          setActingId(null);
          if (ok) {
            setViewerDoc(p => p?.id === docId ? { ...p, status: 'validated' } : p);
            // Rafraîchir le dossier actif
            if (activeFolder) {
              setActiveFolder(prev => prev ? {
                ...prev, 
                documents: {
                  ...prev.documents,
                  ...Object.fromEntries(
                    Object.entries(prev.documents).map(([k, v]) =>
                      v.id === docId ? [k, { ...v, status: 'validated' }] : [k, v]
                    )
                  ),
                },
              } : null);
            }
          } else showToast({ type: 'error', title: 'Erreur', message: error ?? 'Impossible de valider.' });
        },
      },
    ]});
  };

  // ── Rejeter ───────────────────────────────────────────────
  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const docId = rejectTarget;
    setRejectTarget(null);
    setActingId(docId);
    const ok = await rejectDocument(docId, { reason });
    setActingId(null);
    if (ok) {
      setViewerDoc(p => p?.id === docId ? { ...p, status: 'rejected', rejection_reason: reason } : p);
      if (activeFolder) {
        setActiveFolder(prev => prev ? {
          ...prev,
          documents: {
            ...prev.documents,
            ...Object.fromEntries(
              Object.entries(prev.documents).map(([k, v]) =>
                v.id === docId ? [k, { ...v, status: 'rejected', rejection_reason: reason }] : [k, v]
              )
            ),
          },
        } : null);
      }
    } else showToast({ type: 'error', title: 'Erreur', message: error ?? 'Impossible de rejeter.' });
  };

  const tabCounts = useMemo(() => ({
    all:       stats?.total     ?? 0,
    pending:   stats?.pending   ?? 0,
    validated: stats?.validated ?? 0,
    rejected:  stats?.rejected  ?? 0,
  }), [stats]);

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <View style={s.flex}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={currentView === 'detail' ? goBackToList : () => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            {currentView === 'detail' && activeFolder?.driver?.user
              ? `${activeFolder.driver.user.first_name} ${activeFolder.driver.user.last_name}`
              : 'Documents chauffeurs'}
          </Text>
          {currentView === 'detail' && activeFolder && (
            <Text style={s.headerSub}>
              {folderStats(activeFolder).uploaded} / {DOC_TYPES.length} documents fournis
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tabs (liste seulement) ── */}
      {currentView === 'list' && (
        <View style={s.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, activeTab === tab.key && s.tabActive]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Text style={[s.tabCount, activeTab === tab.key && s.tabCountActive]}>{tabCounts[tab.key]}</Text>
                <Text style={[s.tabLabel,  activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={clearError}>
          <Text style={s.errorText}>⚠️ {error}</Text>
        </TouchableOpacity>
      )}

      {isLoading && !refreshing ? (
        <View style={s.centered}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>
      ) : (
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[Colors.bordeaux]}
              tintColor={Colors.bordeaux}
            />
          }
        >
          {/* ── VUE LISTE : classeurs par chauffeur ── */}
          {currentView === 'list' && (
            <>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              {folders.length === 0
                ? <View style={s.empty}>
                    <Ionicons name="folder-open-outline" size={52} color={Colors.textMuted} />
                    <Text style={s.emptyText}>Aucun chauffeur trouvé</Text>
                  </View>
                : folders.map(folder => (
                    <DriverFolderCard
                      key={folder.driverId}
                      folder={folder}
                      onPress={() => openFolder(folder)}
                    />
                  ))
              }
            </>
          )}

          {/* ── VUE DÉTAIL : dossier d'un chauffeur ── */}
          {currentView === 'detail' && activeFolder && (
            <>
              <FolderHeader folder={activeFolder} />

              {DOC_TYPES.map(docType => {
                const doc = activeFolder.documents[docType.key];
                return (
                  <DocRow
                    key={docType.key}
                    docType={docType}
                    doc={doc}
                    onOpen={() => doc && handleOpenViewer(doc)}
                    onValidate={() => doc && handleValidate(doc.id)}
                    onReject={() => doc && setRejectTarget(doc.id)}
                    isActing={isActing && !!doc && actingId === doc.id}
                    isFetching={isFetching && !!doc && fetchingId === doc.id}
                  />
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Viewer plein écran ── */}
      {viewerDoc && (
        <DocumentViewer
          visible={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          fileUrl={viewerDoc.signed_url ?? ''}
          filename={viewerDoc.file_url?.split('/').pop() ?? 'document'}
          docType={DOC_TYPES.find(t => t.key === viewerDoc.doc_type)?.label ?? viewerDoc.doc_type}
          driverName={viewerDoc.driver?.user
            ? `${viewerDoc.driver.user.first_name} ${viewerDoc.driver.user.last_name}`
            : 'Chauffeur'}
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
  headerSub:     { color: 'rgba(255,255,255,0.75)', fontSize: Fonts.size.xs, marginTop: 2 },
  tabsContainer: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.sm },
  tabs:          { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs },
  tab:           { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, minWidth: 72, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
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