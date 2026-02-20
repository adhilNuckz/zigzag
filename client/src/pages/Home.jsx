import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const features = [
  {
    icon: '>_',
    title: 'Global Chat',
    desc: 'Ephemeral messages. Auto-deleted after 24h. No logs.',
    link: '/chat',
    cmd: 'connect --global',
  },
  {
    icon: '#',
    title: 'Resources',
    desc: 'Share links, files, and tools. Tagged and searchable.',
    link: '/resources',
    cmd: 'ls /resources',
  },
  {
    icon: '$',
    title: 'Tor Talks',
    desc: 'Anonymous blog. Markdown. Upvotes. Community voices.',
    link: '/blog',
    cmd: 'cat /tor-talks',
  },
  {
    icon: '!',
    title: 'Idea Bay',
    desc: 'Share ideas. Build in public. Save what inspires you.',
    link: '/ideas',
    cmd: 'echo $IDEA',
  },
  {
    icon: '@',
    title: 'Security Tools',
    desc: 'Virus scan, phishing check, leak detection, OSINT.',
    link: '/tools',
    cmd: 'sudo scan --all',
  },
];

export default function Home() {
  const { alias, isAuthenticated } = useAuthStore();

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div className="text-center py-12 md:py-20">
        <h1
          className="font-pixel text-2xl md:text-4xl text-lime-500 mb-4 animate-glow glitch"
          data-text="ZIGZAG"
        >
          ZIGZAG
        </h1>
        <p className="text-dark-300 text-sm md:text-base font-mono max-w-xl mx-auto mb-2">
          Anonymous community platform on the dark web.
        </p>
        <p className="text-dark-400 text-xs font-mono">
          No tracking. No logs. No identity required.
        </p>

        {isAuthenticated && (
          <div className="mt-6 inline-block terminal-card">
            <p className="text-xs font-mono text-dark-300">
              <span className="text-lime-500">root@zigzag</span>
              <span className="text-dark-400">:</span>
              <span className="text-lime-400">~</span>
              <span className="text-dark-400">$ </span>
              <span className="text-lime-500">whoami</span>
            </p>
            <p className="text-sm font-mono text-lime-500 mt-1">{alias}</p>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {features.map((f) => (
          <Link
            key={f.link}
            to={f.link}
            className="terminal-card group cursor-pointer animate-slideUp"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lime-500 text-lg font-mono">{f.icon}</span>
              <h3 className="font-pixel text-xs text-lime-500 group-hover:animate-glow">
                {f.title}
              </h3>
            </div>
            <p className="text-dark-300 text-xs font-mono mb-3">{f.desc}</p>
            <div className="text-xs text-dark-400 font-mono">
              <span className="text-lime-500/50">$ </span>{f.cmd}
            </div>
          </Link>
        ))}
      </div>

      {/* Status Bar */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-3 terminal-card">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse-slow" />
            <span className="text-xs text-dark-300 font-mono">SYSTEM ONLINE</span>
          </div>
          <span className="text-dark-500">|</span>
          <span className="text-xs text-dark-400 font-mono">ONION ROUTED</span>
          <span className="text-dark-500">|</span>
          <span className="text-xs text-dark-400 font-mono">ZERO LOGS</span>
        </div>
      </div>
    </div>
  );
}
