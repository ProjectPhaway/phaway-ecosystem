import type { CategoryDto, ProductDto } from '@phaway/shared';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

interface Props {
  category: CategoryDto;
  products: ProductDto[];
}

/**
 * Tarjeta de categoría estilo "muestrario": al pasar el mouse rota entre las
 * fotos de los productos cargados en esa categoría (inspirado en win.com.pe).
 * - Sin JS en móvil: solo muestra la primera foto; el touch "mantener" no es natural.
 * - Respeta prefers-reduced-motion: deja fija la primera foto.
 */
export function CategoryTile({ category, products }: Props) {
  const images = products.slice(0, 4).map((p) => p.mainImageUrl);
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    if (images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % images.length), 900);
  };
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setIndex(0);
  };

  const count = products.length;

  return (
    <Link
      to={`/catalogo?categoria=${category.slug}`}
      className="group relative block overflow-hidden border border-line bg-cloud"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-concrete">
        {images.length ? (
          images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="grid size-full place-items-center text-sm font-semibold text-graphite">
            Próximamente
          </div>
        )}
        <span className="pointer-events-none absolute left-3 top-3 bg-paper/90 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider">
          {count === 0 ? 'Próximamente' : `${count} ${count === 1 ? 'modelo' : 'modelos'}`}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-paper px-4 py-3 transition-colors group-hover:bg-ink group-hover:text-paper">
        <h3 className="text-base font-bold">{category.name}</h3>
        <span aria-hidden="true" className="translate-x-0 text-lg transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
