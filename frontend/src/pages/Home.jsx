import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, ArrowRightLeft, TrendingUp, Plus, ShoppingBag, Briefcase } from 'lucide-react';
import * as api from '../services/api';

const TOTAL_SLIDES = 8;

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1566288623386-8f3f43b94aab?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1573867639040-6dd25fa5f597?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=400&h=500&fit=crop',
];

/* Subtle different backgrounds for blank sections (2–8) */
const BLANK_SECTION_STYLES = [
  'bg-gradient-to-b from-surface-950 to-surface-900',
  'bg-gradient-to-b from-surface-900 to-surface-950',
  'bg-gradient-to-br from-surface-950 via-primary-900/20 to-surface-900',
  'bg-gradient-to-bl from-surface-950 via-surface-900 to-surface-800/30',
  'bg-gradient-to-b from-surface-900 via-surface-800/40 to-surface-950',
  'bg-gradient-to-br from-surface-950 to-surface-800/50',
  'bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950',
];

export default function Home() {
  const gridRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const sectionRefs = useRef([]);
  const activeIndexRef = useRef(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  // Parallax for hero
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const animate = () => {
      currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.05;
      currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.05;

      const grid = gridRef.current;
      if (grid) {
        const items = grid.querySelectorAll('.grid-item');
        items.forEach((item, index) => {
          const speed = 0.5 + (index % 3) * 0.3;
          const x = currentRef.current.x * 15 * speed;
          const y = -currentRef.current.y * 15 * speed;
          item.style.transform = `translate(${x}px, ${y}px)`;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToSlide = useCallback((index) => {
    const clamped = Math.max(0, Math.min(index, TOTAL_SLIDES - 1));
    const el = sectionRefs.current[clamped];
    if (el) {
      activeIndexRef.current = clamped;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Keyboard: Arrow Up/Down, Page Up/Down (use outer scroll)
  useEffect(() => {
    const handleScroll = () => {
      const sections = sectionRefs.current.filter(Boolean);
      if (!sections.length) return;
      const viewportMid = window.scrollY + window.innerHeight / 2;
      let current = 0;
      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].getBoundingClientRect().top + window.scrollY;
        const bottom = top + sections[i].offsetHeight;
        if (viewportMid >= top && viewportMid < bottom) {
          current = i;
          break;
        }
        if (viewportMid < top) break;
        current = i;
      }
      activeIndexRef.current = current;
    };

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          scrollToSlide(activeIndexRef.current + 1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          scrollToSlide(activeIndexRef.current - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrollToSlide]);

  const setSectionRef = (i, el) => {
    sectionRefs.current[i] = el;
  };

  return (
    <div className="relative -my-8 w-screen max-w-none ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] overflow-x-hidden">
      {/* Slide 1: Hero */}
      <section
        ref={(el) => setSectionRef(0, el)}
        className="home-slide shrink-0"
        aria-label="Hero"
      >
        <div className="home-hero overflow-x-hidden h-full min-h-full">
          <div ref={gridRef} className="image-grid" aria-hidden="true">
            {HERO_IMAGES.map((src, i) => (
              <div key={i} className="grid-item">
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="hero-content">
            <h1 className="hero-title">
              Transparent
              <br />
              Decentralized
              <br />
              Immutable
            </h1>
            <p className="hero-subtitle">
              The next generation of distributed ledger infrastructure.
            </p>
            <Link to="/marketplace" className="cta-button">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Slide 2: Stats + How It Works + Features (from main) */}
      <section
        ref={(el) => setSectionRef(1, el)}
        className={`home-slide shrink-0 overflow-y-auto ${BLANK_SECTION_STYLES[0] || 'bg-surface-950'}`}
        aria-label="How it works"
      >
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Creators', value: stats.creators, color: 'text-blue-400' },
                { label: 'NFTs Minted', value: stats.nfts, color: 'text-purple-400' },
                { label: 'Transactions', value: stats.transactions, color: 'text-green-400' },
                { label: 'Trade Volume', value: `${stats.totalVolumeXrp?.toFixed(0) || 0} XRP`, color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-surface-500 mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-center mb-10 text-white">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Plus, title: 'Create & Mint', desc: 'Connect your wallet and tokenize any digital asset as an NFT on XRPL. Set your price and list on the marketplace.', color: 'from-blue-600 to-blue-800' },
                { icon: ShoppingBag, title: 'Buy & Sell', desc: 'Browse the marketplace and buy digital asset NFTs. XRP goes directly to the seller. Relist at any price.', color: 'from-purple-600 to-purple-800' },
                { icon: ArrowRightLeft, title: 'Earn Royalties', desc: 'Create royalty pools and distribute income to NFT holders. Transparent, on-chain revenue sharing.', color: 'from-green-600 to-green-800' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="bg-surface-900 border border-surface-800 rounded-2xl p-8 text-center hover:border-primary-700/50 transition-colors">
                  <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'On-Chain Value', desc: 'Price history stored on XRPL' },
              { icon: Zap, label: 'XRPL Speed', desc: '3-5 second settlement times' },
              { icon: TrendingUp, label: 'Royalty Pools', desc: 'Earn income from creator royalties' },
              { icon: Briefcase, label: 'Free Market', desc: 'Relist at any price you choose' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 bg-surface-900/50 border border-surface-800/50 rounded-xl p-5">
                <Icon className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard" className="px-8 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition-all">
              Start Creating
            </Link>
            <Link to="/marketplace" className="px-8 py-3 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-xl font-semibold transition-all">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Slides 3–8: Blank sections */}
      {Array.from({ length: TOTAL_SLIDES - 2 }, (_, i) => (
        <section
          key={i}
          ref={(el) => setSectionRef(i + 2, el)}
          className={`home-slide shrink-0 ${BLANK_SECTION_STYLES[i + 1] || 'bg-surface-950'}`}
          aria-label={`Section ${i + 3}`}
        >
          <div className="h-full flex items-center justify-center px-6" />
        </section>
      ))}
    </div>
  );
}
