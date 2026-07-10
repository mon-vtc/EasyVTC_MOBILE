import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  
} from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, Spacing, Fonts } from '../../theme/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const hideToast = () => {
    resetTimer();
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  };

  const showToast = ({ duration = 3000, position = 'bottom', ...options }: ToastOptions) => {
    resetTimer();
    setToast({ ...options, duration, position });
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    timeoutRef.current = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, duration);
  };

  const toastStyle = toast?.type ? toastTypeStyles[toast.type] : toastTypeStyles.info;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: toast?.position === 'top' ? [-48, 0] : [48, 0],
  });

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            toast.position === 'top' ? styles.top : styles.bottom,
            { transform: [{ translateY }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              toast.onPress?.();
              hideToast();
            }}
            style={[styles.toast, toastStyle, toast.style]}
          >
            {toast.title ? (
              <AppText variant="label" style={[styles.title, toast.titleStyle]}>
                {toast.title}
              </AppText>
            ) : null}
            <AppText style={[styles.message, toast.messageStyle]}>{toast.message}</AppText>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.sm,
    right: Spacing.sm,
    zIndex: 999,
  },
  top: {
    top: Spacing.sm,
  },
  bottom: {
    bottom: Spacing.sm,
  },
  toast: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    marginBottom: Spacing.xs,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
  message: {
    color: Colors.white,
    lineHeight: 20,
  },
});

const toastTypeStyles: Record<ToastType, StyleProp<ViewStyle>> = {
  success: { backgroundColor: Colors.bordeauxLight, },
  error: { backgroundColor: Colors.error, },
  warning: { backgroundColor: Colors.warning, },
  info: { backgroundColor: Colors.bordeauxLight, },
};
