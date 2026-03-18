function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="#29B6F6" />
    </svg>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Or Continue With</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => {}}
        className="inline-flex items-center justify-center gap-2 h-[44px] rounded-[12px] border-0 bg-[#F6F8FA] dark:bg-[#151520] text-[#5F6276] dark:text-[#9CA3AF] font-normal text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-[#dddfe1] dark:hover:bg-[#1f1f30]"
        style={{ transition: "background-color 0.15s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <GoogleIcon className="w-[15px] h-[15px]" />
        Google
      </button>
      <button
        type="button"
        onClick={() => {}}
        className="inline-flex items-center justify-center gap-2 h-[44px] rounded-[12px] border-0 bg-[#F6F8FA] dark:bg-[#151520] text-[#5F6276] dark:text-[#9CA3AF] font-normal text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-[#dddfe1] dark:hover:bg-[#1f1f30]"
        style={{ transition: "background-color 0.15s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <TelegramIcon className="w-[15px] h-[15px]" />
        Telegram
      </button>
    </div>
  );
}
