import { PageHero } from '@/components/public/PageHero';

export default function PostgraduatePage() {
  return (
    <>
      <PageHero breadcrumbLabel="Academics" title="Postgraduate" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 mb-10 max-w-2xl">
            Discover our postgraduate programmes, research opportunities, and advanced study
            options.
          </p>
          {/* Programme tabs / content will go here */}
        </div>
      </div>
    </>
  );
}
