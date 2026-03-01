import { useAuthStore } from "@/stores/authStore";

const StatusBar = () => {
  const { isAuthenticated, alias } = useAuthStore();

  return (
    <div className="border-t border-border bg-card/50 py-4">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-terminal text-muted-foreground tracking-widest">SYSTEM ONLINE</span>
        </div>
        <span className="text-border">│</span>
        <span className="text-xs font-terminal text-muted-foreground tracking-widest">ONION ROUTED</span>
        <span className="text-border">│</span>
        <span className="text-xs font-terminal text-muted-foreground tracking-widest">ZERO LOGS</span>
        <span className="text-border">│</span>
        <span className="text-xs font-terminal text-muted-foreground tracking-widest">E2E ENCRYPTED</span>
        {isAuthenticated && alias && (
          <>
            <span className="text-border">│</span>
            <span className="text-xs font-terminal text-primary/70 tracking-widest">
              IDENTITY: {alias}
            </span>
          </>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground/40 font-terminal mt-3 tracking-widest">
        &gt; ZigZag — Anonymous Community Platform &lt;
      </p>
    </div>
  );
};

export default StatusBar;
