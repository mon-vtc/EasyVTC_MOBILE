import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { DocumentStatus } from '../../types/document.types';

interface DocumentCardProps {
  title:           string;
  icon:            keyof typeof Ionicons.glyphMap;
  required:        boolean;
  uploaded:        boolean;
  status:          DocumentStatus | null;
  expiryDate?:     string;
  rejectedReason?: string;
  onUpload:        () => void;
  onView?:         () => void;
}

const getStatusConfig = (status: DocumentStatus | null, uploaded: boolean) => {
  if (!uploaded) {
    return { label: 'À fournir', color: '#FFEBEE', textColor: '#C62828' };
  }
  switch (status) {
    case 'validated': return { label: 'Valide',        color: '#E8F5E9', textColor: '#2E7D32' };
    case 'pending':  return { label: 'En attente',    color: '#E3F2FD', textColor: '#1565C0' };
    case 'rejected': return { label: 'Refusé',        color: '#FFEBEE', textColor: '#C62828' };
    case 'expired':  return { label: 'Expiré',        color: '#FFF3E0', textColor: '#EF6C00' };
    default:         return { label: 'Inconnu',       color: Colors.border, textColor: Colors.textMuted };
  }
};

export const DocumentCard = ({
  title,
  icon,
  required,
  uploaded,
  status,
  expiryDate,
  rejectedReason,
  onUpload,
  onView,
}: DocumentCardProps) => {
  const config = getStatusConfig(status, uploaded);

  return (
    <View style={cardStyles.container}>

      {/* ── Header ── */}
      <View style={cardStyles.header}>
        <View style={cardStyles.iconCircle}>
          <Ionicons name={icon} size={22} color={Colors.textPrimary} />
        </View>

        <View style={cardStyles.info}>
          <Text style={cardStyles.title}>{title}</Text>
          {uploaded && expiryDate ? (
            <Text style={cardStyles.expiry}>Expire le {expiryDate}</Text>
          ) : !uploaded ? (
            <Text style={cardStyles.expiry}>
              {required ? 'Document obligatoire' : 'Document facultatif'}
            </Text>
          ) : null}
        </View>

        <View style={[cardStyles.badge, { backgroundColor: config.color }]}>
          <Text style={[cardStyles.badgeText, { color: config.textColor }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* ── Motif de rejet ── */}
      {status === 'rejected' && rejectedReason && (
        <View style={cardStyles.rejectBox}>
          <Ionicons name="information-circle-outline" size={14} color="#C62828" />
          <Text style={cardStyles.rejectText} numberOfLines={4}>{rejectedReason}</Text>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={cardStyles.actions}>
        {uploaded ? (
          <>
            <TouchableOpacity style={cardStyles.btnUpdate} onPress={onUpload}>
              <Ionicons name="arrow-up-outline" size={16} color={Colors.white} />
              <Text style={cardStyles.btnUpdateText}>Mettre à jour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cardStyles.btnView} onPress={onView}>
              <Ionicons name="eye-outline" size={16} color={Colors.textPrimary} />
              <Text style={cardStyles.btnViewText}>Voir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[cardStyles.btnUpdate, { flex: 1 }]}
            onPress={onUpload}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={Colors.white} />
            <Text style={cardStyles.btnUpdateText}>
              {required ? 'Ajouter (requis)' : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.md,
  },
  iconCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#EFEAEA',
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     Spacing.sm,
  },
  info:  { flex: 1 },
  title: {
    fontSize:   Fonts.size.md,
    fontWeight: '700',
    color:      '#4A2C2A',
  },
  expiry: {
    fontSize:  Fonts.size.xs,
    color:     Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      12,
  },
  badgeText: {
    fontSize:   10,
    fontWeight: '700',
  },
  rejectBox: {
    flexDirection:   'row',
    gap:             6,
    backgroundColor: '#FFF5F5',
    padding:         Spacing.sm,
    borderRadius:    Radius.sm,
    marginBottom:    Spacing.sm,
    alignItems:      'flex-start',
    borderWidth:     1,
    borderColor:     '#FFCDD2',
  },
  rejectText: {
    flex:       1,
    fontSize:   11,
    color:      '#C62828',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  btnUpdate: {
    flex:            1.2,
    backgroundColor: '#5D3332',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 10,
    borderRadius:    Radius.sm,
    gap:             6,
  },
  btnUpdateText: {
    color:      Colors.white,
    fontSize:   Fonts.size.sm,
    fontWeight: '600',
  },
  btnView: {
    flex:            1,
    backgroundColor: '#F0F0F0',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 10,
    borderRadius:    Radius.sm,
    gap:             6,
  },
  btnViewText: {
    color:      Colors.textPrimary,
    fontSize:   Fonts.size.sm,
    fontWeight: '600',
  },
});