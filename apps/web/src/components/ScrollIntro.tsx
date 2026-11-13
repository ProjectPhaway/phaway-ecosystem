import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const IMG = '/brand/pieza-grafica-1.webp';
const IMG_MOBILE = '/brand/pieza-grafica-1-m.webp';

/**
 * Intro scroll-triggered: ocupa 180vh; durante el primer viewport, el visor
 * queda pineado y la escena (foto + letras) se achica y desvanece para
 * revelar el contenido real debajo. Inspirado en hannahlab.com.
 *
 * - Respeta prefers-reduced-motion: la intro se renderiza como un fade estático.
 * - Mobile (sm): mismo pin, pero con imagen más ligera.
 * - No bloquea el resto del contenido: solo reserva ~1 pantalla extra arriba.
 */
export function ScrollIntro() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=80%',
          scrub: 0.6,
          pin: '.intro-stage',
          pinSpacing: false,
        },
        defaults: { ease: 'none' },
      });
      tl.to('.intro-img', { scale: 1.15, filter: 'brightness(0.55)' }, 0);
      tl.to('.intro-word', { y: -40, opacity: 0 }, 0);
      tl.to('.intro-hint', { opacity: 0, y: -10, duration: 0.3 }, 0);
      tl.to('.intro-veil', { opacity: 1 }, 0.3);
    }, el);

    return () => ctx.revert();
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
      className="relative h-[180vh]"
    >
      <div className="intro-stage relative h-dvh w-full overflow-hidden bg-ink">
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
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-spark-300">
              Ropa deportiva · Hecho en Perú
            </p>
            <p className="intro-word display text-[clamp(3.6rem,14vw,14rem)] drop-shadow-[0_4px_30px_rgba(0,0,0,0.65)]">
              PHAWAY
            </p>
            <p className="intro-word mt-4 text-lg text-paper/85 md:text-2xl">
              Pasión por el deporte.
            </p>
          </div>
        </div>

        {/* Pista "DESLIZA" */}
        <button
          type="button"
          onClick={scrollDown}
          aria-label="Entrar al sitio"
          className="intro-hint group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-max items-center gap-3 text-paper/90 transition-colors hover:text-paper"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">Desliza</span>
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-paper/40 text-xl animate-bounce motion-reduce:animate-none">
            ↓
          </span>
        </button>
      </div>
    </section>
  );
}
