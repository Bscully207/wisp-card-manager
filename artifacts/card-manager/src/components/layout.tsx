import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  CreditCard, 
  LayoutDashboard, 
  ReceiptText, 
  User as UserIcon, 
  LifeBuoy, 
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  Settings,
  ChevronUp,
  Bell
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cards", url: "/cards", icon: CreditCard },
  { title: "Transactions", url: "/transactions", icon: ReceiptText },
];

export const ROOT_PATHS = ["/dashboard", "/cards", "/transactions"];

function ThemeMenuItem() {
  const { theme, setTheme } = useTheme();
  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <DropdownMenuItem onClick={cycle} className="cursor-pointer">
      <Icon className="w-4 h-4 mr-2" />
      Theme: {label}
    </DropdownMenuItem>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, isError } = useGetMe({
    query: { retry: false }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      }
    }
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  }, [user, isLoading, isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const normalizedPath = location.replace(/\/+$/, "") || "/";
  const isSubPage = !ROOT_PATHS.includes(normalizedPath);

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30">
        <div className="hidden md:block">
          <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
            <SidebarHeader className="h-16 flex items-center justify-between px-6 border-b border-border/50">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`} alt="Wisp" className="h-8 dark:block hidden" />
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`} alt="Wisp" className="h-8 dark:hidden block" />
              </Link>
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </SidebarHeader>
            <SidebarContent className="px-4 py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-muted-foreground font-medium mb-2 px-2">Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => {
                      const isActive = location.startsWith(item.url);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive}
                            className={isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-foreground/5"}
                          >
                            <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all" style={{ fontSize: '15px' }}>
                              <item.icon className="w-5 h-5" />
                              <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer text-left">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}{user.lastName?.[0] || ""}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold leading-tight truncate">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split("@")[0]}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/support")} className="cursor-pointer">
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ThemeMenuItem />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate({})}
                    className="text-red-400 focus:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
        </div>

        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-4 px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="md:hidden flex items-center gap-2">
              {isSubPage ? (
                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      setLocation("/dashboard");
                    }
                  }}
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors -ml-1 p-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : null}
              <Link href="/dashboard" className="flex items-center">
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`} alt="Wisp" className="h-7 dark:block hidden" />
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`} alt="Wisp" className="h-7 dark:hidden block" />
              </Link>
            </div>
            <div className="flex-1" />
            <div className="md:hidden flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                <Bell className="w-[18px] h-[18px]" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                    {user.firstName?.[0] || user.email[0].toUpperCase()}{user.lastName?.[0] || ""}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/support")} className="cursor-pointer">
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ThemeMenuItem />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate({})}
                    className="text-red-400 focus:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 px-4 py-3 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location === item.url || (item.url !== "/dashboard" && location.startsWith(item.url));
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors min-h-[44px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                  <span className="text-[10px] font-medium leading-tight">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
}
