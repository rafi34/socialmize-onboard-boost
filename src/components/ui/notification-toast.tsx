
import React from "react";
import { Check, Bell, AlertCircle } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

// Extend ToastProps with iconType
interface NotificationToastProps {
  title?: string;
  description?: string;
  iconType?: "success" | "alert" | "notification" | React.ReactNode;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  description,
  iconType = "notification",
}) => {
  return (
    <Toast>
      <div className="flex">
        <div className="flex items-center justify-center w-10 h-10 rounded-full mr-3">
          {iconType === "success" ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : iconType === "alert" ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : iconType === "notification" ? (
            <Bell className="h-5 w-5 text-blue-500" />
          ) : (
            iconType
          )}
        </div>
        <div>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
      </div>
      <ToastClose />
    </Toast>
  );
};

export function NotificationToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
