// hooks/useToast.ts
import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

export interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
  id: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
      id: Date.now(),
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => prev ? { ...prev, isVisible: false } : null);
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
};