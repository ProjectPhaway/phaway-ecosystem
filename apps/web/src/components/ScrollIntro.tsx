import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const IMG = '/brand/pieza-grafica-1.webp';
const IMG_MOBILE = '/brand/pieza-grafica-1-m.webp';

/**
 * Intro scroll-triggered a pantalla completa (estilo hannahlab.com).
 *
 * - El `intro-stage` siempre es `fixed inset-0 z-[55]`, por eso cubre el
 *   viewport completo tanto en escritorio como en móvil (incluye URL bar).
 * - El `<section>` outer sólo aporta distancia de scroll (`h-dvh` = 100vh).
 * - La timeline con scrub escala la imagen, desvanece título/subtítulo y
 *   funde el stage completo a invisible hacia el final.
 * - Mientras está activo añade `.phaway-intro-active` a <html> y oculta
 *   el "chrome" del sitio (barra superior + header, marcados con
 *   `data-chrome`). En `onLeave` lo restaura y hace `scrollBy(chromeHeight)`
 *   para evitar un salto visual al reincorporar el chrome al flujo.
 * - Respeta `prefers-reduced-motion`.
 */
export function ScrollIntro() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Mide el alto del chrome ANTES de ocultarlo.
    const chromeEls = Array.from(document.querySelectorAll<HTMLElement>('[data-chrome]'));
    const chromeHeight = chromeEls.reduce((sum, e) => sum + e.offsetHeight, 0);

    html.classList.add('phaway-intro-active');
    // Fuerza el cálculo de layout con el chrome ya oculto.
    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onLeave: () => {
            if (!html.classList.contains('phaway-intro-active')) return;
            html.classList.remove('phaway-intro-active');
            if (chromeHeight) window.scrollBy(0, chromeHeight);
          },
        },
        defaults: { ease: 'none' },
      })
        .to('.intro-img', { scale: 1.15, filter: 'brightness(0.55)' }, 0)
        .to('.intro-word', { y: -40, opacity: 0 }, 0)
        .to('.intro-hint', { opacity: 0, y: -10, duration: 0.3 }, 0)
        .to('.intro-veil', { opacity: 1 }, 0.35)
        .to('.intro-stage', { autoAlpha: 0 }, 0.75);
    }, el);

    return () => {
      html.classList.remove('phaway-intro-active');
      ctx.revert();
    };
  }, []);

  const scrollDown = () => {
    const el = root.current;
    if (!el) return;
    window.scrollTo({ top: el.offsetTop + el.offsetHeight, behavior: 'smooth' });
  };

  return (
    <section
      ref={root}
      aria-label="Bienvenida"
      className="relative h-dvh"
    >
      <div className="intro-stage fixed inset-0 z-[55] overflow-hidden bg-ink">
        <picture>
          <source media="(max-width: 640px)" srcSet={IMG_MOBILE} />
          <img
            src={IMG}
            alt=""
            fetchPriority="high"
            className="intro-img absolute inset-0 size-full object-cover will-change-transform"
          />
        </picture>
        {/* Veil para contraste del texto y desvanecido al final */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink/70" />
        <div aria-hidden="true" className="intro-veil pointer-events-none absolute inset-0 bg-paper opacity-0" />

        <div className="relative z-10 grid h-full place-items-center px-4 text-center text-paper">
          <div>
            <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-spark-300 sm:text-xs">
              Ropa deportiva · Hecho en Perú
            </p>
            <p className="intro-word display text-[clamp(3.2rem,14vw,14rem)] drop-shadow-[0_4px_30px_rgba(0,0,0,0.65)]">
              PHAWAY
            </p>
            <p className="intro-word mt-4 text-base text-paper/85 sm:text-lg md:text-2xl">
              Pasión por el deporte.
            </p>
          </div>
        </div>

        {/* Pista "DESLIZA" */}
        <button
          type="button"
          onClick={scrollDown}
          aria-label="Entrar al sitio"
          className="intro-hint group absolute inset-x-0 bottom-6 z-20 mx-auto flex w-max items-center gap-3 text-paper/90 transition-colors hover:text-paper sm:bottom-8"
        >
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] sm:text-xs">Desliza</span>
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-paper/40 text-lg animate-bounce motion-reduce:animate-none sm:size-10 sm:text-xl">
            ↓
          </span>
        </button>
      </div>
    </section>
  );
}
