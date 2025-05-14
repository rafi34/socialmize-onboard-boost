import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserSettings } from "@/pages/Settings";

interface BillingSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const BillingSettings = ({ settings, setSettings, loading }: BillingSettingsProps) => {
  const [upgrading, setUpgrading] = useState(false);
  
  const handleUpgradePlan = () => {
    // Placeholder for upgrading plan functionality
    setUpgrading(true);
    
    setTimeout(() => {
      setUpgrading(false);
      toast({
        title: "Coming Soon",
        description: "Plan upgrades will be available in a future update."
      });
    }, 1000);
  };
  
  const handleViewInvoices = () => {
    toast({
      title: "Coming Soon",
      description: "Invoice viewing will be available in a future update."
    });
  };
  
  const handleCancelSubscription = () => {
    toast({
      title: "Coming Soon",
      description: "Subscription cancellation will be available in a future update."
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Plan Details</h3>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-xl bg-primary/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h4 className="text-lg font-semibold">{settings.billing.plan}</h4>
              <p className="text-sm text-muted-foreground">Current active plan</p>
            </div>
            
            {settings.billing.plan !== "Free" && (
              <div className="mt-2 sm:mt-0 bg-primary/10 px-3 py-1 rounded-full text-xs font-medium">
                Active
              </div>
            )}
          </div>
          
          {settings.billing.plan === "Free" && (
            <div className="mt-4">
              <Button onClick={handleUpgradePlan} disabled={loading || upgrading}>
                {upgrading ? "Processing..." : "Upgrade Plan"}
              </Button>
            </div>
          )}
        </div>
        
        {settings.billing.plan !== "Free" && (
          <>
            <div className="space-y-2 border-t pt-4">
              <Label>Payment Method</Label>
              {settings.billing.hasPaymentMethod ? (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded">
                    <CreditCardIcon />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/25</p>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No payment method on file
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 border-t pt-4">
              <Button variant="outline" onClick={handleViewInvoices}>
                View Invoices
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </div>
          </>
        )}
        
        {settings.billing.plan === "Free" && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium mb-4">Available Plans</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium">Pro</h5>
                <p className="text-2xl font-bold mt-2">$19<span className="text-sm font-normal">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>✅ Everything in Free</li>
                  <li>✅ Unlimited content generation</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg bg-primary/5 relative">
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
                  Best Value
                </div>
                <h5 className="font-medium">Elite</h5>
                <p className="text-2xl font-bold mt-2">$39<span className="text-sm font-normal">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>✅ Everything in Pro</li>
                  <li>✅ AI-powered analytics</li>
                  <li>✅ VIP creator support</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple credit card icon component
const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

export default BillingSettings;
