import { ShieldCheck, Lock, Fingerprint } from "lucide-react";

export function BrandPanel() {
  return (
    <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5f0] via-[#ede8fa] to-[#f0f4ff] dark:from-[#0d2b24] dark:via-[#1a1535] dark:to-[#0f1829]" />

      <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-500/10 blur-3xl" />
      <div className="absolute top-[60%] left-[50%] w-48 h-48 rounded-full bg-indigo-400/8 dark:bg-indigo-500/10 blur-2xl" />

      <div className="relative z-10 max-w-md text-center space-y-8">
        <blockquote className="space-y-4">
          <p className="font-display text-xl md:text-2xl leading-relaxed font-medium text-foreground/90 text-balance">
            "In a world where privacy keeps disappearing, we chose to build for it."
          </p>
        </blockquote>

        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-primary" />
            <span>Private</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Fingerprint className="w-4 h-4 text-primary" />
            <span>Yours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
