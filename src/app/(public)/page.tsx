import { HeroCarousel } from '@/components/public/home/HeroCarousel';
import { StatsStrip } from '@/components/public/home/StatsStrip';
import { AcademicProgrammesSection } from '@/components/public-ref/home/AcademicProgrammesSection';
import { LatestPublications } from '@/components/public/home/LatestPublications';
import { NewsUpdatesSection } from '@/components/public/home/NewsUpdatesSection';
import { UpcomingEventsSection } from '@/components/public/home/UpcomingEventsSection';
import { getFeaturedNews, listPublicNews } from '@/server/public/queries/newsPublic';
import { getFeaturedPublications } from '@/server/public/queries/featuredPublications';

export default async function HomePage() {
  const [featuredNews, latestNews, publications] = await Promise.all([
    getFeaturedNews(3),
    listPublicNews({ page: 1, pageSize: 3 }),
    getFeaturedPublications(3),
  ]);

  return (
    <>
      {/* 1) Hero carousel */}
      <HeroCarousel items={featuredNews} />

      {/* 2) Stats strip (overlapping hero) */}
      <StatsStrip />

      {/* 3) Academic programmes */}
      <AcademicProgrammesSection />

      {/* 4) Latest publications */}
      <LatestPublications items={publications} />

      {/* 5) News updates */}
      <NewsUpdatesSection items={latestNews.items} />

      {/* 6) Upcoming events */}
      <UpcomingEventsSection />
    </>
  );
}
