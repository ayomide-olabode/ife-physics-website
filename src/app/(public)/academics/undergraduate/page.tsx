import { PageHero } from '@/components/public/PageHero';

export default function UndergraduatePage() {
  return (
    <>
      <PageHero breadcrumbLabel="Academics" title="Undergraduate" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 mb-10 max-w-2xl">
            Explore our undergraduate programmes in Physics, Engineering Physics, and Science
            Laboratory Technology.
          </p>
          {/* Programme tabs / content will go here */}
        </div>
      </div>
    </>
  );
}
