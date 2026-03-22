import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const [lockedMobile, setLockedMobile] = React.useState(isMobile);

  React.useEffect(() => {
    if (open) {
      setLockedMobile(isMobile);
    }
  }, [open]);

  const useMobile = open ? lockedMobile : isMobile;

  if (useMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none px-4 pb-8 safe-area-bottom">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="font-display text-2xl">{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="px-0 overflow-y-auto flex-1">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className || "sm:max-w-md bg-card border-border/50 shadow-2xl"}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
