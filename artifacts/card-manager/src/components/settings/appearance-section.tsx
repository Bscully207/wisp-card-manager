import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon, Monitor } from "lucide-react";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {theme === "light" && <Sun className="w-4 h-4 text-muted-foreground" />}
            {theme === "dark" && <Moon className="w-4 h-4 text-muted-foreground" />}
            {theme === "system" && <Monitor className="w-4 h-4 text-muted-foreground" />}
            Theme
          </div>
          <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" /> Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
