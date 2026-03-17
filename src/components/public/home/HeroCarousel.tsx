'use client';

import { useCallback, useEffect, useMemo, useState, type FocusEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedNewsItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  body: string;
  date: Date;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
}

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  image: string;
}

const FALLBACK_IMAGE = '/assets/physics.png';
const AUTO_ADVANCE_MS = 5000;

function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function toExcerpt(value: string, maxLength = 140): string {
  const text = toPlainText(value);
  if (!text) return 'Discover updates from the Department of Physics and Engineering Physics.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function HeroCarousel({ items }: { items: FeaturedNewsItem[] }) {
  const slides = useMemo<HeroSlide[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle?.trim() || toExcerpt(item.body),
        buttonLabel: item.buttonLabel || 'Get started here',
        href: `/news/${item.slug}`,
        image: item.imageUrl || FALLBACK_IMAGE,
      })),
    [items],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setIsReducedMotion(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isReducedMotion || isHovering || isFocusWithin) return;
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, isFocusWithin, isHovering, isReducedMotion, slides.length]);

  const handleBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextFocused = event.relatedTarget;
    if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) {
      setIsFocusWithin(false);
    }
  }, []);

  const onSelectSlide = useCallback((index: number) => setActiveIndex(index), []);

  if (slides.length === 0) {
    return (
      <section className="relative h-[420px] md:h-[520px] lg:h-[600px] bg-brand-navy flex items-center justify-center">
        <div className="text-brand-white text-center px-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">
            Department of Physics and Engineering Physics
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Obafemi Awolowo University, Ile-Ife
          </p>
        </div>
      </section>
    );
  }

  const resolvedActiveIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const activeSlide = slides[resolvedActiveIndex];

  return (
    <section
      className="relative h-[420px] md:h-[520px] lg:h-[600px] overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
      aria-label="Featured news carousel"
    >
      <Image
        src={activeSlide.image}
        alt={activeSlide.title}
        fill
        className="object-cover"
        sizes="100vw"
        priority={resolvedActiveIndex === 0}
      />

      <div className="absolute inset-0 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pointer-events-none">
        {slides.map((slide, index) => {
          const isActive = index === resolvedActiveIndex;
          return (
            <div
              key={slide.id}
              id={`hero-panel-${index}`}
              role="tabpanel"
              aria-hidden={!isActive}
              hidden={!isActive}
              aria-labelledby={`hero-tab-${index}`}
              className="pointer-events-auto absolute left-4 right-4 bottom-[96px] bg-white shadow-lg border border-black/10 p-6 md:left-auto md:right-16 md:top-24 md:bottom-auto md:w-[420px] md:p-8"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-brand-navy/70 mb-3">Welcome</p>
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-navy leading-tight mb-4">
                {slide.title}
              </h1>
              <p className="text-sm md:text-base text-slate-700 mb-6">{slide.subtitle}</p>
              <Link
                href={slide.href}
                className="inline-flex items-center justify-center bg-brand-yellow text-brand-ink font-semibold px-6 py-3 text-sm transition-colors hover:bg-yellow-500"
              >
                {slide.buttonLabel}
              </Link>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 mx-auto">
          <div
            role="tablist"
            aria-label="Featured news slides"
            className="mx-auto max-w-[1440px] grid grid-cols-2 md:grid-cols-4 gap-0"
          >
            {slides.map((slide, index) => {
              const isActive = index === resolvedActiveIndex;
              return (
                <button
                  key={slide.id}
                  id={`hero-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`hero-panel-${index}`}
                  onClick={() => onSelectSlide(index)}
                  className={`h-24 border border-black/10 px-4 text-left transition-colors ${
                    isActive
                      ? 'bg-white text-brand-navy border-t-4 border-t-brand-yellow'
                      : 'bg-white/90 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wider mb-1">Featured</span>
                  <span className="block text-sm font-semibold truncate">{slide.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
