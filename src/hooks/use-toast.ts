
import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  onOpenChange?: (open: boolean) => void;
};

type ToastState = {
  toasts: ToastProps[];
};

const DEFAULT_TOAST_DURATION = 5000;

export const useToast = create<ToastState>(() => ({
  toasts: []
}));

export function toast(props: ToastProps) {
  const { toasts } = useToast.getState();
  const { duration = DEFAULT_TOAST_DURATION, ...data } = props;
  const id = uuid();
  
  const newToast = {
    id,
    duration,
    ...data,
    onOpenChange: (open: boolean) => {
      if (!open) {
        dismissToast(id);
      }
    }
  };

  useToast.setState({
    toasts: [...toasts, newToast]
  });

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: ToastProps) => updateToast({ id, ...props })
  };
}

export function dismissToast(id: string) {
  const { toasts } = useToast.getState();
  
  useToast.setState({
    toasts: toasts.filter((toast) => toast.id !== id)
  });
}

export function updateToast({ id, ...props }: ToastProps & { id: string }) {
  const { toasts } = useToast.getState();
  const { title, description, action, ...rest } = props;

  useToast.setState({
    toasts: toasts.map((toast) => {
      if (toast.id === id) {
        return {
          ...toast,
          title: title ?? toast.title,
          description: description ?? toast.description,
          action: action ?? toast.action,
          ...rest
        };
      }
      return toast;
    })
  });
}
