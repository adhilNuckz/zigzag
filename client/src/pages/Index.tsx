import GlitchText from "@/components/GlitchText";
import TerminalCard from "@/components/TerminalCard";
import StatusBar from "@/components/StatusBar";
import MatrixRain from "@/components/MatrixRain";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: ">_",
    title: "Global Chat",
    description: "Ephemeral messages. Auto-deleted after 24h. No logs. No traces. Speak freely.",
    command: "connect --global",
    path: "/chat",
    accent: "primary" as const,
  },
  {
    icon: "#",
    title: "Resources",
    description: "Share links, files, and tools. Tagged and searchable. Community curated.",
    command: "ls /resources",
    path: "/resources",
    accent: "primary" as const,
  },
  {
    icon: "$",
    title: "Tor Talks",
    description: "Anonymous blog. Markdown. Upvotes. Community voices from the shadows.",
    command: "cat /tor-talks",
    path: "/tor-talks",
    accent: "accent" as const,
  },
  {
    icon: "!",
    title: "Idea Bay",
    description: "Share ideas. Build in public. Save what inspires you. No judgment.",
    command: "echo $IDEA",
    path: "/ideas",
    accent: "primary" as const,
  },
  {
    icon: "🛡",
    title: "Security Tools",
    description: "Virus scan, phishing check, leak detection, OSINT. Stay protected.",
    command: "sudo scan --all",
    path: "/tools",
    accent: "accent" as const,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen noise-bg">
      <MatrixRain />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="font-creepy text-6xl sm:text-8xl tracking-[0.3em] text-primary text-glow-strong mb-6">
            <GlitchText text="ZIGZAG" as="span" />
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg font-terminal tracking-wider max-w-xl mx-auto">
            Anonymous community platform on the dark web.
          </p>
          <p className="text-muted-foreground/50 text-sm font-terminal tracking-widest mt-2">
            No tracking. No logs. No identity required.
          </p>
        </motion.div>

        {/* Skull separator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-10 mb-4 text-accent/40 text-2xl"
        >
          ☠ ─────────── ☠
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <TerminalCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              command={feature.command}
              accentColor={feature.accent}
              delay={0.1 * i}
              onClick={() => navigate(feature.path)}
            />
          ))}
        </div>
      </section>

      {/* Status Bar */}
      <div className="relative z-10">
        <StatusBar />
      </div>
    </div>
  );
};

export default Index;
