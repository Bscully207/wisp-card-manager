import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Welcome back!" });
        setLocation("/dashboard");
      },
      onError: (error: Error) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1.5">Welcome back</h1>
        <p className="text-muted-foreground text-sm md:text-base">Enter your details to access your account.</p>
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
                    <InputGroupInput
                      placeholder="john@example.com"
                      className="h-12 placeholder:text-muted-foreground/60"
                      autoComplete="email"
                      inputMode="email"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
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
                        autoComplete="current-password"
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
            <div className="mt-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => {}}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </Form>

      <OrDivider />
      <SocialLoginButtons />
    </div>
  );
}
