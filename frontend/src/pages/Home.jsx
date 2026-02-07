import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

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

      {/* Slides 2–8: Blank sections */}
      {Array.from({ length: TOTAL_SLIDES - 1 }, (_, i) => (
        <section
          key={i}
          ref={(el) => setSectionRef(i + 1, el)}
          className={`home-slide shrink-0 ${BLANK_SECTION_STYLES[i] || 'bg-surface-950'}`}
          aria-label={`Section ${i + 2}`}
        >
          <div className="h-full flex items-center justify-center px-6">
            {/* Empty container ready for future content */}
          </div>
        </section>
      ))}
    </div>
  );
}
