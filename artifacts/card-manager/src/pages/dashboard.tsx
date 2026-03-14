import { useGetCards, useGetAllTransactions } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Activity, Plus, CreditCard as CardIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();

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
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's a summary of your accounts.</p>
        </div>
        <Button onClick={() => setLocation("/cards")} className="rounded-xl shadow-lg hover-elevate">
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Balance Card */}
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
              <div className="text-5xl font-display font-bold text-foreground mt-2">
                {formatCurrency(totalBalance, "EUR")}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => setLocation("/cards")}>
                  Manage Cards
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Cards Carousel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {cards.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cards.slice(0, 2).map((card, i) => (
                <CreditCard 
                  key={card.id} 
                  card={card} 
                  onClick={() => setLocation(`/cards/${card.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-8 bg-card/30">
              <CardIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium text-lg">No cards found</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first virtual debit card to get started.</p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link href="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.type === "topup" || tx.type === "refund";
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type} <span className="text-muted-foreground font-normal lowercase ml-1">{tx.description && `- ${tx.description}`}</span></p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                        </div>
                      </div>
                      <div className={cn("font-bold", isPositive ? "text-emerald-400" : "text-foreground")}>
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
    </div>
  );
}
