// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT : bouton d'action flottant, déplaçable (façon "chat head")
// Sprint 8, EasyVTC
//
// Se glisse n'importe où sur l'écran par un cliqué-glissé, puis s'accroche
// automatiquement au bord gauche ou droit le plus proche au relâchement. Un
// appui bref (sans déplacement notable) déclenche onPress.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { AppIcon } from './AppIcon';
import type { AppIconProps } from '../../types/app-icon-props.types';
import { Colors } from '../../theme/colors';

const FAB_SIZE = 56;
const MARGIN = 20;
const TAP_THRESHOLD = 6; // px : en dessous, on considère que c'est un appui, pas un glissé

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName?: AppIconProps['name'];
  /** Position verticale de départ, mesurée depuis le bas de l'écran. */
  initialBottom?: number;
}

export function FloatingActionButton({
  onPress,
  iconName = 'add',
  initialBottom = 100,
}: FloatingActionButtonProps) {
  const { width, height } = Dimensions.get('window');

  const translateX = useSharedValue(width - FAB_SIZE - MARGIN);
  const translateY = useSharedValue(height - FAB_SIZE - initialBottom);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      const moved = Math.hypot(e.translationX, e.translationY);
      if (moved < TAP_THRESHOLD) {
        runOnJS(onPress)();
      }
      // Accroche au bord le plus proche, et reste dans les limites verticales de l'écran.
      const isRight = translateX.value + FAB_SIZE / 2 > width / 2;
      translateX.value = withSpring(isRight ? width - FAB_SIZE - MARGIN : MARGIN, { damping: 16 });
      translateY.value = withSpring(
        Math.min(Math.max(translateY.value, MARGIN), height - FAB_SIZE - MARGIN),
        { damping: 16 },
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.fab, animatedStyle]}>
        <AppIcon name={iconName} size={26} color={Colors.white} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.bordeaux, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    zIndex: 999,
  },
});
