import { useState } from "react";
import { useGetCards, useGetAllTransactions, useFreezeCard, useTopUpCard, getGetCardsQueryKey, getGetCardQueryKey, getGetAllTransactionsQueryKey } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency, cn, getCurrencySymbol } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Activity, Plus, CreditCard as CardIcon, PlusCircle, Snowflake, ShieldAlert, ReceiptText } from "lucide-react";
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

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

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
    setTopUpOpen(true);
  };

  const handlePresetTopUp = (amount: number) => {
    topUpForm.setValue("amount", amount);
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
    <div className="space-y-6 md:space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
      >
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Welcome back. Here's a summary of your accounts.</p>
        </div>
        <Button onClick={() => setLocation("/cards")} className="rounded-xl shadow-lg hover-elevate" size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-border/50 shadow-xl overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-5xl font-display font-bold text-foreground mt-2">
                {formatCurrency(totalBalance, "EUR")}
              </div>
              <div className="mt-4 md:mt-6 flex gap-3">
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => setLocation("/cards")}>
                  Manage Cards
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {cards.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {cards.slice(0, 2).map((card) => {
                const isFrozen = card.status === "frozen";
                return (
                  <div key={card.id} className="space-y-3">
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
                        onClick={() => handleTopUp(card.id)}
                      >
                        <PlusCircle className="w-3 h-3 mr-1" /> Top Up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "flex-1 rounded-xl text-xs h-9",
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
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs h-9 px-2"
                        onClick={() => setLocation(`/cards/${card.id}`)}
                        title="See Transactions"
                      >
                        <ReceiptText className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-6 md:p-8 bg-card/30">
              <CardIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium text-lg">No cards found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">Create your first virtual debit card to get started.</p>
              <Button onClick={() => setLocation("/cards")}>Create Card</Button>
            </Card>
          )}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6">
            <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link href="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.type === "topup" || tx.type === "refund";
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0",
                          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium capitalize text-sm md:text-base truncate">{tx.type} <span className="text-muted-foreground font-normal lowercase ml-1 hidden sm:inline">{tx.description && `- ${tx.description}`}</span></p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className={cn("font-bold text-sm md:text-base shrink-0 ml-2", isPositive ? "text-emerald-400" : "text-foreground")}>
                        {isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
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
