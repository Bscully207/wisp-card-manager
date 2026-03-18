import { useState } from "react";
import { useGetCards, useGetAllTransactions } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, CreditCard as CardIcon, PlusCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { TransactionItem } from "@/components/shared/transaction-item";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const selectedCard = cards.find(c => c.id === topUpCardId);
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const recentTransactions = transactions.slice(0, 5);

  const handleTopUp = (cardId: number) => {
    setTopUpCardId(cardId);
    setTopUpOpen(true);
  };

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
                    <FreezeCardButton cardId={card.id} isFrozen={isFrozen} />
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
                {recentTransactions.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={(o) => { setTopUpOpen(o); if (!o) setTopUpCardId(null); }}
        cardId={topUpCardId}
        cardLabel={selectedCard?.label}
        currency={selectedCard?.currency}
      />
    </div>
  );
}
