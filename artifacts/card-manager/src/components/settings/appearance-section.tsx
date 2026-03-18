import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
      <CardHeader className="px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sun className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <div>
            <CardTitle className="text-base md:text-lg">Appearance</CardTitle>
            <CardDescription className="text-xs md:text-sm">Choose your preferred theme.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer",
                theme === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border hover:bg-foreground/5"
              )}
            >
              <opt.icon className={cn("w-5 h-5", theme === opt.value ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", theme === opt.value ? "text-foreground" : "text-muted-foreground")}>{opt.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
