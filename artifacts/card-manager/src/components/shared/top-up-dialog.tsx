import { useState } from "react";
import { useTopUpCard, getGetCardsQueryKey, getGetCardQueryKey, getGetAllTransactionsQueryKey, getGetCardTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const topUpSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
});

const PRESET_AMOUNTS = [50, 100, 1000];

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number | null;
  cardLabel?: string;
  currency?: string;
}

export function TopUpDialog({ open, onOpenChange, cardId, cardLabel, currency = "EUR" }: TopUpDialogProps) {
  const [showCustom, setShowCustom] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 0, description: "Card Top Up" },
  });

  const topUpMutation = useTopUpCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAllTransactionsQueryKey() });
        if (cardId) {
          queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
          queryClient.invalidateQueries({ queryKey: getGetCardTransactionsQueryKey(cardId) });
        }
        toast({ title: "Top-up successful!" });
        onOpenChange(false);
        form.reset();
      },
      onError: (err: Error) => {
        toast({ title: "Top-up failed", description: err.message, variant: "destructive" });
      },
    },
  });

  const handlePreset = (amount: number) => {
    form.setValue("amount", amount);
    setShowCustom(false);
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      form.reset({ amount: 0, description: "Card Top Up" });
      setShowCustom(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Top Up Card"
      description={`Add funds to ${cardLabel || "your card"}.`}
    >
      <div className="grid grid-cols-4 gap-2 pt-2">
        {PRESET_AMOUNTS.map((amt) => (
          <Button
            key={amt}
            type="button"
            variant={!showCustom && form.watch("amount") === amt ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-sm font-semibold"
            onClick={() => handlePreset(amt)}
          >
            {getCurrencySymbol(currency)}{amt}
          </Button>
        ))}
        <Button
          type="button"
          variant={showCustom ? "default" : "outline"}
          size="sm"
          className="rounded-xl text-sm font-semibold"
          onClick={() => { setShowCustom(true); form.setValue("amount", 0); }}
        >
          Other
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => {
            if (cardId) topUpMutation.mutate({ cardId, data: v });
          })}
          className="space-y-4"
        >
          {showCustom && (
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Amount ({currency})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="bg-muted/50 text-lg" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full rounded-xl" disabled={topUpMutation.isPending}>
            {topUpMutation.isPending ? "Processing..." : "Confirm Top Up"}
          </Button>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
