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
  key: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  imageSrc: string;
  tabLabel: string;
}

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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const sessionStartYear = month >= 9 ? year : year - 1;
  const classYear = sessionStartYear + 4;

  const slides = useMemo<HeroSlide[]>(() => {
    const welcomeSlide: HeroSlide = {
      key: 'welcome',
      title: `Welcome to the If\u1EB9\u0300 legacy, class of ${classYear}!`,
      subtitle: "We're so glad to have you, click the link below to get started.",
      buttonLabel: 'Get started here',
      href: 'https://eportal.oauife.edu.ng',
      imageSrc: '/assets/hero.png',
      tabLabel: `Welcome, class of ${classYear}!`,
    };

    const newsSlides = items.slice(0, 3).map((item) => ({
      key: item.slug || item.id,
      title: item.title,
      subtitle: item.subtitle?.trim() || toExcerpt(item.body),
      buttonLabel: 'Learn more',
      href: `/news/${item.slug}`,
      imageSrc: item.imageUrl ?? '/assets/hero.png',
      tabLabel: item.title,
    }));

    return [welcomeSlide, ...newsSlides].slice(0, 4);
  }, [classYear, items]);

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

  const resolvedActiveIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const activeSlide = slides[resolvedActiveIndex];
  const tabRackWidthPercent = Math.min(Math.max(slides.length, 1), 4) * 25;
  const tabGridClass =
    slides.length === 1
      ? 'grid-cols-1 md:grid-cols-1'
      : slides.length === 2
        ? 'grid-cols-2 md:grid-cols-2'
        : slides.length === 3
          ? 'grid-cols-2 md:grid-cols-3'
          : 'grid-cols-2 md:grid-cols-4';

  return (
    <section
      className="relative h-[420px] md:h-[520px] lg:h-[700px] "
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
      aria-label="Featured news carousel"
    >
      <Image
        src={activeSlide.imageSrc}
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
              key={slide.key}
              id={`hero-panel-${index}`}
              role="tabpanel"
              aria-hidden={!isActive}
              hidden={!isActive}
              aria-labelledby={`hero-tab-${index}`}
              className="pointer-events-auto absolute left-4 right-4 bottom-[96px] bg-white shadow-lg border border-black/10 p-6 md:left-auto md:right-16 md:top-24 md:bottom-auto md:w-[420px] md:p-8"
            >
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-navy leading-tight mb-4">
                {slide.title}
              </h1>
              <p className="text-sm md:text-base text-slate-700 mb-6 line-clamp-4 ">
                {slide.subtitle}
              </p>
              <div className="grow h-auto"></div>
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
        <div className="absolute -bottom-6 left-0 right-0 z-20 w-full">
          <div
            role="tablist"
            aria-label="Featured news slides"
            className={`mx-auto max-w-6xl w-full grid gap-0 relative shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${tabGridClass}`}
            style={{
              width: `${tabRackWidthPercent}%`,
            }}
          >
            {slides.map((slide, index) => {
              const isActive = index === resolvedActiveIndex;
              return (
                <button
                  key={slide.key}
                  id={`hero-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`hero-panel-${index}`}
                  onClick={() => onSelectSlide(index)}
                  className={`h-24 w-full min-w-0 border border-black/5 px-4 text-left transition-colors border-t-brand-yellow border-t-2 relative ${
                    isActive
                      ? 'bg-white text-brand-navy '
                      : 'bg-white text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 left-0 h-1 w-full bg-brand-yellow" />
                  )}
                  <span className="block text-lg line-clamp-2">{slide.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
