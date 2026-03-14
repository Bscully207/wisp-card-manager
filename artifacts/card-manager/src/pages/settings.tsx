import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, useUpdateProfile, useChangePassword, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Loader2, ShieldCheck, UserCircle, Sun, Moon, Monitor, 
  Pencil, X, FileText, LifeBuoy, ChevronRight
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function SettingsPage() {
  const { data: user, isLoading } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "", lastName: "", phone: "", address: "", city: "", country: ""
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || ""
      });
    }
  }, [user, profileForm]);

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated successfully" });
        setEditing(false);
      }
    }
  });

  const changePasswordMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "Password changed successfully" });
        passwordForm.reset();
      },
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  });

  if (isLoading || !user) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">Manage your account, preferences and security.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <div>
                <CardTitle className="text-base md:text-lg">Personal Details</CardTitle>
                <CardDescription className="text-xs md:text-sm">Your contact and personal information.</CardDescription>
              </div>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={() => { setEditing(false); profileForm.reset(); }}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {!editing ? (
            <div className="space-y-3">
              <InfoRow label="First Name" value={user.firstName || "—"} />
              <InfoRow label="Last Name" value={user.lastName || "—"} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone || "—"} />
              <InfoRow label="Address" value={user.address || "—"} />
              <InfoRow label="City" value={user.city || "—"} />
              <InfoRow label="Country" value={user.country || "—"} />
            </div>
          ) : (
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit((v) => updateProfileMutation.mutate({ data: v }))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <FormField control={profileForm.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={profileForm.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full mt-2 rounded-xl" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <div>
              <CardTitle className="text-base md:text-lg">Security</CardTitle>
              <CardDescription className="text-xs md:text-sm">Update your password.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(({ currentPassword, newPassword }) => changePasswordMutation.mutate({ data: { currentPassword, newPassword } }))} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" className="bg-muted/50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" variant="secondary" className="w-full mt-2 rounded-xl" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AppearanceSection />

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <div>
              <CardTitle className="text-base md:text-lg">Legal</CardTitle>
              <CardDescription className="text-xs md:text-sm">Review our policies and terms.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-1">
          <LinkRow label="Terms & Conditions" onClick={() => {}} />
          <LinkRow label="Privacy Policy" onClick={() => {}} />
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl">
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <div>
              <CardTitle className="text-base md:text-lg">Help & Support</CardTitle>
              <CardDescription className="text-xs md:text-sm">Need help? Reach out to our team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setLocation("/support")}>
            <LifeBuoy className="w-4 h-4 mr-2" /> Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSection() {
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-3 px-1 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
