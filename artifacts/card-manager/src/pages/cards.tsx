import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCards } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { Plus, CreditCard as CardIcon, PlusCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CardCreationWizard } from "@/components/card-creation-wizard";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";

export default function Cards() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading } = useGetCards();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const selectedCard = cards.find(c => c.id === topUpCardId);

  const handleTopUp = (cardId: number) => {
    setTopUpCardId(cardId);
    setTopUpOpen(true);
  };

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
                    className="flex-1 rounded-xl text-xs h-9 min-w-0"
                    disabled={isFrozen}
                    onClick={(e) => { e.stopPropagation(); handleTopUp(card.id); }}
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0 mr-1.5" />
                    <span className="truncate">Top Up</span>
                  </Button>
                  <FreezeCardButton cardId={card.id} isFrozen={isFrozen} className="h-9" />
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
