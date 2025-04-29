
import { LucideProps, Loader2 } from "lucide-react";

export const Icons = {
  spinner: Loader2,
  google: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12C2 6.48 6.48 2 12 2C14.24 2 16.26 2.8 17.85 4.15L14.5 7.5C13.24 6.24 11.73 5.5 10 5.5C8.24 5.5 6.7 6.23 5.68 7.38C4.67 8.51 4.09 9.98 4.09 11.5C4.09 13.02 4.67 14.49 5.68 15.62C6.7 16.77 8.24 17.5 10 17.5C11.73 17.5 13.24 16.76 14.5 15.5L17.85 18.85C16.26 20.2 14.24 21 12 21C6.48 21 2 16.52 2 12Z" />
    </svg>
  ),
};
