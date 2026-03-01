import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TerminalCardProps {
  icon: string;
  title: string;
  description: string;
  command: string;
  className?: string;
  children?: ReactNode;
  accentColor?: "primary" | "accent";
  delay?: number;
  onClick?: () => void;
}

const TerminalCard = ({
  icon,
  title,
  description,
  command,
  className,
  accentColor = "primary",
  delay = 0,
  onClick,
}: TerminalCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-sm border border-border bg-card p-6 transition-all duration-300",
        "hover:border-primary/50 animate-pulse-glow",
        "before:absolute before:inset-0 before:rounded-sm before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-100",
        className
      )}
    >
      <div className="relative z-10">
        <h3 className={cn(
          "font-terminal text-lg font-bold mb-3 tracking-wider",
          accentColor === "accent" ? "text-accent text-glow-red" : "text-primary text-glow"
        )}>
          <span className="opacity-60 mr-1">{icon}</span> {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 font-mono">
          {description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-terminal">
          <span className="text-primary/80">$</span>
          <span className="group-hover:text-primary/80 transition-colors">{command}</span>
          <span className="animate-cursor-blink text-primary">▊</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TerminalCard;
