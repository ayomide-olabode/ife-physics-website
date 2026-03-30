import Link from 'next/link';
import { PageHero } from '@/components/public/PageHero';
import { ResourcesSidebar } from '@/components/public/ResourcesSidebar';

const resourceCards = [
  {
    title: 'Academic Calendar',
    description:
      'View semester schedules, examination windows, breaks, and key dates for the academic session.',
    href: '/resources/academic-calendar',
    ctaLabel: 'Open Academic Calendar',
  },
  {
    title: 'Course Statistics',
    description:
      'Submit student counts for coordinated courses by departmental, faculty, and other-student categories.',
    href: '/resources/course-statistics',
    ctaLabel: 'Open Course Statistics',
  },
  {
    title: 'Departmental Library',
    description:
      'Browse departmental library services and materials for teaching, learning, and research support.',
    href: '/under-construction',
    ctaLabel: 'Open Departmental Library',
  },
  {
    title: 'Newsletter',
    description: 'Read departmental updates, announcements, and featured highlights.',
    href: '/under-construction',
    ctaLabel: 'Open Newsletter',
  },
  {
    title: 'Timetable',
    description: 'Check lecture, lab, and other departmental timetable schedules.',
    href: '/under-construction',
    ctaLabel: 'Open Timetable',
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero breadcrumbLabel="Resources" title="Resources" />

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <ResourcesSidebar activeKey="resources-home" />

            <section className="space-y-8">
              <p className="max-w-3xl text-base text-gray-700 sm:text-lg">
                Access department resources, tools, and reference information in one place.
              </p>
              <div className="h-px w-full bg-gray-300" aria-hidden="true" />

              <div className="grid gap-6 md:grid-cols-2">
                {resourceCards.map((card) => {
                  return (
                    <article
                      key={card.title}
                      className="group flex h-full flex-col border border-gray-200 bg-white p-8 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                    >
                      <h2 className="text-2xl font-serif font-semibold text-brand-navy">
                        {card.title}
                      </h2>
                      <div className="mt-3 border-t border-gray-200" />
                      <p className="mt-3 flex-1 text-base text-gray-700">{card.description}</p>

                      <div className="mt-6">
                        <Link
                          href={card.href}
                          className="inline-flex w-fit items-center border border-brand-navy px-4 py-2 text-base font-semibold text-brand-navy transition-colors duration-300 hover:bg-brand-navy/5"
                        >
                          {card.ctaLabel}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
