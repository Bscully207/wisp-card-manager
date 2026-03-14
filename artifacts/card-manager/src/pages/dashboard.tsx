import { useState } from "react";
import { useGetCards, useGetAllTransactions, useFreezeCard, useTopUpCard, getGetCardsQueryKey, getGetCardQueryKey, getGetAllTransactionsQueryKey } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency, cn, getCurrencySymbol } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Plus, CreditCard as CardIcon, PlusCircle, Snowflake, ShieldAlert, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const topUpSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
});

const PRESET_AMOUNTS = [50, 100, 1000];

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [showCustomTopUp, setShowCustomTopUp] = useState(false);

  const topUpForm = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 0, description: "Card Top Up" },
  });

  const freezeMutation = useFreezeCard({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: data.status === 'frozen' ? "Card frozen" : "Card unfrozen" });
      }
    }
  });

  const topUpMutation = useTopUpCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAllTransactionsQueryKey() });
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
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const recentTransactions = transactions.slice(0, 5);

  if (cardsLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Total balance</p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight amount mt-1">
          {formatCurrency(totalBalance, "EUR")}
        </h2>
        <Button
          onClick={() => setLocation("/cards")}
          className="rounded-full shadow-md h-10 px-6 text-sm font-semibold w-full sm:w-auto mt-3"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create a Card
        </Button>
      </motion.div>

      {cards.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
            {cards.slice(0, 2).map((card) => {
              const isFrozen = card.status === "frozen";
              return (
                <div key={card.id} className="space-y-2">
                  <CreditCard 
                    card={card} 
                    onClick={() => setLocation(`/cards/${card.id}`)}
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 rounded-xl text-xs h-8"
                      disabled={isFrozen}
                      onClick={() => handleTopUp(card.id)}
                    >
                      <PlusCircle className="w-3 h-3 mr-1" /> Top Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "flex-1 rounded-xl text-xs h-8",
                        isFrozen && "text-blue-400 border-blue-400/50 bg-blue-500/10"
                      )}
                      onClick={() => freezeMutation.mutate({ cardId: card.id, data: { frozen: !isFrozen } })}
                      disabled={freezeMutation.isPending}
                    >
                      {isFrozen ? (
                        <><ShieldAlert className="w-3 h-3 mr-1" /> Unfreeze</>
                      ) : (
                        <><Snowflake className="w-3 h-3 mr-1" /> Freeze</>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full w-8 h-8 shrink-0"
                      onClick={() => setLocation(`/cards/${card.id}`)}
                      title="Card settings"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-dashed flex flex-col items-center justify-center p-5 md:p-8 bg-card/30">
            <CardIcon className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="font-medium text-base">No cards yet</h3>
            <p className="text-xs text-muted-foreground mb-3 text-center">Create your first virtual debit card to get started.</p>
            <Button size="sm" onClick={() => setLocation("/cards")}>Create Card</Button>
          </Card>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <CardTitle className="text-sm md:text-base font-semibold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 text-xs h-7">
              <Link href="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pt-0">
            {recentTransactions.length > 0 ? (
              <div className="space-y-1.5">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.type === "topup" || tx.type === "refund";
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors">
                      <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                        <div className={cn(
                          "w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0",
                          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium capitalize text-xs md:text-sm truncate">{tx.type} <span className="text-muted-foreground font-normal lowercase ml-1 hidden sm:inline">{tx.description && `- ${tx.description}`}</span></p>
                          <p className="text-[9px] md:text-[11px] text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className={cn("font-bold text-xs md:text-sm shrink-0 ml-2 amount", isPositive ? "text-emerald-400" : "text-foreground")}>
                        {isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
