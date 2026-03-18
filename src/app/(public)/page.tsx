import { HeroCarousel } from '@/components/public/home/HeroCarousel';
import { StatsStrip } from '@/components/public/home/StatsStrip';
import { AcademicProgrammesSection } from '@/components/public-ref/home/AcademicProgrammesSection';
import { ResearchOutputsSection } from '@/components/public/home/ResearchOutputsSection';
import { NewsUpdatesSection } from '@/components/public/home/NewsUpdatesSection';
import { UpcomingEventsSection } from '@/components/public/home/UpcomingEventsSection';
import { getFeaturedNews, listPublicNews } from '@/server/public/queries/newsPublic';
import { getFeaturedResearchOutputs } from '@/server/public/queries/researchPublic';

export default async function HomePage() {
  const [featuredNews, latestNews, featuredResearchOutputs] = await Promise.all([
    getFeaturedNews(3),
    listPublicNews({ page: 1, pageSize: 3 }),
    getFeaturedResearchOutputs(3),
  ]);

  return (
    <>
      {/* 1) Hero carousel */}
      <HeroCarousel items={featuredNews} />

      {/* 2) Stats strip (overlapping hero) */}
      <StatsStrip />

      {/* 3) Academic programmes */}
      <AcademicProgrammesSection />

      {/* 4) Research outputs */}
      <ResearchOutputsSection items={featuredResearchOutputs} />

      {/* 5) News updates */}
      <NewsUpdatesSection items={latestNews.items} />

      {/* 6) Upcoming events */}
      <UpcomingEventsSection />
    </>
  );
}
