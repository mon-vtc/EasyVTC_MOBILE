import { useToastContext } from '../components/common/ToastProvider';

export function useToast() {
  return useToastContext();
}
