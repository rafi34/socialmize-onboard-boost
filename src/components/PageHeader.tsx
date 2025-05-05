
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, icon, actions }: PageHeaderProps) => {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="text-socialmize-purple">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
