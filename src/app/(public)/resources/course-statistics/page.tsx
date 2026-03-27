import { PageHero } from '@/components/public/PageHero';
import { CourseStatisticsForm } from '@/components/public/resources/CourseStatisticsForm';
import { COURSE_STATISTICS_INSTITUTION } from '@/lib/course-statistics/config';

export default function CourseStatisticsPage() {
  return (
    <>
      <PageHero
        breadcrumbLabel="Resources"
        title="Course Statistics"
        backgroundImageSrc="/assets/whitehouse.png"
        backgroundImageAlt="White House, Obafemi Awolow University"
      />

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-[1440px] space-y-8 px-4 sm:px-6 lg:px-8">
          <header className="space-y-3">
            <h2 className="text-3xl font-serif font-bold text-brand-navy sm:text-4xl">
              Course Statistics
            </h2>
            <p className="max-w-4xl text-base text-gray-700 sm:text-lg">
              Course coordinators should enter current student counts by classification for each
              assigned course. This includes students from{' '}
              {COURSE_STATISTICS_INSTITUTION.department}, other departments in the{' '}
              {COURSE_STATISTICS_INSTITUTION.faculty}, and other faculties in the university.
            </p>
          </header>

          <CourseStatisticsForm />
        </div>
      </section>
    </>
  );
}
