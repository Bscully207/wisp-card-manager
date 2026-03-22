import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId?: number | null;
  cardLabel?: string;
}

export function ExportDialog({ open, onOpenChange, cardId, cardLabel }: ExportDialogProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      let url: string;
      if (cardId) {
        url = `/api/cards/${cardId}/transactions/export`;
      } else {
        url = `/api/transactions/export`;
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        throw new Error("Failed to export transactions");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      link.download = filenameMatch?.[1] || "transactions.csv";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({ title: "Export complete", description: "Your transactions have been downloaded." });
      onOpenChange(false);
    } catch {
      toast({ title: "Export failed", description: "Could not export transactions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setStartDate("");
      setEndDate("");
    }
  };

  const description = cardId
    ? `Export transactions for ${cardLabel || "this card"} as CSV.`
    : "Export all transactions as CSV.";

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Export Transactions"
      description={description}
    >
      <div className="space-y-5 pt-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="export-start-date">Start Date</Label>
            <Input
              id="export-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export-end-date">End Date</Label>
            <Input
              id="export-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Format: <span className="font-medium text-foreground">CSV</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Leave dates empty to export all available transactions.
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={loading}
          className="w-full rounded-xl"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {loading ? "Exporting..." : "Download CSV"}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
