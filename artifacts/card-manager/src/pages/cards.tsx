import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCards } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { Plus, CreditCard as CardIcon, PlusCircle, Settings, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CardCreationWizard } from "@/components/card-creation-wizard";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";
import { useCardOrder } from "@/hooks/use-card-order";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableCardItem({ card, onTopUp, onNavigate }: {
  card: any;
  onTopUp: (id: number) => void;
  onNavigate: (path: string) => void;
}) {
  const isFrozen = card.status === "frozen";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-3">
      <div className="relative">
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <CreditCard
          card={card}
          onClick={() => onNavigate(`/cards/${card.id}`)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 rounded-xl text-xs h-9 min-w-0"
          disabled={isFrozen}
          onClick={(e) => { e.stopPropagation(); onTopUp(card.id); }}
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0 mr-1.5" />
          <span className="truncate">Top Up</span>
        </Button>
        <FreezeCardButton cardId={card.id} isFrozen={isFrozen} className="h-9" />
        <Button
          size="icon"
          variant="outline"
          className="rounded-full w-9 h-9 shrink-0"
          onClick={() => onNavigate(`/cards/${card.id}`)}
          title="Card settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Cards() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading } = useGetCards();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { orderedIds, sensors, handleDragEnd } = useCardOrder(cards.map(c => c.id));

  const orderedCards = orderedIds
    .map(id => cards.find(c => c.id === id))
    .filter(Boolean) as typeof cards;

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

      {orderedCards.length === 0 ? (
        <div className="border border-dashed border-border p-8 md:p-12 rounded-2xl flex flex-col items-center justify-center text-center bg-card/20">
          <CardIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-semibold mb-2">No cards active</h2>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">You haven't created any cards yet. Create your first virtual card to start transacting.</p>
          <Button onClick={() => setWizardOpen(true)} variant="outline">Create a Card Now</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {orderedCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <SortableCardItem
                    card={card}
                    onTopUp={handleTopUp}
                    onNavigate={setLocation}
                  />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
