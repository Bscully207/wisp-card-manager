import { useFreezeCard, getGetCardsQueryKey, getGetCardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Snowflake, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FreezeCardButtonProps {
  cardId: number;
  isFrozen: boolean;
  variant?: "inline" | "full";
  className?: string;
}

export function FreezeCardButton({ cardId, isFrozen, variant = "inline", className }: FreezeCardButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const freezeMutation = useFreezeCard({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
        toast({ title: data.status === "frozen" ? "Card frozen" : "Card unfrozen" });
      },
    },
  });

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    freezeMutation.mutate({ cardId, data: { frozen: !isFrozen } });
  };

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start rounded-xl h-14 text-left",
          isFrozen && "border-blue-400/50 bg-blue-500/10",
          className
        )}
        onClick={() => handleClick()}
        disabled={freezeMutation.isPending}
      >
        {isFrozen ? (
          <ShieldAlert className="w-5 h-5 mr-3 text-blue-400" />
        ) : (
          <Snowflake className="w-5 h-5 mr-3 text-orange-400" />
        )}
        <div>
          <p className="font-medium">{isFrozen ? "Unfreeze Card" : "Freeze Card"}</p>
          <p className="text-xs text-muted-foreground">
            {isFrozen ? "Re-enable transactions on this card" : "Temporarily disable all transactions"}
          </p>
        </div>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        "flex-1 rounded-xl text-xs h-8",
        isFrozen && "text-blue-400 border-blue-400/50 bg-blue-500/10",
        className
      )}
      onClick={handleClick}
      disabled={freezeMutation.isPending}
    >
      {isFrozen ? (
        <><ShieldAlert className="w-3 h-3 mr-1" /> Unfreeze</>
      ) : (
        <><Snowflake className="w-3 h-3 mr-1" /> Freeze</>
      )}
    </Button>
  );
}
