import { useState, useCallback } from "react";
import { useCreateCardAccessUrl } from "@workspace/api-client-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, AlertTriangle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecureCardViewerProps {
  cardId: number;
  cardLabel?: string | null;
}

export function SecureCardViewer({ cardId, cardLabel }: SecureCardViewerProps) {
  const [open, setOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const { toast } = useToast();

  const accessUrlMutation = useCreateCardAccessUrl();

  const handleOpen = useCallback(() => {
    setIframeLoading(true);
    setIframeError(false);
    accessUrlMutation.mutate(
      { cardId },
      {
        onSuccess: () => {
          setOpen(true);
        },
        onError: () => {
          toast({
            title: "Unable to generate secure URL",
            description: "Please try again later.",
            variant: "destructive",
          });
        },
      }
    );
  }, [cardId, accessUrlMutation, toast]);

  const handleClose = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setIframeLoading(true);
      setIframeError(false);
      accessUrlMutation.reset();
    }
  }, [accessUrlMutation]);

  const url = accessUrlMutation.data?.url;
  const expiresAt = accessUrlMutation.data?.expiresAt;
  const isStubUrl = url?.includes("example.com");

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start rounded-xl h-14 text-left border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        onClick={handleOpen}
        disabled={accessUrlMutation.isPending}
      >
        {accessUrlMutation.isPending ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin text-primary" />
        ) : (
          <Shield className="w-5 h-5 mr-3 text-primary" />
        )}
        <div>
          <p className="font-medium">View Full Card Details</p>
          <p className="text-xs text-muted-foreground">Open secure viewer for complete card info</p>
        </div>
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={handleClose}
        title="Secure Card Details"
        description={`Viewing secure details for ${cardLabel || "this card"}`}
        className="sm:max-w-2xl bg-card border-border/50 shadow-2xl"
      >
        <div className="space-y-4">
          {expiresAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                This secure link expires at{" "}
                {new Date(expiresAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {isStubUrl ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-border/50 rounded-xl bg-muted/30">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-semibold">Secure Viewer Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  The secure card details viewer is being connected to the card provider.
                  Once connected, full card details (card number, CVV, expiry) will be
                  displayed securely in this window.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono text-[11px] break-all">{url}</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border/50 bg-background">
              {iframeLoading && !iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Loading secure viewer...</p>
                </div>
              )}

              {iframeError && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                  <div className="space-y-1">
                    <h4 className="font-semibold">Failed to Load</h4>
                    <p className="text-sm text-muted-foreground">
                      The secure viewer could not be loaded. The link may have expired.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIframeError(false);
                      setIframeLoading(true);
                      accessUrlMutation.mutate(
                        { cardId },
                        {
                          onError: () => {
                            toast({
                              title: "Unable to generate secure URL",
                              description: "Please try again later.",
                              variant: "destructive",
                            });
                          },
                        }
                      );
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {!iframeError && url && (
                <iframe
                  src={url}
                  className="w-full border-0"
                  style={{ height: "400px", minHeight: "300px" }}
                  title="Secure Card Details"
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={() => setIframeLoading(false)}
                  onError={() => {
                    setIframeLoading(false);
                    setIframeError(true);
                  }}
                />
              )}
            </div>
          )}

        </div>
      </ResponsiveDialog>
    </>
  );
}
