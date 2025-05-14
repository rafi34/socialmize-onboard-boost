
import { useToast as useToastUI } from "@/hooks/use-toast";
import { type Toast, toast as toastUI } from "@/hooks/use-toast";

export const useToast = useToastUI;
export const toast = toastUI;
export type { Toast };
