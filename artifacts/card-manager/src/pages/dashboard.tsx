import { useState, useEffect } from "react";
import { useGetCards, useGetAllTransactions } from "@workspace/api-client-react";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, CreditCard as CardIcon, PlusCircle, Settings, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { TransactionItem } from "@/components/shared/transaction-item";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";
import { CardCreationWizard } from "@/components/card-creation-wizard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CARD_ORDER_KEY = "wisp-card-order";

function getStoredOrder(): number[] {
  try {
    const stored = localStorage.getItem(CARD_ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredOrder(ids: number[]) {
  localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(ids));
}

function SortableCard({ card, onTopUp, onNavigate }: {
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
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="relative">
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-20 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <CreditCard
          card={card}
          compact
          onClick={() => onNavigate(`/cards/${card.id}`)}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 rounded-xl text-xs h-8"
          disabled={isFrozen}
          onClick={() => onTopUp(card.id)}
        >
          <PlusCircle className="w-3 h-3 mr-1" /> Top Up
        </Button>
        <FreezeCardButton cardId={card.id} isFrozen={isFrozen} />
        <Button
          size="icon"
          variant="outline"
          className="rounded-full w-8 h-8 shrink-0"
          onClick={() => onNavigate(`/cards/${card.id}`)}
          title="Card settings"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (cards.length > 0) {
      const storedOrder = getStoredOrder();
      const cardIds = cards.map(c => c.id);
      const validStored = storedOrder.filter((id: number) => cardIds.includes(id));
      const missing = cardIds.filter(id => !validStored.includes(id));
      setOrderedIds([...validStored, ...missing]);
    }
  }, [cards]);

  const selectedCard = cards.find(c => c.id === topUpCardId);
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const recentTransactions = transactions.slice(0, 5);

  const orderedCards = orderedIds
    .map(id => cards.find(c => c.id === id))
    .filter(Boolean) as typeof cards;

  const handleTopUp = (cardId: number) => {
    setTopUpCardId(cardId);
    setTopUpOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedIds(prev => {
        const oldIndex = prev.indexOf(active.id as number);
        const newIndex = prev.indexOf(over.id as number);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        setStoredOrder(newOrder);
        return newOrder;
      });
    }
  };

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
        className="space-y-1"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Total balance</p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight amount">
          {formatCurrency(totalBalance, "EUR")}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Button
          onClick={() => setWizardOpen(true)}
          size="sm"
          className="rounded-xl shadow-sm h-9 px-5 text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create Card
        </Button>
      </motion.div>

      {orderedCards.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {orderedCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    onTopUp={handleTopUp}
                    onNavigate={setLocation}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
            <Button size="sm" onClick={() => setWizardOpen(true)}>Create Card</Button>
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
