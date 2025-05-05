
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, AlertTriangle, Info, X } from "lucide-react";
import { ToastActionElement } from "@/components/ui/toast";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationOptions {
  title: string;
  description?: string;
  type?: NotificationType;
  duration?: number;
  action?: ToastActionElement;
}

export const showNotification = ({
  title,
  description,
  type = "info",
  duration = 5000,
  action
}: NotificationOptions) => {
  // Create the icon based on notification type
  const iconComponent = type === "success" ? <Check className="h-4 w-4" /> :
                       type === "error" ? <AlertTriangle className="h-4 w-4" /> :
                       type === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                       <Info className="h-4 w-4" />;
  
  const iconClassName = `
    ${type === "success" ? "text-green-500" : 
      type === "error" ? "text-red-500" : 
      type === "warning" ? "text-yellow-500" : 
      "text-blue-500"}
  `;
  
  const { toast } = useToast();
  
  return toast({
    title: title,
    description: description,
    duration: duration,
    variant: type === "error" ? "destructive" : "default",
    action: action,
    icon: <span className={iconClassName}>{iconComponent}</span>
  });
};

// Utility hooks for displaying notifications
export const useNotification = () => {
  const { toast } = useToast();
  
  return {
    success: (options: Omit<NotificationOptions, "type">) => 
      showNotification({ ...options, type: "success" }),
    error: (options: Omit<NotificationOptions, "type">) => 
      showNotification({ ...options, type: "error" }),
    info: (options: Omit<NotificationOptions, "type">) => 
      showNotification({ ...options, type: "info" }),
    warning: (options: Omit<NotificationOptions, "type">) => 
      showNotification({ ...options, type: "warning" }),
  };
};

// Component for showing a dismissible notification banner
export const NotificationBanner = ({ 
  title, 
  description, 
  type = "info",
  onDismiss 
}: NotificationOptions & { onDismiss?: () => void }) => {
  return (
    <div className={`
      p-4 rounded-md mb-4 relative
      ${type === "success" ? "bg-green-50 border border-green-200 text-green-800" : 
        type === "error" ? "bg-red-50 border border-red-200 text-red-800" : 
        type === "warning" ? "bg-yellow-50 border border-yellow-200 text-yellow-800" : 
        "bg-blue-50 border border-blue-200 text-blue-800"}
    `}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          {type === "success" ? <Check className="h-5 w-5" /> :
           type === "error" ? <AlertTriangle className="h-5 w-5" /> :
           type === "warning" ? <AlertTriangle className="h-5 w-5" /> :
           <Info className="h-5 w-5" />}
        </span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {description && <p className="text-sm mt-1">{description}</p>}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Auto-dismissible notification banner
export const AutoDismissNotification = ({
  title,
  description,
  type = "info",
  duration = 5000,
  onDismiss
}: NotificationOptions & { onDismiss?: () => void }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);
  
  if (!visible) return null;
  
  return (
    <NotificationBanner
      title={title}
      description={description}
      type={type}
      onDismiss={() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }}
    />
  );
};
