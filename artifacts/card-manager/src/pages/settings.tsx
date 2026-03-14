import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">App Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">Configure your application preferences.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center bg-card/20 rounded-2xl border border-dashed border-border/50">
        <SettingsIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Coming Soon</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm px-4">
          App settings will be available here in a future update.
        </p>
      </div>
    </div>
  );
}
