import Image from 'next/image';
import { StatsStrip } from '@/components/public/StatsStrip';

interface PageHeroProps {
  /** Breadcrumb prefix, e.g. "Our Department", "Academics" */
  breadcrumbLabel: string;
  /** Page title, e.g. "Our History" */
  title: string;
  /** Path to a public image for the background */
  backgroundImageSrc?: string;
  /** Alt text for the background image */
  backgroundImageAlt?: string;
  /** Whether to render the StatsStrip overlapping the hero bottom (default true) */
  showStats?: boolean;
}

export function PageHero({
  breadcrumbLabel,
  title,
  backgroundImageSrc,
  backgroundImageAlt = '',
  showStats = true,
}: PageHeroProps) {
  return (
    <>
      {/* Hero banner */}
      <section className="relative h-[340px] sm:h-[380px] lg:h-[420px] overflow-hidden">
        {/* Background */}
        {backgroundImageSrc ? (
          <Image
            src={backgroundImageSrc}
            alt={backgroundImageAlt}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          /* Gradient fallback when no image is provided */
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy/90 to-brand-navy/70" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-brand-navy/70" />

        {/* Content – bottom-aligned */}
        <div className="relative z-10 flex h-full items-end">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-20">
            {/* Breadcrumb */}
            <p className="text-sm sm:text-base font-medium mb-2">
              <span className="text-brand-yellow">{breadcrumbLabel}</span>
              <span className="text-white"> / </span>
            </p>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
              {title}
            </h1>
          </div>
        </div>
      </section>

      {/* Stats strip (visually overlapping hero bottom) */}
      {showStats && <StatsStrip />}
    </>
  );
}
