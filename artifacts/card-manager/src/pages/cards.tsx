import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCards, useCreateCard, useTopUpCard, useFreezeCard, getGetCardsQueryKey, getGetCardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { Plus, CreditCard as CardIcon, PlusCircle, Snowflake, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn, getCurrencySymbol } from "@/lib/utils";

const createCardSchema = z.object({
  label: z.string().min(1, "Label is required"),
  currency: z.string().default("EUR"),
  color: z.string().default("blue"),
});

const topUpSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
});

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function Cards() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading } = useGetCards();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const form = useForm<z.infer<typeof createCardSchema>>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { label: "", currency: "EUR", color: "blue" },
  });

  const topUpForm = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 0, description: "Card Top Up" },
  });

  const createMutation = useCreateCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: "Card created successfully" });
        setOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Failed to create card", description: err.message, variant: "destructive" });
      }
    }
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
      onError: (err: any) => {
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

  const onSubmit = (values: z.infer<typeof createCardSchema>) => {
    createMutation.mutate({ data: values });
  };

  const handleTopUp = (cardId: number) => {
    setTopUpCardId(cardId);
    topUpForm.reset({ amount: 0, description: "Card Top Up" });
    setTopUpOpen(true);
  };

  const handlePresetTopUp = (amount: number) => {
    topUpForm.setValue("amount", amount);
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
        
        <Button className="rounded-xl shadow-lg hover-elevate" size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-border p-8 md:p-12 rounded-2xl flex flex-col items-center justify-center text-center bg-card/20">
          <CardIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-semibold mb-2">No cards active</h2>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">You haven't created any cards yet. Create your first virtual card to start transacting.</p>
          <Button onClick={() => setOpen(true)} variant="outline">Create a Card Now</Button>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs h-9 px-3"
                    onClick={() => setLocation(`/cards/${card.id}`)}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Create New Card"
        description="Configure the details for your new virtual debit card."
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries, Travel" className="bg-black/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/20">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Design</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/20">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blue">Electric Blue</SelectItem>
                        <SelectItem value="black">Obsidian Black</SelectItem>
                        <SelectItem value="silver">Titanium Silver</SelectItem>
                        <SelectItem value="purple">Neon Purple</SelectItem>
                        <SelectItem value="green">Emerald Green</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full mt-6 rounded-xl hover-elevate" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Issue Card"}
            </Button>
          </form>
        </Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={topUpOpen}
        onOpenChange={(o) => { setTopUpOpen(o); if (!o) setTopUpCardId(null); }}
        title="Top Up Card"
        description={`Add funds to ${selectedCard?.label || 'your card'}.`}
      >
        <div className="grid grid-cols-5 gap-2 pt-2">
          {PRESET_AMOUNTS.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant={topUpForm.watch("amount") === amt ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-sm font-semibold"
              onClick={() => handlePresetTopUp(amt)}
            >
              {getCurrencySymbol(selectedCard?.currency)}{amt}
            </Button>
          ))}
        </div>
        <Form {...topUpForm}>
          <form
            onSubmit={topUpForm.handleSubmit((v) => {
              if (topUpCardId) topUpMutation.mutate({ cardId: topUpCardId, data: v });
            })}
            className="space-y-4"
          >
            <FormField
              control={topUpForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Amount ({selectedCard?.currency || "EUR"})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="bg-black/20 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full rounded-xl" disabled={topUpMutation.isPending}>
              {topUpMutation.isPending ? "Processing..." : "Confirm Top Up"}
            </Button>
          </form>
        </Form>
      </ResponsiveDialog>
    </div>
  );
}
