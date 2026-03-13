import Image from 'next/image';
import { getPublicCurrentHod } from '@/server/public/queries/peoplePublic';
import {
  listPublicAcademicCoordinators,
  listPublicPastHods,
} from '@/server/public/queries/leadershipPublic';
import { PageHero } from '@/components/public/PageHero';
import { LeadershipModal } from '@/components/public/about/LeadershipModal';

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
          <p className="text-gray-600 mb-12 max-w-2xl">
            Meet the leaders driving excellence in the Department of Physics and Engineering
            Physics.
          </p>

          {/* ─── Current HOD ─── */}
          {currentHod && (
            <section className="mb-16">
              <h2 className="text-2xl font-serif font-bold text-brand-navy mb-6 border-b-2 border-brand-yellow pb-2 inline-block">
                Head of Department
              </h2>

              <div className="flex flex-col md:flex-row gap-8 mt-4">
                {/* Photo */}
                <div className="relative w-48 h-56 flex-shrink-0 bg-gray-100">
                  {currentHod.profileImageUrl ? (
                    <Image
                      src={currentHod.profileImageUrl}
                      alt={[currentHod.firstName, currentHod.lastName].filter(Boolean).join(' ')}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-brand-navy">
                    {[currentHod.academicRank, currentHod.firstName, currentHod.lastName]
                      .filter(Boolean)
                      .join(' ')}
                  </h3>

                  {/* Address */}
                  {currentHod.hodAddress && (
                    <div className="mt-4">
                      <h4 className="text-lg font-medium text-brand-navy">
                        {currentHod.hodAddress.title}
                      </h4>
                      <div className="prose prose-sm max-w-none mt-2 text-gray-700 whitespace-pre-wrap">
                        {currentHod.hodAddress.body}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ─── Academic Coordinators ─── */}
          {coordinators.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-serif font-bold text-brand-navy mb-6 border-b-2 border-brand-yellow pb-2 inline-block">
                Academic Coordinators
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {coordinators.map((term) => {
                  const name = [term.staff.firstName, term.staff.lastName]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div key={term.id} className="border border-gray-200 overflow-hidden">
                      <div className="relative h-56 bg-gray-100">
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
                          <p className="text-xs text-brand-yellow font-medium mt-1">
                            {term.programmeCode}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Past HODs ─── */}
          {pastHods.length > 0 && (
            <section>
              <h2 className="text-2xl font-serif font-bold text-brand-navy mb-6 border-b-2 border-brand-yellow pb-2 inline-block">
                Past Heads of Department
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Click on a card to view their farewell address, if available.
              </p>

              <LeadershipModal hods={pastHods} />
            </section>
          )}

          {/* Empty state – nothing at all */}
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
