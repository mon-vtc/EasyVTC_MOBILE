import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { SupportTicketRow } from '../../types/chats.type';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';

export default function TicketCard({ ticket, onPress }: { ticket: SupportTicketRow; onPress: () => void }) {
  const { user } = useAuth();
  const isPending = ticket.status === 'pending';
  const isResolved = ticket.status === 'resolved';

  const priorityLabel = ticket.priority === 'urgent' ? 'Urgent' : 'Normal';
  const isUrgent = ticket.priority === 'urgent';
  const timeAgo = formatDistanceToNow(parseISO(ticket.updated_at), {
     addSuffix: true,
     locale: fr,
   });

  const isOwnTicket = user?.id === ticket.user_id;

  const getButtonLabel = () => {
    switch (ticket.status) {
      case 'pending': return 'Répondre';
      case 'in_progress': return 'Continuer';
      case 'resolved': return 'Résolu';
      default: return 'Voir';
    }
  };

  return (
    <TouchableOpacity
      style={[cardStyles.wrapper, isPending && cardStyles.pending]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${isOwnTicket ? 'Votre ticket' : `${ticket.user?.first_name ?? ''} ${ticket.user?.last_name ?? ''}`}, ${ticket.subject}, ${ticket.status}`}
    >
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.leftRow}>
          <View style={cardStyles.avatarWrap}>
            {ticket.user?.profile_photo_url ? (
              <Image source={{ uri: ticket.user.profile_photo_url }} style={cardStyles.avatar} />
            ) : (
              <View style={[cardStyles.avatar, {backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center'}]}>
                <AppIcon name="person-outline" size={20} color={Colors.textSecondary} />
              </View>
            )}
            {isPending && <View style={cardStyles.badge} />}
          </View>
          <View style={cardStyles.nameCol}>
            <Text style={cardStyles.nameText} numberOfLines={1}>
              {isOwnTicket ? 
                `${ticket.subject && ticket.subject.length > 20 
                  ? `${ticket.subject.substring(0, 20)}...` 
                  : ticket.subject}`
               : `${ticket.user?.first_name ?? ''} ${ticket.user?.last_name ?? 'Utilisateur'}`}
            </Text>
            <View style={cardStyles.badgesRow}>
              {!isOwnTicket && (
                <View style={cardStyles.roleBadge}><Text style={cardStyles.roleBadgeText}>{ticket.user_role === 'client' ? 'Client' : ticket.user_role === 'driver' ? 'Chauffeur' : ticket.user_role}</Text></View>
              )}
              <View style={isUrgent ? cardStyles.urgentBadge : cardStyles.normalBadge}>
                <Text style={isUrgent ? cardStyles.urgentBadgeText : cardStyles.normalBadgeText}>{priorityLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={cardStyles.timeText}>{timeAgo}</Text>
      </View>

      <Text style={cardStyles.preview} numberOfLines={1} ellipsizeMode="tail">
        {ticket.subject}
      </Text>

      <TouchableOpacity
        style={[cardStyles.cta, isResolved && cardStyles.ctaDisabled]}
        onPress={onPress}
        activeOpacity={isResolved ? 1 : 0.9}
        disabled={isResolved}
      >
        <AppIcon name="chatbubble-outline" size={16} color={!isResolved ? 'white' : '#15803D' } />
        <Text style={[cardStyles.ctaText, isResolved && { color: '#15803D' }]}>
          {getButtonLabel()}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  pending: { borderColor: Colors.bordeaux },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { },
  avatar: {position: 'relative', width: 40, height: 40, borderRadius: 20, marginRight: Spacing.sm },
  badge: { position: 'absolute', top: 0, right:0, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.bordeaux, borderWidth: 1, borderColor: Colors.surface },
  nameCol: { justifyContent: 'center' },
  nameText: { fontWeight: '700', fontSize: Fonts.size.md, color: Colors.textPrimary },
  badgesRow: { flexDirection: 'row', marginTop: 4 },
  clientBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
  clientBadgeText: { color: '#7C3AED', fontSize: Fonts.size.xs, fontWeight: '600' },
  urgentBadge: { backgroundColor: '#FFE5E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgentBadgeText: { color: '#E11D48', fontSize: Fonts.size.xs, fontWeight: '600' },
  normalBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  normalBadgeText: { color: Colors.textMuted, fontSize: Fonts.size.xs, fontWeight: '600' },
  roleBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
  roleBadgeText: { color: '#3730A3', fontSize: Fonts.size.xs, fontWeight: '600', textTransform: 'capitalize' },
  timeText: { color: Colors.textMuted, fontSize: Fonts.size.xs },
  preview: { color: Colors.textPrimary, fontSize: Fonts.size.sm, marginBottom: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bordeaux, paddingVertical: 10, borderRadius: 8 },
  ctaDisabled: { opacity: 0.6, backgroundColor: Colors.successLight },
  ctaText: { color: Colors.white, fontWeight: '700', marginLeft: 8 },
});
