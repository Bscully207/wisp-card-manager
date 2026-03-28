import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { OrDivider, SocialLoginButtons } from "./social-buttons";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  confirmPassword: z.string().min(4, "Password must be at least 4 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user ?? data);
        toast({ title: "Account created successfully!" });
        setLocation("/dashboard");
      },
      onError: (error: Error) => {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = ({ confirmPassword: _, ...values }: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1.5">Create an account</h1>
        <p className="text-muted-foreground text-sm md:text-base">Join us to start managing your cards today.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput placeholder="john@example.com" className="h-12 placeholder:text-muted-foreground/60" autoComplete="email" inputMode="email" {...field} />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 placeholder:text-muted-foreground/60"
                      autoComplete="new-password"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 placeholder:text-muted-foreground/60"
                      autoComplete="new-password"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
          </Button>
        </form>
      </Form>

      <OrDivider />
      <SocialLoginButtons />
    </div>
  );
}
