import Link from 'next/link';
import { PageHero } from '@/components/public/PageHero';
import { PeopleCategorySidebar } from '@/components/public/PeopleCategorySidebar';
import { PeopleToolbar } from '@/components/public/PeopleToolbar';
import { StaffCard } from '@/components/public/StaffCard';
import { Button } from '@/components/ui/button';
import { listPublicAcademicFaculty } from '@/server/public/queries/peoplePublic';

function parsePositiveInt(value?: string): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function AcademicFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const query = await searchParams;

  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const page = parsePositiveInt(query.page);
  const pageSize = 9;

  const { items, nextPage } = await listPublicAcademicFaculty({
    q,
    page: 1,
    pageSize: page * pageSize,
  });

  const loadMoreParams = new URLSearchParams();
  if (q) loadMoreParams.set('q', q);
  loadMoreParams.set('page', String(page + 1));

  return (
    <>
      <PageHero breadcrumbLabel="People" title="Academic Faculty" />

      <main className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <PeopleCategorySidebar activeKey="academic-faculty" />

            <section className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-brand-navy">Academic Faculty</h1>
                <PeopleToolbar initialQuery={q} />
              </div>

              {items.length === 0 ? (
                <div className="border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
                  No academic faculty records found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <StaffCard key={item.staffId} item={item} />
                    ))}
                  </div>

                  {nextPage && (
                    <div className="pt-2 text-center">
                      <Button asChild className="rounded-none px-8">
                        <Link href={`/people/academic-faculty?${loadMoreParams.toString()}`}>
                          Load More
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
