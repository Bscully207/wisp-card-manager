import { useEffect } from "react";
import {
  useGetNotificationSettings,
  useUpdateNotificationSettings,
  getGetNotificationSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PREFERENCE_ITEMS = [
  { key: "transactionAlerts" as const, label: "Transaction Alerts", description: "Get notified about card payments and transactions" },
  { key: "topupAlerts" as const, label: "Top-up Alerts", description: "Get notified when your card is topped up" },
  { key: "securityAlerts" as const, label: "Security Alerts", description: "Get notified about security events like card freezes" },
  { key: "marketingAlerts" as const, label: "Marketing & Promotions", description: "Receive updates about new features and offers" },
];

export function NotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetNotificationSettings();

  const updateMutation = useUpdateNotificationSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationSettingsQueryKey() });
        toast({ title: "Notification preferences updated" });
      },
      onError: () => {
        toast({ title: "Failed to update preferences", variant: "destructive" });
      },
    },
  });

  const handleToggle = (key: typeof PREFERENCE_ITEMS[number]["key"], value: boolean) => {
    if (!settings) return;
    updateMutation.mutate({
      data: {
        transactionAlerts: settings.transactionAlerts,
        topupAlerts: settings.topupAlerts,
        securityAlerts: settings.securityAlerts,
        marketingAlerts: settings.marketingAlerts,
        [key]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
      <CardHeader className="px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <div>
            <CardTitle className="text-base md:text-lg">Notification Preferences</CardTitle>
            <CardDescription className="text-xs md:text-sm">Choose what notifications you want to receive.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6 space-y-4">
        {PREFERENCE_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div className="space-y-0.5">
              <Label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={item.key}
              checked={settings?.[item.key] ?? true}
              onCheckedChange={(value) => handleToggle(item.key, value)}
              disabled={updateMutation.isPending}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
