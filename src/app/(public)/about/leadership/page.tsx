import Image from 'next/image';
import { getPublicCurrentHod } from '@/server/public/queries/peoplePublic';
import {
  listPublicAcademicCoordinators,
  listPublicPastHods,
} from '@/server/public/queries/leadershipPublic';
import { PageHero } from '@/components/public/PageHero';
import { CurrentHodSection } from '@/components/public/about/CurrentHodSection';
import { PastHodsGrid } from '@/components/public/about/PastHodsGrid';

export default async function LeadershipPage() {
  const [currentHod, coordinators, pastHods] = await Promise.all([
    getPublicCurrentHod(),
    listPublicAcademicCoordinators(),
    listPublicPastHods(),
  ]);

  return (
    <>
      <PageHero breadcrumbLabel="Our Department" title="Our Leadership" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {/* ─── Current HOD ─── */}
          {currentHod && <CurrentHodSection hod={currentHod} />}

          {/* ─── Academic Coordinators ─── */}
          {coordinators.length > 0 && (
            <section className="mb-16">
              <div className="bg-brand-navy px-6 py-4 mb-6">
                <h2 className="text-xl font-serif font-bold text-white">Academic Coordinators</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {coordinators.map((term) => {
                  const name = [term.staff.firstName, term.staff.middleName, term.staff.lastName]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={term.id}
                      className="bg-white border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <div className="relative h-64 bg-gray-100">
                        {term.staff.profileImageUrl ? (
                          <Image
                            src={term.staff.profileImageUrl}
                            alt={name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-brand-navy">{name}</h3>
                        {term.staff.designation && (
                          <p className="text-sm text-gray-500 mt-1">{term.staff.designation}</p>
                        )}
                        {term.programmeCode && (
                          <span className="inline-block mt-2 bg-brand-navy text-white text-xs font-semibold px-3 py-1">
                            {term.programmeCode}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Past HODs ─── */}
          {pastHods.length > 0 && <PastHodsGrid hods={pastHods} />}

          {/* Empty state */}
          {!currentHod && coordinators.length === 0 && pastHods.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No leadership information available yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
