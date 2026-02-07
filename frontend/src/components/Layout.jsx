import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Building2,
  Briefcase,
  Search,
  CreditCard,
} from 'lucide-react';

const navItems = [
  { path: '/company', label: 'Company', icon: Building2 },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/wallet', label: 'Wallet', icon: CreditCard },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - XChange style */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-10 py-3 bg-black/30 backdrop-blur-[20px] border-b border-white/8">
        {/* Logo */}
        <Link to="/" className="text-white text-lg font-medium tracking-wide shrink-0">
          XChange
        </Link>

        {/* Center search bar - hidden on mobile */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 items-center max-w-[500px] mx-4 lg:mx-6 bg-white/8 rounded-[20px] pl-4 pr-4 py-2.5 border border-white/10"
        >
          <Search className="w-[18px] h-[18px] text-white/90 shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search marketplace..."
            className="w-full bg-transparent border-0 outline-none text-white text-sm ml-2.5 placeholder:text-white/60"
          />
        </form>

        {/* Right - 3 icon buttons */}
        <nav className="hidden md:flex items-center gap-2 shrink-0">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70 focus:outline-none focus:ring-0 ${
                  isActive ? 'text-white' : 'text-white/90'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
              </Link>
            );
          })}
        </nav>

        {/* Mobile: icons only */}
        <nav className="md:hidden flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-opacity ${
                  isActive ? 'text-white' : 'text-white/80'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14 shrink-0" />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-6 text-center text-surface-600 text-xs">
        <p>Digital Asset Tartan &mdash; Built on XRPL Testnet &mdash; Hackathon 2026</p>
      </footer>
    </div>
  );
}
