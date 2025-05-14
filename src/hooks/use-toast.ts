
import { useToast as useToastUI } from "@/components/ui/use-toast";
import { type Toast, toast as toastUI } from "@/components/ui/use-toast";

export const useToast = useToastUI;
export const toast = toastUI;
export type { Toast };
