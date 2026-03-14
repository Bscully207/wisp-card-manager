import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          isVisible: boolean;
        };
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
        };
        colorScheme: "light" | "dark";
        initDataUnsafe: Record<string, any>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        platform: string;
      };
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const webApp = window.Telegram?.WebApp;

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
      setIsReady(true);

      const root = document.documentElement;
      const tp = webApp.themeParams;
      if (tp.bg_color) root.style.setProperty("--tg-bg-color", tp.bg_color);
      if (tp.text_color) root.style.setProperty("--tg-text-color", tp.text_color);
      if (tp.hint_color) root.style.setProperty("--tg-hint-color", tp.hint_color);
      if (tp.button_color) root.style.setProperty("--tg-button-color", tp.button_color);
      if (tp.secondary_bg_color) root.style.setProperty("--tg-secondary-bg-color", tp.secondary_bg_color);
    }
  }, []);

  return {
    webApp,
    isReady,
    isTelegram: !!webApp,
    platform: webApp?.platform || "unknown",
  };
}

export function useTelegramBackButton(onBack: () => void) {
  const webApp = window.Telegram?.WebApp;

  useEffect(() => {
    if (!webApp) return;

    webApp.BackButton.show();
    webApp.BackButton.onClick(onBack);

    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [onBack]);
}
