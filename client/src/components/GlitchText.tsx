import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

const GlitchText = ({ text, className, as: Tag = "span" }: GlitchTextProps) => {
  return (
    <Tag
      className={cn("relative inline-block animate-flicker", className)}
      data-text={text}
    >
      <span className="relative z-10">{text}</span>
      <span
        className="absolute inset-0 text-accent opacity-70 z-0"
        style={{ clipPath: "inset(10% 0 60% 0)", transform: "translate(-2px, -1px)" }}
        aria-hidden
      >
        {text}
      </span>
      <span
        className="absolute inset-0 text-primary opacity-70 z-0"
        style={{ clipPath: "inset(50% 0 10% 0)", transform: "translate(2px, 1px)" }}
        aria-hidden
      >
        {text}
      </span>
    </Tag>
  );
};

export default GlitchText;
