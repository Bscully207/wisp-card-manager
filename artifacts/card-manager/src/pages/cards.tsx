import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCards, useTopUpCard, useFreezeCard, getGetCardsQueryKey, getGetCardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { Plus, CreditCard as CardIcon, PlusCircle, Snowflake, ShieldAlert, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { CardCreationWizard } from "@/components/card-creation-wizard";

const topUpSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
});

const PRESET_AMOUNTS = [50, 100, 1000];

export default function Cards() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading } = useGetCards();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [showCustomTopUp, setShowCustomTopUp] = useState(false);

  const topUpForm = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 0, description: "Card Top Up" },
  });

  const topUpMutation = useTopUpCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        if (topUpCardId) queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(topUpCardId) });
        toast({ title: "Top-up successful!" });
        setTopUpOpen(false);
        setTopUpCardId(null);
        topUpForm.reset();
      },
      onError: (err: Error) => {
        toast({ title: "Top-up failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const freezeMutation = useFreezeCard({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: data.status === 'frozen' ? "Card frozen" : "Card unfrozen" });
      }
    }
  });

  const handleTopUp = (cardId: number) => {
    setTopUpCardId(cardId);
    topUpForm.reset({ amount: 0, description: "Card Top Up" });
    setShowCustomTopUp(false);
    setTopUpOpen(true);
  };

  const handlePresetTopUp = (amount: number) => {
    topUpForm.setValue("amount", amount);
    setShowCustomTopUp(false);
  };

  const selectedCard = cards.find(c => c.id === topUpCardId);

  if (isLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">My Cards</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Manage your virtual and physical cards.</p>
        </div>
        
        <Button className="rounded-xl shadow-lg hover-elevate" size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-border p-8 md:p-12 rounded-2xl flex flex-col items-center justify-center text-center bg-card/20">
          <CardIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-semibold mb-2">No cards active</h2>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">You haven't created any cards yet. Create your first virtual card to start transacting.</p>
          <Button onClick={() => setWizardOpen(true)} variant="outline">Create a Card Now</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, i) => {
            const isFrozen = card.status === "frozen";
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-3"
              >
                <CreditCard 
                  card={card} 
                  onClick={() => setLocation(`/cards/${card.id}`)}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 rounded-xl text-xs h-9"
                    disabled={isFrozen}
                    onClick={(e) => { e.stopPropagation(); handleTopUp(card.id); }}
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Top Up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "flex-1 rounded-xl text-xs h-9",
                      isFrozen && "text-blue-400 border-blue-400/50 bg-blue-500/10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      freezeMutation.mutate({ cardId: card.id, data: { frozen: !isFrozen } });
                    }}
                    disabled={freezeMutation.isPending}
                  >
                    {isFrozen ? (
                      <><ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Unfreeze</>
                    ) : (
                      <><Snowflake className="w-3.5 h-3.5 mr-1.5" /> Freeze</>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full w-9 h-9 shrink-0"
                    onClick={() => setLocation(`/cards/${card.id}`)}
                    title="Card settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <CardCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <ResponsiveDialog
        open={topUpOpen}
        onOpenChange={(o) => { setTopUpOpen(o); if (!o) setTopUpCardId(null); }}
        title="Top Up Card"
        description={`Add funds to ${selectedCard?.label || 'your card'}.`}
      >
        <div className="grid grid-cols-4 gap-2 pt-2">
          {PRESET_AMOUNTS.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant={!showCustomTopUp && topUpForm.watch("amount") === amt ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-sm font-semibold"
              onClick={() => handlePresetTopUp(amt)}
            >
              {getCurrencySymbol(selectedCard?.currency)}{amt}
            </Button>
          ))}
          <Button
            type="button"
            variant={showCustomTopUp ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-sm font-semibold"
            onClick={() => { setShowCustomTopUp(true); topUpForm.setValue("amount", 0); }}
          >
            Other
          </Button>
        </div>
        <Form {...topUpForm}>
          <form
            onSubmit={topUpForm.handleSubmit((v) => {
              if (topUpCardId) topUpMutation.mutate({ cardId: topUpCardId, data: v });
            })}
            className="space-y-4"
          >
            {showCustomTopUp && (
              <FormField
                control={topUpForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Amount ({selectedCard?.currency || "EUR"})</FormLabel>
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
    </div>
  );
}
