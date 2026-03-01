import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { label: "~ HOME", path: "/" },
  { label: "> CHAT", path: "/chat" },
  { label: "# RESOURCES", path: "/resources" },
  { label: "$ TOR TALKS", path: "/tor-talks" },
  { label: "! IDEAS", path: "/ideas" },
  { label: "@ TOOLS", path: "/tools" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, alias } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md scanline">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="w-5 h-5 text-accent" />
          <span className="font-creepy text-2xl tracking-[0.2em] text-primary text-glow-strong">
            ZIGZAG
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-1.5 text-xs font-terminal tracking-wider transition-all rounded-sm",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-terminal">
            {isAuthenticated ? alias : "CONNECTING..."}
          </span>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 text-sm font-terminal tracking-wider rounded-sm",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && (
            <div className="px-3 py-2 text-xs font-terminal text-primary/60">
              IDENTITY: {alias}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
