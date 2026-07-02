'use client';

import React, { Suspense, lazy, useEffect } from 'react';
import type { SiteSection, SitePage, SiteBuild, GlobalConfig, NavLink, WowConfig, WowLayer } from './builder';

// Mappa ESPLICITA dei loader: solo i componenti SAFE (zero pacchetti da installare).
// NB: niente template-string `import(`.../${key}`)` — quel pattern crea un context webpack
// che includerebbe TUTTI i file di lab-library (anche NEEDS_DEPS/NEEDS_SHADCN) e fallirebbe la build.
// I componenti non elencati qui mostrano il placeholder "Componente non trovato".
const componentLoaders: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  // HERO
  "hero/pixel-hero": () => import('@/lib/lab-library/hero/pixel-hero').then((m: any) => ({ default: (m as any).PixelHero || m.default })),
  "hero/preview-switch-hero": () => import('@/lib/lab-library/hero/preview-switch-hero').then((m: any) => ({ default: (m as any).PreviewSwitchHero || m.default })),
  "hero/aurora-hero": () => import('@/lib/lab-library/hero/aurora-hero').then((m: any) => ({ default: (m as any).AuroraHero || m.default })),
  "hero/aether-hero": () => import('@/lib/lab-library/hero/aether-hero').then((m: any) => ({ default: (m as any).AetherHero || m.default })),
  "hero/halide-landing": () => import('@/lib/lab-library/hero/halide-landing').then((m: any) => ({ default: m.default })),
  "hero/floating-food-hero": () => import('@/lib/lab-library/hero/floating-food-hero').then((m: any) => ({ default: (m as any).FloatingFoodHero || m.default })),

  // ABOUT
  "about/about-3": () => import('@/lib/lab-library/about/about-3').then((m: any) => ({ default: (m as any).About3 || m.default })),

  // MENU
  "menu/menu-item-card": () => import('@/lib/lab-library/menu/menu-item-card').then((m: any) => ({ default: (m as any).MenuItemCard || m.default })),

  // BOOKING
  "booking/calendar": () => import('@/lib/lab-library/booking/calendar').then((m: any) => ({ default: (m as any).Calendar || m.default })),
  "booking/visualize-booking": () => import('@/lib/lab-library/booking/visualize-booking').then((m: any) => ({ default: m.default })),

  // TESTIMONIAL
  "testimonial/client-feedback": () => import('@/lib/lab-library/testimonial/client-feedback').then((m: any) => ({ default: m.default })),
  "testimonial/testimonial-carousel": () => import('@/lib/lab-library/testimonial/testimonial-carousel').then((m: any) => ({ default: (m as any).TestimonialCarousel || m.default })),
  "testimonial/masonry-grid": () => import('@/lib/lab-library/testimonial/masonry-grid').then((m: any) => ({ default: (m as any).MasonryGrid || m.default })),

  // FEATURES
  "features/feature-carousel": () => import('@/lib/lab-library/features/feature-carousel').then((m: any) => ({ default: (m as any).FeatureCarousel || m.default })),
  "features/features-section": () => import('@/lib/lab-library/features/features-section').then((m: any) => ({ default: (m as any).FeaturesSection || m.default })),
  "features/feature-highlight": () => import('@/lib/lab-library/features/feature-highlight').then((m: any) => ({ default: (m as any).FeatureHighlight || m.default })),
  "features/cybernetic-bento-grid": () => import('@/lib/lab-library/features/cybernetic-bento-grid').then((m: any) => ({ default: (m as any).CyberneticBentoGrid || m.default })),
  "features/feature-section": () => import('@/lib/lab-library/features/feature-section').then((m: any) => ({ default: (m as any).FeatureSection || m.default })),

  // TICKET
  "ticket/animated-ticket": () => import('@/lib/lab-library/ticket/animated-ticket').then((m: any) => ({ default: (m as any).AnimatedTicket || m.default })),

  // PRODUCT
  "product/product-card": () => import('@/lib/lab-library/product/product-card').then((m: any) => ({ default: (m as any).ProductCard || m.default })),

  // SCROLL ANIMATIONS
  "scroll-animations/container-scroll": () => import('@/lib/lab-library/scroll-animations/container-scroll').then((m: any) => ({ default: (m as any).ContainerScroll || m.default })),
  "scroll-animations/zoom-parallax": () => import('@/lib/lab-library/scroll-animations/zoom-parallax').then((m: any) => ({ default: (m as any).ZoomParallax || m.default })),

  // PATTERNS
  "patterns/grid-modal-detail": () => import('@/lib/lab-library/patterns/grid-modal-detail').then((m: any) => ({ default: (m as any).GridModalDetail || m.default })),

  // FORM
  "form/contact": () => import('@/lib/lab-library/form/contact').then((m: any) => ({ default: (m as any).Contact || m.default })),

  // FOOTER
  "footer/site-footer": () => import('@/lib/lab-library/footer/site-footer').then((m: any) => ({ default: (m as any).SiteFooter || m.default })),

  // NEEDS-DEPS (ora installate) — il render solo-client è gestito da guard interni ai componenti
  "premium-3d/particle-sphere": () => import('@/lib/lab-library/premium-3d/particle-sphere').then((m: any) => ({ default: (m as any).ParticleSphere || m.default })),
  "map/mapcn-map": () => import('@/lib/lab-library/map/mapcn-map').then((m: any) => ({ default: (m as any).MapcnMap || m.default })),
  "testimonial/case-studies": () => import('@/lib/lab-library/testimonial/case-studies').then((m: any) => ({ default: (m as any).CaseStudies || m.default })),
  "features/features-cards-shader": () => import('@/lib/lab-library/features/features-cards-shader').then((m: any) => ({ default: (m as any).FeaturesCards || m.default })),
  "pricing/pricing-animated": () => import('@/lib/lab-library/pricing/pricing-animated').then((m: any) => ({ default: (m as any).Pricing || m.default })),

  // SHADCN-BASED (primitivi ora creati)
  "badge/announcement": () => import('@/lib/lab-library/badge/announcement').then((m: any) => ({ default: (m as any).Announcement || m.default })),
  "pricing/pricing-card-with-features": () => import('@/lib/lab-library/pricing/pricing-card-with-features').then((m: any) => ({ default: (m as any).PricingCardWithFeatures || m.default })),

  // DECORATIVI / UTILITY
  "text-animations/split-text": () => import('@/lib/lab-library/text-animations/split-text').then((m: any) => ({ default: (m as any).SplitText || m.default })),
  "text-animations/blur-text": () => import('@/lib/lab-library/text-animations/blur-text').then((m: any) => ({ default: (m as any).BlurText || m.default })),
  "text-animations/count-up": () => import('@/lib/lab-library/text-animations/count-up').then((m: any) => ({ default: (m as any).CountUpText || m.default })),
  "hover-effects/star-border": () => import('@/lib/lab-library/hover-effects/star-border').then((m: any) => ({ default: (m as any).StarBorder || m.default })),
  "hover-effects/tilted-card": () => import('@/lib/lab-library/hover-effects/tilted-card').then((m: any) => ({ default: (m as any).TiltedCard || m.default })),
  "backgrounds/grid-pattern": () => import('@/lib/lab-library/backgrounds/grid-pattern').then((m: any) => ({ default: (m as any).GridPattern || m.default })),
  "backgrounds/dots-pattern": () => import('@/lib/lab-library/backgrounds/dots-pattern').then((m: any) => ({ default: (m as any).DotsPattern || m.default })),
  "backgrounds/aurora": () => import('@/lib/lab-library/backgrounds/aurora').then((m: any) => ({ default: (m as any).Aurora || m.default })),
  "gallery/marquee": () => import('@/lib/lab-library/gallery/marquee').then((m: any) => ({ default: (m as any).Marquee || m.default })),
  "gallery/image-grid": () => import('@/lib/lab-library/gallery/image-grid').then((m: any) => ({ default: (m as any).ImageGrid || m.default })),
  "navigation/sticky-header": () => import('@/lib/lab-library/navigation/sticky-header').then((m: any) => ({ default: (m as any).StickyHeader || m.default })),
  "navigation/mobile-menu": () => import('@/lib/lab-library/navigation/mobile-menu').then((m: any) => ({ default: (m as any).MobileMenu || m.default })),
  "micro-interactions/click-spark": () => import('@/lib/lab-library/micro-interactions/click-spark').then((m: any) => ({ default: (m as any).ClickSpark || m.default })),
  "micro-interactions/loader-elegant": () => import('@/lib/lab-library/micro-interactions/loader-elegant').then((m: any) => ({ default: (m as any).LoaderElegant || m.default })),
  "special/announcement-banner": () => import('@/lib/lab-library/special/announcement-banner').then((m: any) => ({ default: (m as any).AnnouncementBanner || m.default })),

  // TEXT-ANIMATIONS (batch)
  "text-animations/text-type": () => import('@/lib/lab-library/text-animations/text-type').then((m: any) => ({ default: (m as any).TextType || m.default })),
  "text-animations/shuffle-text": () => import('@/lib/lab-library/text-animations/shuffle-text').then((m: any) => ({ default: (m as any).ShuffleText || m.default })),
  "text-animations/text-pressure": () => import('@/lib/lab-library/text-animations/text-pressure').then((m: any) => ({ default: (m as any).TextPressure || m.default })),
  "text-animations/circular-text": () => import('@/lib/lab-library/text-animations/circular-text').then((m: any) => ({ default: (m as any).CircularText || m.default })),
  "text-animations/curved-loop": () => import('@/lib/lab-library/text-animations/curved-loop').then((m: any) => ({ default: (m as any).CurvedLoop || m.default })),
  "text-animations/decrypted-text": () => import('@/lib/lab-library/text-animations/decrypted-text').then((m: any) => ({ default: (m as any).DecryptedText || m.default })),
  "text-animations/scroll-reveal": () => import('@/lib/lab-library/text-animations/scroll-reveal').then((m: any) => ({ default: (m as any).ScrollReveal || m.default })),
  "text-animations/rotating-text": () => import('@/lib/lab-library/text-animations/rotating-text').then((m: any) => ({ default: (m as any).RotatingText || m.default })),
  "text-animations/scroll-float": () => import('@/lib/lab-library/text-animations/scroll-float').then((m: any) => ({ default: (m as any).ScrollFloat || m.default })),
  "text-animations/scroll-velocity": () => import('@/lib/lab-library/text-animations/scroll-velocity').then((m: any) => ({ default: (m as any).ScrollVelocity || m.default })),
  "text-animations/variable-proximity": () => import('@/lib/lab-library/text-animations/variable-proximity').then((m: any) => ({ default: (m as any).VariableProximity || m.default })),
  "text-animations/text-hover-effect": () => import('@/lib/lab-library/text-animations/text-hover-effect').then((m: any) => ({ default: (m as any).TextHoverEffect || m.default })),

  // EFFETTI: hover / cursors / micro / special / container
  "hover-effects/pixel-transition": () => import('@/lib/lab-library/hover-effects/pixel-transition').then((m: any) => ({ default: (m as any).PixelTransition || m.default })),
  "hover-effects/glare-hover": () => import('@/lib/lab-library/hover-effects/glare-hover').then((m: any) => ({ default: (m as any).GlareHover || m.default })),
  "hover-effects/electric-border": () => import('@/lib/lab-library/hover-effects/electric-border').then((m: any) => ({ default: (m as any).ElectricBorder || m.default })),
  "hover-effects/magnet": () => import('@/lib/lab-library/hover-effects/magnet').then((m: any) => ({ default: (m as any).Magnet || m.default })),
  "hover-effects/card-3d": () => import('@/lib/lab-library/hover-effects/card-3d').then((m: any) => ({ default: (m as any).Card3D || m.default })),
  "cursors/target-cursor": () => import('@/lib/lab-library/cursors/target-cursor').then((m: any) => ({ default: (m as any).TargetCursor || m.default })),
  "cursors/ghost-cursor": () => import('@/lib/lab-library/cursors/ghost-cursor').then((m: any) => ({ default: (m as any).GhostCursor || m.default })),
  "cursors/blob-cursor": () => import('@/lib/lab-library/cursors/blob-cursor').then((m: any) => ({ default: (m as any).BlobCursor || m.default })),
  "micro-interactions/sparkle-trail": () => import('@/lib/lab-library/micro-interactions/sparkle-trail').then((m: any) => ({ default: (m as any).SparkleTrail || m.default })),
  "special/true-focus": () => import('@/lib/lab-library/special/true-focus').then((m: any) => ({ default: (m as any).TrueFocus || m.default })),
  "container/glass-surface": () => import('@/lib/lab-library/container/glass-surface').then((m: any) => ({ default: (m as any).GlassSurface || m.default })),

  // GALLERY (batch 7/9)
  "gallery/orbit-images": () => import('@/lib/lab-library/gallery/orbit-images').then((m: any) => ({ default: (m as any).OrbitImages || m.default })),
  "gallery/logo-loop": () => import('@/lib/lab-library/gallery/logo-loop').then((m: any) => ({ default: (m as any).LogoLoop || m.default })),
  "gallery/image-trail": () => import('@/lib/lab-library/gallery/image-trail').then((m: any) => ({ default: (m as any).ImageTrail || m.default })),
  "gallery/circular-gallery": () => import('@/lib/lab-library/gallery/circular-gallery').then((m: any) => ({ default: (m as any).CircularGallery || m.default })),
  "gallery/stack-gallery": () => import('@/lib/lab-library/gallery/stack-gallery').then((m: any) => ({ default: (m as any).StackGallery || m.default })),
  "gallery/masonry-images": () => import('@/lib/lab-library/gallery/masonry-images').then((m: any) => ({ default: (m as any).MasonryImages || m.default })),
  "gallery/dome-gallery": () => import('@/lib/lab-library/gallery/dome-gallery').then((m: any) => ({ default: (m as any).DomeGallery || m.default })),

  // BACKGROUNDS (batch 7/9)
  "backgrounds/magic-rings": () => import('@/lib/lab-library/backgrounds/magic-rings').then((m: any) => ({ default: (m as any).MagicRings || m.default })),
  "backgrounds/laser-flow": () => import('@/lib/lab-library/backgrounds/laser-flow').then((m: any) => ({ default: (m as any).LaserFlow || m.default })),
  "backgrounds/magnet-lines": () => import('@/lib/lab-library/backgrounds/magnet-lines').then((m: any) => ({ default: (m as any).MagnetLines || m.default })),
  "backgrounds/gradual-blur": () => import('@/lib/lab-library/backgrounds/gradual-blur').then((m: any) => ({ default: (m as any).GradualBlur || m.default })),

  // STRUCTURAL (batch 8/9)
  "structural/animated-list": () => import('@/lib/lab-library/structural/animated-list').then((m: any) => ({ default: (m as any).AnimatedList || m.default })),
  "structural/scroll-stack": () => import('@/lib/lab-library/structural/scroll-stack').then((m: any) => ({ default: (m as any).ScrollStack || m.default })),
  "structural/magic-bento": () => import('@/lib/lab-library/structural/magic-bento').then((m: any) => ({ default: (m as any).MagicBento || m.default })),

  // NAVIGATION (batch 8/9)
  "navigation/bubble-menu": () => import('@/lib/lab-library/navigation/bubble-menu').then((m: any) => ({ default: (m as any).BubbleMenu || m.default })),
  "navigation/card-nav": () => import('@/lib/lab-library/navigation/card-nav').then((m: any) => ({ default: (m as any).CardNav || m.default })),
  "navigation/pill-nav": () => import('@/lib/lab-library/navigation/pill-nav').then((m: any) => ({ default: (m as any).PillNav || m.default })),
  "navigation/staggered-menu": () => import('@/lib/lab-library/navigation/staggered-menu').then((m: any) => ({ default: (m as any).StaggeredMenu || m.default })),

  // PREMIUM-3D (batch 8/9) — render client-only via lazy + guard mounted interno
  "premium-3d/antigravity": () => import('@/lib/lab-library/premium-3d/antigravity').then((m: any) => ({ default: (m as any).Antigravity || m.default })),
  "premium-3d/globe-3d": () => import('@/lib/lab-library/premium-3d/globe-3d').then((m: any) => ({ default: (m as any).Globe3D || m.default })),
  "premium-3d/ribbons": () => import('@/lib/lab-library/premium-3d/ribbons').then((m: any) => ({ default: (m as any).Ribbons || m.default })),
  "premium-3d/splash-cursor": () => import('@/lib/lab-library/premium-3d/splash-cursor').then((m: any) => ({ default: (m as any).SplashCursor || m.default })),
  "premium-3d/fluid-glass": () => import('@/lib/lab-library/premium-3d/fluid-glass').then((m: any) => ({ default: (m as any).FluidGlass || m.default })),

  // SPECIAL + DASHBOARD-UI + EXTRA (batch 9/9)
  "special/shape-blur": () => import('@/lib/lab-library/special/shape-blur').then((m: any) => ({ default: (m as any).ShapeBlur || m.default })),
  "special/text-flipping-board": () => import('@/lib/lab-library/special/text-flipping-board').then((m: any) => ({ default: (m as any).TextFlippingBoard || m.default })),
  "dashboard-ui/table-toolbar": () => import('@/lib/lab-library/dashboard-ui/table-toolbar').then((m: any) => ({ default: (m as any).TableToolbar || m.default })),
  "dashboard-ui/notch": () => import('@/lib/lab-library/dashboard-ui/notch').then((m: any) => ({ default: (m as any).Notch || m.default })),
  "badge/tag-list": () => import('@/lib/lab-library/badge/tag-list').then((m: any) => ({ default: (m as any).TagList || m.default })),
  "micro-interactions/copy-button": () => import('@/lib/lab-library/micro-interactions/copy-button').then((m: any) => ({ default: (m as any).CopyButton || m.default })),
  "micro-interactions/scroll-progress": () => import('@/lib/lab-library/micro-interactions/scroll-progress').then((m: any) => ({ default: (m as any).ScrollProgress || m.default })),

  // HOTEL (modalità hotel)
  "booking/booking-links": () => import('@/lib/lab-library/booking/booking-links').then((m: any) => ({ default: (m as any).BookingLinks || m.default })),
  "rooms/room-card": () => import('@/lib/lab-library/rooms/room-card').then((m: any) => ({ default: (m as any).RoomCard || m.default })),
  "hotel/hotel-amenities": () => import('@/lib/lab-library/hotel/hotel-amenities').then((m: any) => ({ default: (m as any).HotelAmenities || m.default })),
};

// Componenti con form di contatto: ricevono projectId per postare a /api/messages/{projectId}.
const FORM_COMPONENTS = new Set(['form/contact', 'form/contact-2']);

/**
 * Renderizza un componente libreria "nudo" (senza wrapping/sezione) dai suoi
 * props JSON. Usato per i layer WOW (cursore globale, background hero) che sono
 * overlay decorativi, non sezioni di contenuto. Ignora silenziosamente le chiavi
 * senza loader (nessun placeholder rosso: sono decorazioni opzionali).
 */
export function RenderBareLibrary({ component, props }: { component: string; props?: Record<string, unknown> }) {
  const loader = componentLoaders[component];
  if (!loader) return null;
  const Lazy = lazy(loader);
  return <Suspense fallback={null}><Lazy {...(props || {})} /></Suspense>;
}

/** Indice della prima sezione hero (o prima sezione libreria) di una pagina. */
function heroSectionIndex(page: SitePage): number {
  const h = page.sections.findIndex(s => s.type === 'library' && s.component.startsWith('hero/'));
  return h >= 0 ? h : page.sections.findIndex(s => s.type === 'library');
}

export function RenderSection({ section, projectId }: { section: SiteSection; projectId?: string }) {
  if (section.type === 'library') {
    const loader = componentLoaders[section.component];
    if (!loader) {
      return (
        <div className="p-8 border-2 border-dashed border-red-500 bg-red-50 text-red-700">
          Componente non trovato: {section.component}
        </div>
      );
    }
    const LazyComponent = lazy(loader);
    const fallback = <div className="p-8 text-center text-muted-foreground">Caricamento sezione...</div>;

    // Collection: section.props è un array → renderizza N istanze del componente.
    if (Array.isArray(section.props)) {
      return (
        <Suspense fallback={fallback}>
          <div className="collection-section lab-collection grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8 py-8">
            {section.props.map((itemProps, i) => (
              <LazyComponent key={i} {...itemProps} />
            ))}
          </div>
        </Suspense>
      );
    }

    // Inietta projectId nei componenti form (per il submit all'endpoint messaggi).
    const props = (projectId && FORM_COMPONENTS.has(section.component))
      ? { ...section.props, projectId }
      : section.props;

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }
  // type === 'custom' — compilazione TSX a runtime non ancora attiva: mostra il codice in anteprima.
  return (
    <div className="custom-section border-y border-amber-200">
      <div className="bg-amber-50 p-4 text-xs text-amber-700">
        ⚠️ Componente custom in fase di compilazione (categoria: {section.categoryHint}
        {section.baseComponent ? ` · base: ${section.baseComponent}` : ''}). {section.reason}
      </div>
      <pre className="overflow-auto bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-300">
        <code>{section.tsxCode}</code>
      </pre>
    </div>
  );
}

/** Header di navigazione semplice (link interni alle pagine via #slug). */
export function RenderHeader({ links, businessName }: { links: NavLink[]; businessName?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full" style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)', boxShadow: '0 1px 0 var(--lumino-muted, #e5e5e5)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">{businessName || 'Lumino'}</span>
        <nav className="hidden gap-6 md:flex">
          {links.map((l, i) => <a key={i} href={`#${l.slug}`} className="text-sm font-medium opacity-80 transition-opacity hover:opacity-100">{l.label}</a>)}
        </nav>
      </div>
    </header>
  );
}

/** Footer con link pagine + copyright. */
export function RenderFooter({ links, businessName }: { links: NavLink[]; businessName?: string }) {
  return (
    <footer className="w-full border-t" style={{ background: 'var(--lumino-bg, #ffffff)', color: 'var(--lumino-ink, #1a1a1a)', borderColor: 'var(--lumino-muted, #e5e5e5)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="font-semibold">{businessName || 'Lumino'}</span>
        <nav className="flex flex-wrap justify-center gap-4">
          {links.map((l, i) => <a key={i} href={`#${l.slug}`} className="text-sm opacity-70 transition-opacity hover:opacity-100">{l.label}</a>)}
        </nav>
        <p className="text-xs opacity-50">© {new Date().getFullYear()} {businessName || ''}. Tutti i diritti riservati.</p>
      </div>
    </footer>
  );
}

/** Renderizza una singola pagina del sito (header + sezioni + footer), con palette + font globali. */
export function RenderPage({ page, globalConfig, navigation, projectId, wow }: { page: SitePage; globalConfig?: GlobalConfig; navigation?: { header: NavLink[]; footer: NavLink[] }; projectId?: string; wow?: WowConfig }) {
  const businessName = globalConfig?.businessName;
  const p = globalConfig?.palette;
  const font = globalConfig?.font;

  // Font loading dinamico: inietta il link Google Fonts per heading + body.
  useEffect(() => {
    const families = [font?.heading, font?.body].filter(Boolean) as string[];
    if (!families.length) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch { /* noop */ } };
  }, [font?.heading, font?.body]);

  const style = {
    ...(p ? { '--lumino-bg': p.bg, '--lumino-ink': p.ink, '--lumino-accent': p.accent, '--lumino-muted': p.muted, background: 'var(--lumino-bg)', color: 'var(--lumino-ink)' } : {}),
    ...(font?.body ? { fontFamily: `'${font.body}', system-ui, sans-serif` } : {}),
    ...(font?.heading ? { '--lumino-font-heading': `'${font.heading}', Georgia, serif` } : {}),
  } as React.CSSProperties;

  // Se la pagina ha già un footer di libreria (es. site-footer hotel), non duplicare quello minimale.
  const hasFooterSection = page.sections.some(s => s.type === 'library' && s.component.startsWith('footer/'));

  // Layer WOW — cursore globale (fixed) + background animato dietro l'hero.
  const heroBg = page.effects?.heroBackground;
  const heroIdx = heroBg ? heroSectionIndex(page) : -1;

  return (
    <div className="lab-page" style={style}>
      {/* I titoli ereditano il font heading se impostato. */}
      {font?.heading && <style>{`.lab-page h1,.lab-page h2,.lab-page h3{font-family:var(--lumino-font-heading);}`}</style>}
      {/* WOW: cursore custom globale (position:fixed nel componente). */}
      {wow?.enabled && wow.cursor && <RenderBareLibrary component={wow.cursor.component} props={wow.cursor.props} />}
      {navigation?.header && navigation.header.length > 0 && <RenderHeader links={navigation.header} businessName={businessName} />}
      {/* id = sectionKey → le àncore '#<sectionKey>' delle CTA funzionano. */}
      {page.sections.map((section, i) => {
        const bg = i === heroIdx ? heroBg : undefined;
        return (
          <div key={i} id={section.sectionKey || undefined} style={bg ? { position: 'relative' } : undefined}>
            {bg && (
              <div className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
                <RenderBareLibrary component={bg.component} props={bg.props} />
              </div>
            )}
            <div style={bg ? { position: 'relative', zIndex: 1 } : undefined}>
              <RenderSection section={section} projectId={projectId} />
            </div>
          </div>
        );
      })}
      {!hasFooterSection && navigation?.footer && navigation.footer.length > 0 && <RenderFooter links={navigation.footer} businessName={businessName} />}
    </div>
  );
}

/** Renderizza il sito multi-pagina mostrando la pagina richiesta (o la home). */
export function RenderSite({ build, currentSlug, projectId }: { build: SiteBuild; currentSlug?: string; projectId?: string }) {
  const page = currentSlug
    ? build.pages.find(p => p.slug === currentSlug)
    : (build.pages.find(p => p.isHomepage) || build.pages[0]);
  if (!page) return <div className="p-8 text-center text-sm text-zinc-500">Pagina non trovata</div>;
  return <RenderPage page={page} globalConfig={build.globalConfig} navigation={build.navigation} projectId={projectId} wow={build.wow} />;
}
