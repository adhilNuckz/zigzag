import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'HOME', icon: '~' },
  { path: '/chat', label: 'CHAT', icon: '>' },
  { path: '/resources', label: 'RESOURCES', icon: '#' },
  { path: '/blog', label: 'TOR TALKS', icon: '$' },
  { path: '/ideas', label: 'IDEAS', icon: '!' },
  { path: '/tools', label: 'TOOLS', icon: '@' },
];

export default function Layout() {
  const location = useLocation();
  const { alias, isAuthenticated } = useAuthStore();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-400 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lime-500 font-pixel text-lg animate-glow">⚡</span>
            <span className="font-pixel text-sm text-lime-500 group-hover:text-lime-400 transition-colors">
              ZIGZAG
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 text-xs font-mono transition-all ${
                  location.pathname === item.path
                    ? 'text-lime-500 bg-lime-500/10 border border-lime-500/30'
                    : 'text-dark-300 hover:text-lime-500 hover:bg-lime-500/5 border border-transparent'
                }`}
              >
                <span className="text-lime-500/50 mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Badge */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && (
              <span className="text-xs text-dark-300 font-mono">
                <span className="text-lime-500/50">[</span>
                {alias}
                <span className="text-lime-500/50">]</span>
              </span>
            )}
            <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse-slow" />
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-lime-500 text-xl"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? '×' : '≡'}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenu && (
          <nav className="md:hidden border-t border-dark-400 bg-dark-800 animate-fadeIn">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`block px-4 py-3 text-xs font-mono border-b border-dark-600 ${
                  location.pathname === item.path
                    ? 'text-lime-500 bg-lime-500/5'
                    : 'text-dark-300 hover:text-lime-500'
                }`}
              >
                <span className="text-lime-500/50 mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="px-4 py-3 text-xs text-dark-300 font-mono">
                Identity: {alias}
              </div>
            )}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-400 py-4 text-center">
        <p className="text-xs text-dark-300 font-mono">
          <span className="text-lime-500/30">{'>'}</span> ZigZag — Anonymous Community Platform
          <span className="text-lime-500/30 ml-2">{'<'}</span>
        </p>
      </footer>
    </div>
  );
}
