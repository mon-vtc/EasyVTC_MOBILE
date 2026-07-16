/**
 * AppHeader — barre du haut unique pour tous les écrans, tous rôles confondus.
 *
 * Remplace les ~15 implémentations JSX dupliquées (hamburger/back, logo/titre,
 * cloche/partage/rien...) trouvées dans les écrans admin/driver/client/manager,
 * ainsi que la config `getDrawerScreenOptions` copiée-collée dans AdminNavigator,
 * DriverNavigator et ManagerNavigator.
 *
 * Deux familles d'écrans, deux réglages :
 *  - Écran racine (accessible directement depuis le menu latéral) :
 *      <AppHeader left="menu" title="Réservations" rightIcon={notifIcon} />
 *  - Écran enfant / détail (atteint en poussant depuis une liste) :
 *      <AppHeader left="back" title="Détails du chauffeur" />
 *
 * `left="menu"` déclenche `navigation.dispatch(DrawerActions.openDrawer())` —
 * c'est la seule méthode fiable depuis un écran niché dans un Stack imbriqué
 * dans un Drawer (contrairement à `navigation.openDrawer()`, absent du
 * navigation prop à cette profondeur d'imbrication).
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from './AppIcon';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { Logo } from '../../constants/logo';
import type { AppIconProps } from '../../types/app-icon-props.types';

export interface AppHeaderRightIcon {
  name: AppIconProps['name'];
  onPress: () => void;
  badge?: number;
  accessibilityLabel?: string;
}

export interface AppHeaderProps {
  /** 'menu' ouvre le drawer, 'back' revient en arrière, 'none' masque la zone gauche. */
  left?: 'menu' | 'back' | 'none';
  /** Callback custom pour left="back" — par défaut navigation.goBack(). */
  onBack?: () => void;

  /** Titre centré. Ignoré si `logo` ou `centerElement` est fourni. */
  title?: string;
  subtitle?: string;
  /** Affiche le logo Easy VTC à la place du titre — réservé à l'écran d'accueil de chaque rôle. */
  logo?: boolean;
  /** Échappatoire pour un contenu central non générique (ex: avatar + nom + statut dans un header de conversation). Prioritaire sur `title`/`logo`. */
  centerElement?: React.ReactNode;

  /** Action unique à droite (cloche, partage, édition...). */
  rightIcon?: AppHeaderRightIcon;
  /** Échappatoire pour un contenu droit non générique (ex: badge de statut métier, groupe de plusieurs icônes). */
  rightElement?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
}

const SIDE_WIDTH = 40;

export function AppHeader({
  left = 'back',
  onBack,
  title,
  subtitle,
  logo = false,
  centerElement,
  rightIcon,
  rightElement,
  style,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleLeftPress = () => {
    if (left === 'menu') {
      navigation.dispatch(DrawerActions.openDrawer());
    } else if (left === 'back') {
      if (onBack) onBack();
      else if (navigation.canGoBack()) navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }, style]}>
      <View style={styles.side}>
        {left !== 'none' && (
          <TouchableOpacity
            onPress={handleLeftPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={left === 'menu' ? 'Ouvrir le menu' : 'Retour'}
          >
            <AppIcon name={left === 'menu' ? 'menu' : 'arrow-back'} size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {centerElement ? centerElement : logo ? (
          <Image source={Logo.LogoEasyVTC} style={styles.logo} resizeMode="contain" />
        ) : (
          <>
            {!!title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          </>
        )}
      </View>

      <View style={styles.side}>
        {rightElement}
        {!rightElement && rightIcon && (
          <TouchableOpacity
            onPress={rightIcon.onPress}
            style={styles.rightIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={rightIcon.accessibilityLabel ?? 'Action'}
          >
            <AppIcon name={rightIcon.name} size={22} color={Colors.white} />
            {!!rightIcon.badge && rightIcon.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightIcon.badge > 99 ? '99+' : rightIcon.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  side: { minWidth: SIDE_WIDTH, flexShrink: 0, alignItems: 'flex-start', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 40, height: 40 },
  title: { color: Colors.white, fontSize: Fonts.size.lg, fontFamily: Fonts.semibold, fontWeight: '600' },
  subtitle: { color: Colors.white, fontSize: Fonts.size.xs, marginTop: 2, opacity: 0.85 },
  rightIconBtn: {
    position: 'relative',
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badge: {
    position: 'absolute',
    top: -2, right: -2,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontFamily: Fonts.bold, fontWeight: '800' },
});
