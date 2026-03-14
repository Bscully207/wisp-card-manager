import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  CreditCard, 
  LayoutDashboard, 
  ReceiptText, 
  User as UserIcon, 
  LifeBuoy, 
  LogOut,
  Wallet
} from "lucide-react";
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
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Cards", url: "/cards", icon: CreditCard },
  { title: "Transactions", url: "/transactions", icon: ReceiptText },
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

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

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30">
        <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
            <Link href="/dashboard" className="flex items-center gap-3 font-display font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/20">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              Nexus<span className="text-primary">Pay</span>
            </Link>
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
                          className={isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-white/5"}
                        >
                          <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
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
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{user.firstName} {user.lastName}</span>
                <span className="text-xs text-muted-foreground truncate w-32">{user.email}</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => logoutMutation.mutate({})}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors w-full justify-start"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  <span className="font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
