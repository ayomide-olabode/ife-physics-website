import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function EmeritusPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return <PeopleCategoryPage title="Emeritus" category="emeritus" searchParams={await searchParams} />;
}
