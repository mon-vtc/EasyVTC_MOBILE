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
  const scale = useSharedValue(1);

  const snapToNearestEdge = () => {
    const isRight = translateX.value + FAB_SIZE / 2 > width / 2;
    translateX.value = withSpring(isRight ? width - FAB_SIZE - MARGIN : MARGIN, { damping: 16 });
    translateY.value = withSpring(
      Math.min(Math.max(translateY.value, MARGIN), height - FAB_SIZE - MARGIN),
      { damping: 16 },
    );
  };

  // Course entre les deux gestes : un appui bref déclenche Tap immédiatement
  // (pas besoin d'attendre onEnd du Pan), un glissé continu prend le dessus
  // et déclenche Pan à la place.
  const tap = Gesture.Tap()
    .maxDistance(8)
    .onBegin(() => { scale.value = withSpring(0.9, { damping: 14 }); })
    .onEnd((_, success) => {
      scale.value = withSpring(1, { damping: 14 });
      if (success) runOnJS(onPress)();
    })
    .onFinalize(() => { scale.value = withSpring(1, { damping: 14 }); });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      snapToNearestEdge();
    });

  const gesture = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
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
