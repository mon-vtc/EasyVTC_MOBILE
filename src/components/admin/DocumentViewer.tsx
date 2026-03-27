// src/components/admin/DocumentViewer.tsx
// ─────────────────────────────────────────────────────────────
//  Viewer plein écran — Android + iOS
//
//  PDF   → FileSystem.downloadAsync() → Sharing.shareAsync()
//  Image → FileSystem.downloadAsync() → Image depuis cache local
//
//  Packages : expo-file-system, expo-sharing, expo-web-browser
// ─────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, ActivityIndicator,
  Platform, Dimensions, StatusBar,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing   from 'expo-sharing';
import * as Browser   from 'expo-web-browser';
import { Ionicons }   from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

const { width: W, height: H } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────
export type DocViewerStatus = 'pending' | 'validated' | 'rejected' | 'expired';

export interface DocumentViewerProps {
  visible:     boolean;
  onClose:     () => void;
  fileUrl:     string;
  filename:    string;
  docType:     string;
  driverName:  string;
  status:      DocViewerStatus;
  onValidate?: () => void;
  onReject?:   () => void;
  isActing?:   boolean;
}

type LoadState = 'idle' | 'downloading' | 'ready' | 'error';

// ── Helpers ───────────────────────────────────────────────────
function isPdf(filename: string, url: string): boolean {
  return (
    filename?.toLowerCase().endsWith('.pdf') ||
    url?.toLowerCase().includes('.pdf') ||
    url?.toLowerCase().includes('application%2Fpdf')
  );
}

function getCachePath(filename: string, isPdfFile: boolean): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const name = isPdfFile
    ? (safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`)
    : safeName;
  return `${FileSystem.cacheDirectory}evtc_${name}`;
}

// ── Viewer PDF ────────────────────────────────────────────────
function PdfViewer({ url, filename, onOpenBrowser }: {
  url: string; filename: string; onOpenBrowser: () => void;
}) {
  const [state,    setState]    = useState<LoadState>('idle');
  const [progress, setProgress] = useState(0);

  const downloadAndShare = useCallback(async () => {
    setState('downloading');
    setProgress(0);
    try {
      const localUri = getCachePath(filename, true);
      const info = await FileSystem.getInfoAsync(localUri);

      if (!info.exists) {
        const dl = FileSystem.createDownloadResumable(
          url,
          localUri,
          {},
          (p: FileSystem.DownloadProgressData) => {
            const pct = p.totalBytesExpectedToWrite > 0
              ? p.totalBytesWritten / p.totalBytesExpectedToWrite
              : 0;
            setProgress(pct);
          },
        );
        const result = await dl.downloadAsync();
        if (!result || result.status !== 200) throw new Error('Échec téléchargement');
      }

      setState('ready');

      // expo-sharing gère FileProvider Android + Quick Look iOS
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf', // iOS
        });
      } else {
        // Dernier recours : navigateur
        await Browser.openBrowserAsync(url);
      }
    } catch (err) {
      console.error('[PdfViewer]', err);
      setState('error');
    }
  }, [url, filename]);

  useEffect(() => { downloadAndShare(); }, []); // eslint-disable-line

  return (
    <View style={pvStyles.container}>
      {state === 'downloading' && (
        <View style={pvStyles.center}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={pvStyles.label}>
            Téléchargement… {Math.round(progress * 100)}%
          </Text>
          <View style={pvStyles.barTrack}>
            <View style={[pvStyles.barFill, { width: `${Math.round(progress * 100)}%` as any }]} />
          </View>
        </View>
      )}

      {state === 'ready' && (
        <View style={pvStyles.center}>
          <Ionicons name="checkmark-circle" size={64} color="#43A047" />
          <Text style={pvStyles.label}>PDF ouvert dans votre visionneuse</Text>
          <TouchableOpacity style={pvStyles.btnOutline} onPress={downloadAndShare}>
            <Ionicons name="share-outline" size={16} color={Colors.bordeaux} />
            <Text style={pvStyles.btnOutlineText}>Rouvrir / Partager</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'error' && (
        <View style={pvStyles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#E53935" />
          <Text style={pvStyles.labelError}>Impossible d'ouvrir le PDF</Text>
          <Text style={pvStyles.sublabel}>
            Essayez de l'ouvrir dans votre navigateur.
          </Text>
          <TouchableOpacity style={pvStyles.btnOutline} onPress={downloadAndShare}>
            <Ionicons name="refresh-outline" size={16} color={Colors.bordeaux} />
            <Text style={pvStyles.btnOutlineText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pvStyles.btnFilled} onPress={onOpenBrowser}>
            <Ionicons name="open-outline" size={16} color={Colors.white} />
            <Text style={pvStyles.btnFilledText}>Ouvrir dans le navigateur</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const pvStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  label:        { fontSize: Fonts.size.md, color: Colors.textSecondary, textAlign: 'center' },
  labelError:   { fontSize: Fonts.size.md, fontWeight: '700', color: '#E53935', textAlign: 'center' },
  sublabel:     { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center' },
  barTrack:     { width: '80%', height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3, backgroundColor: Colors.bordeaux },
  btnOutline:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.bordeaux, marginTop: Spacing.xs },
  btnOutlineText: { color: Colors.bordeaux, fontWeight: '600', fontSize: Fonts.size.sm },
  btnFilled:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, backgroundColor: Colors.bordeaux, marginTop: Spacing.xs },
  btnFilledText:{ color: Colors.white, fontWeight: '700', fontSize: Fonts.size.sm },
});

// ── Viewer Image ──────────────────────────────────────────────
function ImageViewer({ url, filename }: { url: string; filename: string }) {
  const [state,    setState]   = useState<LoadState>('idle');
  const [localUri, setLocalUri] = useState<string | null>(null);

  const downloadImage = useCallback(async () => {
    setState('downloading');
    try {
      const localPath = getCachePath(filename, false);
      const info = await FileSystem.getInfoAsync(localPath);

      if (info.exists) {
        setLocalUri(localPath);
        setState('ready');
        return;
      }

      const result = await FileSystem.downloadAsync(url, localPath);
      if (!result || result.status !== 200) throw new Error('Échec téléchargement image');

      setLocalUri(result.uri);
      setState('ready');
    } catch (err) {
      console.error('[ImageViewer]', err);
      setState('error');
    }
  }, [url, filename]);

  useEffect(() => { downloadImage(); }, []); // eslint-disable-line

  if (state === 'downloading') {
    return (
      <View style={imgStyles.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
        <Text style={imgStyles.label}>Chargement de l'image…</Text>
      </View>
    );
  }

  if (state === 'error' || !localUri) {
    return (
      <View style={imgStyles.center}>
        <Ionicons name="image-outline" size={56} color={Colors.textMuted} />
        <Text style={imgStyles.labelError}>Impossible d'afficher l'image</Text>
        <TouchableOpacity style={imgStyles.btn} onPress={downloadImage}>
          <Ionicons name="refresh-outline" size={16} color={Colors.bordeaux} />
          <Text style={imgStyles.btnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={imgStyles.scroll}
      contentContainerStyle={imgStyles.content}
      maximumZoomScale={5}
      minimumZoomScale={1}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      centerContent
      bouncesZoom
    >
      <Image
        source={{ uri: localUri }}
        style={imgStyles.image}
        resizeMode="contain"
      />
    </ScrollView>
  );
}

const imgStyles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: '#111' },
  content:    { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  image:      { width: W, height: H * 0.68 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  label:      { fontSize: Fonts.size.md, color: Colors.textSecondary, textAlign: 'center' },
  labelError: { fontSize: Fonts.size.md, fontWeight: '700', color: '#E53935', textAlign: 'center' },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.bordeaux, marginTop: Spacing.xs },
  btnText:    { color: Colors.bordeaux, fontWeight: '600', fontSize: Fonts.size.sm },
});

// ── Barre d'actions ───────────────────────────────────────────
function ActionBar({ status, onValidate, onReject, isActing }: {
  status: DocViewerStatus; onValidate?: () => void;
  onReject?: () => void; isActing?: boolean;
}) {
  if (status !== 'pending') {
    const cfg = {
      validated: { icon: 'checkmark-circle' as const, text: 'Document validé', bg: '#E8F5E9', color: '#2E7D32' },
      rejected:  { icon: 'close-circle'     as const, text: 'Document rejeté', bg: '#FCE4EC', color: '#C62828' },
      expired:   { icon: 'time-outline'     as const, text: 'Document expiré', bg: '#F3E5F5', color: '#6A1B9A' },
    }[status];
    if (!cfg) return null;
    return (
      <View style={[abStyles.statusBar, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        <Text style={[abStyles.statusText, { color: cfg.color }]}>{cfg.text}</Text>
      </View>
    );
  }
  return (
    <View style={abStyles.bar}>
      {onValidate && (
        <TouchableOpacity style={[abStyles.btn, { backgroundColor: '#43A047' }]} onPress={onValidate} disabled={isActing} activeOpacity={0.85}>
          {isActing
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <><Ionicons name="checkmark" size={20} color={Colors.white} /><Text style={abStyles.btnText}>Valider</Text></>
          }
        </TouchableOpacity>
      )}
      {onReject && (
        <TouchableOpacity style={[abStyles.btn, { backgroundColor: '#E53935' }]} onPress={onReject} disabled={isActing} activeOpacity={0.85}>
          <Ionicons name="close" size={20} color={Colors.white} />
          <Text style={abStyles.btnText}>Rejeter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const abStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
  },
  btn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: 14, borderRadius: Radius.md },
  btnText:    { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.md },
  statusBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md },
  statusText: { fontWeight: '700', fontSize: Fonts.size.md },
});

// ── DocumentViewer ────────────────────────────────────────────
export default function DocumentViewer({
  visible, onClose, fileUrl, filename,
  docType, driverName, status,
  onValidate, onReject, isActing = false,
}: DocumentViewerProps) {
  const isDoc = isPdf(filename, fileUrl);

  const handleOpenBrowser = useCallback(async () => {
    await Browser.openBrowserAsync(fileUrl);
  }, [fileUrl]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bordeaux} />
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{docType}</Text>
            <Text style={styles.headerSub}   numberOfLines={1}>{driverName}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={handleOpenBrowser}>
            <Ionicons name="open-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── Badge fichier ── */}
        <View style={styles.fileBadgeRow}>
          <Ionicons name={isDoc ? 'document-text-outline' : 'image-outline'} size={14} color={Colors.textMuted} />
          <Text style={styles.fileBadgeText} numberOfLines={1}>{filename}</Text>
          <View style={[styles.typeBadge, { backgroundColor: isDoc ? '#FFEBEE' : '#E3F2FD' }]}>
            <Text style={[styles.typeBadgeText, { color: isDoc ? '#E53935' : '#1565C0' }]}>
              {isDoc ? 'PDF' : 'IMAGE'}
            </Text>
          </View>
        </View>

        {/* ── Contenu ── */}
        <View style={styles.content}>
          {isDoc
            ? <PdfViewer   key={fileUrl} url={fileUrl} filename={filename} onOpenBrowser={handleOpenBrowser} />
            : <ImageViewer key={fileUrl} url={fileUrl} filename={filename} />
          }
        </View>

        {/* ── Actions ── */}
        <ActionBar status={status} onValidate={onValidate} onReject={onReject} isActing={isActing} />

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 0) + Spacing.md, paddingBottom: Spacing.md, paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  iconBtn:      { padding: Spacing.sm, width: 40, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.md },
  headerSub:    { color: 'rgba(255,255,255,0.75)', fontSize: Fonts.size.xs, marginTop: 2 },
  fileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fileBadgeText:{ flex: 1, fontSize: Fonts.size.xs, color: Colors.textMuted },
  typeBadge:    { borderRadius: Radius.full, paddingVertical: 2, paddingHorizontal: 8 },
  typeBadgeText:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  content:      { flex: 1 },
});