import { useState } from "react";
import { useActivatePhysicalCard, getGetCardQueryKey, getGetCardsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2 } from "lucide-react";

interface ActivateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
}

export function ActivateCardDialog({ open, onOpenChange, cardId }: ActivateCardDialogProps) {
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useActivatePhysicalCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: "Card activated", description: "Your physical card is now active and ready to use." });
        setCode("");
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Activation failed", description: "Invalid activation code. Please check and try again.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    mutation.mutate({ cardId, data: { activationCode: code.trim() } });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Activate Physical Card"
      description="Enter the activation code from the letter that came with your physical card."
      className="sm:max-w-md bg-card border-border/50 shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/30">
          <KeyRound className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Activation Code</p>
            <p className="text-xs text-muted-foreground">Find this code on the sticker attached to your card letter</p>
          </div>
        </div>

        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter activation code"
          className="bg-muted/50 text-center text-lg tracking-widest font-mono"
          maxLength={20}
          autoFocus
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={!code.trim() || mutation.isPending} className="w-full sm:w-auto">
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate Card"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
