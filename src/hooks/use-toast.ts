
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";
import { ReactNode } from "react";
import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type IconType = ReactNode; // Define IconType as React node for any icon component

const DEFAULT_TOAST_DURATION = 5000;

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  icon?: IconType;
  duration?: number;
  variant?: ToastProps["variant"];
  onOpenChange?: (open: boolean) => void;
};

type State = {
  toasts: ToasterToast[];
};

type ToastCreatorProps = Partial<
  Pick<ToasterToast, "action" | "title" | "description" | "icon">
> &
  Pick<ToastProps, "variant"> & {
    duration?: number;
  };

// Create toast store
export const useToast = create<State>(() => ({
  toasts: [],
}));

// Create toast function
export function toast(props: ToastCreatorProps) {
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
    },
  };

  useToast.setState({
    toasts: [...toasts, newToast],
  });

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: ToastCreatorProps) =>
      updateToast({ id, ...props }),
  };
}

export function dismissToast(id: string) {
  const { toasts } = useToast.getState();
  useToast.setState({
    toasts: toasts.filter((toast) => toast.id !== id),
  });
}

export function updateToast({
  id,
  ...props
}: ToastCreatorProps & { id: string }) {
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
          ...rest,
        };
      }
      return toast;
    }),
  });
}
