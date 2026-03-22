import { useUpdateCardPin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const changePinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
  confirmPin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
  cardLabel?: string | null;
}

export function ChangePinDialog({ open, onOpenChange, cardId, cardLabel }: ChangePinDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof changePinSchema>>({
    resolver: zodResolver(changePinSchema),
    defaultValues: { pin: "", confirmPin: "" },
  });

  const mutation = useUpdateCardPin({
    mutation: {
      onSuccess: () => {
        toast({ title: "PIN updated", description: "Your card PIN has been changed successfully." });
        onOpenChange(false);
        form.reset();
      },
      onError: (err: Error) => {
        toast({ title: "Failed to update PIN", description: err.message, variant: "destructive" });
      },
    },
  });

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      form.reset();
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Change PIN"
      description={`Set a new 6-digit PIN for ${cardLabel || "your card"}.`}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => {
            mutation.mutate({ cardId, data: { pin: v.pin } });
          })}
          className="space-y-4 pt-2"
        >
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New PIN</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    className="bg-muted/50 text-lg tracking-[0.5em] text-center"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm PIN</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    className="bg-muted/50 text-lg tracking-[0.5em] text-center"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update PIN"}
          </Button>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
