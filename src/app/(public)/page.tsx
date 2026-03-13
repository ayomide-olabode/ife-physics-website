import { HeroCarousel } from '@/components/public/home/HeroCarousel';
import { StatsStrip } from '@/components/public/home/StatsStrip';
import { AcademicProgrammesSection } from '@/components/public-ref/home/AcademicProgrammesSection';
import { LatestPublications } from '@/components/public/home/LatestPublications';
import { NewsUpdatesSection } from '@/components/public/home/NewsUpdatesSection';
import { UpcomingEventsSection } from '@/components/public/home/UpcomingEventsSection';
import { getFeaturedNews, listPublicNews } from '@/server/public/queries/newsPublic';
import { listPublicEventsOpportunities } from '@/server/public/queries/eventsPublic';
import { getFeaturedPublications } from '@/server/public/queries/featuredPublications';

export default async function HomePage() {
  const [featuredNews, latestNews, events, publications] = await Promise.all([
    getFeaturedNews(4),
    listPublicNews({ page: 1, pageSize: 3 }),
    listPublicEventsOpportunities(6),
    getFeaturedPublications(3),
  ]);

  // Prefer events over opportunities for homepage; take up to 3
  const eventItems = events.filter((e) => e.type === 'EVENT').slice(0, 3);
  const displayEvents = eventItems.length > 0 ? eventItems : events.slice(0, 3);

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
      <UpcomingEventsSection items={displayEvents} />
    </>
  );
}
