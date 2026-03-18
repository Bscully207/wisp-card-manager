import { useState, useEffect, useCallback } from "react";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

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

export function useCardOrder(cardIds: number[]) {
  const [orderedIds, setOrderedIds] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (cardIds.length > 0) {
      const storedOrder = getStoredOrder();
      const validStored = storedOrder.filter((id: number) => cardIds.includes(id));
      const missing = cardIds.filter(id => !validStored.includes(id));
      setOrderedIds([...validStored, ...missing]);
    }
  }, [cardIds]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
  }, []);

  return { orderedIds, sensors, handleDragEnd };
}
