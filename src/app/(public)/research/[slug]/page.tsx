import { notFound } from 'next/navigation';
import { FocusAreasGrid } from '@/components/public/research/FocusAreasGrid';
import { GroupScientistsGrid } from '@/components/public/research/GroupScientistsGrid';
import { ResearchGroupHero } from '@/components/public/research/ResearchGroupHero';
import { ResearchOutputsList } from '@/components/public/research/ResearchOutputsList';
import {
  getPublicResearchGroupBySlug,
  listPublicRecentOutputsForGroup,
} from '@/server/public/queries/researchPublic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const group = await getPublicResearchGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const initialOutputs = await listPublicRecentOutputsForGroup(group.id, {
    page: 1,
    pageSize: 10,
  });

  const scientists = group.memberships
    .map((membership) => membership.staff)
    .sort((a, b) =>
      `${a.lastName ?? ''} ${a.firstName ?? ''}`.localeCompare(
        `${b.lastName ?? ''} ${b.firstName ?? ''}`,
      ),
    );

  return (
    <>
      <ResearchGroupHero
        title={group.hero.title}
        abbreviation={group.hero.abbreviation}
        overview={group.hero.overview}
        heroImageUrl={group.hero.heroImageUrl}
      />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-10">
        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Focus Areas</h2>
          </div>
          <FocusAreasGrid items={group.focusAreas} />
        </section>

        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Research Group Scientists</h2>
          </div>
          <GroupScientistsGrid scientists={scientists} />
        </section>

        <section className="space-y-4">
          <div className="bg-brand-navy px-5 py-3">
            <h2 className="text-xl font-serif font-bold text-white">Research Outputs</h2>
          </div>
          <ResearchOutputsList groupId={group.id} initial={initialOutputs} />
        </section>
      </main>
    </>
  );
}
