import React, { useState, useCallback, createContext, ReactNode } from 'react';
import CustomAlert, { AlertButton } from './CustomAlert';

interface AlertOptions {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Delay resetting options to allow fade-out animation
    setTimeout(() => setOptions(null), 300);
  };

  const value = { showAlert };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {options && (
        <CustomAlert visible={visible} {...options} onClose={handleClose} />
      )}
    </AlertContext.Provider>
  );
}