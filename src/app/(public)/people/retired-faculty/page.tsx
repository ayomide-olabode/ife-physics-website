import { PeopleCategoryPage } from '@/components/public/PeopleCategoryPage';

export default async function RetiredFacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <PeopleCategoryPage
      title="Retired Faculty"
      category="retired-faculty"
      searchParams={await searchParams}
    />
  );
}
