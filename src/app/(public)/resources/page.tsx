import Link from 'next/link';
import { CalendarDays, ChartColumnBig } from 'lucide-react';
import { PageHero } from '@/components/public/PageHero';

const resourceCards = [
  {
    title: 'Academic Calendar',
    description:
      'View semester schedules, examination windows, breaks, and key dates for the academic session.',
    href: '/resources/academic-calendar',
    ctaLabel: 'Open Academic Calendar',
    Icon: CalendarDays,
  },
  {
    title: 'Course Statistics',
    description:
      'Submit student counts for coordinated courses by departmental, faculty, and other-student categories.',
    href: '/resources/course-statistics',
    ctaLabel: 'Open Course Statistics',
    Icon: ChartColumnBig,
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero breadcrumbLabel="Resources" title="Resources" />

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="mb-8 max-w-3xl text-base text-gray-700 sm:text-lg">
            Access department resources, tools, and reference information in one place.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {resourceCards.map((card) => {
              const Icon = card.Icon;

              return (
                <article
                  key={card.title}
                  className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-navy/10 text-brand-navy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h2 className="text-2xl font-serif font-semibold text-brand-navy">
                    {card.title}
                  </h2>
                  <p className="mt-3 flex-1 text-base text-gray-700">{card.description}</p>

                  <div className="mt-6">
                    <Link
                      href={card.href}
                      className="inline-flex items-center text-base font-semibold text-brand-navy underline underline-offset-4 transition-colors hover:text-brand-navy/80"
                    >
                      {card.ctaLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
