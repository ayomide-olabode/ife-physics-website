import Image from 'next/image';
import { ResearchGroupHeroClient } from './ResearchGroupHeroClient';

interface ResearchGroupHeroProps {
  title: string;
  abbreviation: string;
  overview: string | null;
  heroImageUrl: string | null;
}

export function ResearchGroupHero({
  title,
  abbreviation,
  overview,
  heroImageUrl,
}: ResearchGroupHeroProps) {
  return (
    <section className="relative isolate w-full min-h-[420px] md:min-h-[460px] overflow-hidden">
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy/90 to-brand-navy/70" />
      )}

      <div className="pointer-events-none absolute -left-12 bottom-0 z-[1] opacity-35">
        <svg width="420" height="220" viewBox="0 0 420 220" fill="none" aria-hidden="true">
          <path
            d="M2 218C62 102 152 42 296 24C350 16 386 14 418 16"
            stroke="white"
            strokeWidth="2"
          />
          <path d="M2 186C62 86 160 28 300 10C354 4 388 2 418 4" stroke="white" strokeWidth="1.5" />
          <path
            d="M2 154C62 70 168 14 304 2C356 -2 388 -2 418 0"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative z-10 h-full">
        <div className="mx-auto flex min-h-[420px] w-full max-w-[1440px] items-end px-4 pb-10 pt-16 sm:px-6 md:min-h-[460px] lg:px-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_160px] gap-5 md:gap-8 items-end">
            <div className="bg-brand-navy/78 border border-white/30 p-6 md:p-8 backdrop-blur-[1px]">
              <p className="text-sm sm:text-base font-medium mb-2">
                <span className="text-brand-yellow">Research</span>
                <span className="text-white"> / </span>
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
                {title}
              </h1>
              <ResearchGroupHeroClient title={title} overview={overview} />
            </div>

            <div className="h-[160px] w-[160px] md:h-[180px] md:w-[180px] bg-brand-yellow border border-black/10 flex items-center justify-center place-self-start md:place-self-end">
              <span className="text-brand-navy text-4xl md:text-5xl font-black tracking-wide uppercase">
                {abbreviation}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
