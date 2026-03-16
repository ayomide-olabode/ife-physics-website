'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedNewsItem {
  id: string;
  slug: string;
  title: string;
  date: Date;
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
}

export function HeroCarousel({ items }: { items: FeaturedNewsItem[] }) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? items.length - 1 : c - 1));
  }, [items.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === items.length - 1 ? 0 : c + 1));
  }, [items.length]);

  if (items.length === 0) {
    return (
      <section className="relative h-[500px] sm:h-[600px] bg-brand-navy flex items-center justify-center">
        <div className="text-brand-white text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4">
            Department of Physics &amp; Engineering Physics
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Obafemi Awolowo University, Ile-Ife
          </p>
        </div>
      </section>
    );
  }

  const item = items[current];

  return (
    <section className="relative h-[500px] sm:h-[600px] overflow-hidden">
      {/* Background image */}
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt="" fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex items-center h-full">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-white leading-tight mb-6">
              {item.title}
            </h1>
            <Link
              href={item.buttonLink || `/news/${item.slug}`}
              className="inline-block bg-brand-yellow text-brand-ink font-semibold px-8 py-3 text-sm hover:bg-yellow-500 transition-colors"
            >
              {item.buttonLabel || 'Get started here'}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 transition-colors ${
                i === current ? 'bg-brand-yellow' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
