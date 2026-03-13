import Image from 'next/image';
import {
  listPublicRollOfHonour,
  listDistinctProgrammes,
} from '@/server/public/queries/rollOfHonourPublic';
import { Pagination } from '@/components/public/Pagination';
import { ProgrammeFilter } from './ProgrammeFilter';

export default async function RollOfHonourPage(props: {
  searchParams: Promise<{ page?: string; programme?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const programme = searchParams.programme || undefined;
  const pageSize = 24;

  const [result, programmes] = await Promise.all([
    listPublicRollOfHonour({ page, pageSize, programme }),
    listDistinctProgrammes(),
  ]);

  return (
    <div className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-brand-navy mb-3">Roll of Honour</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Celebrating our top-performing graduates across all programmes.
        </p>

        {/* Programme Filter */}
        {programmes.length > 1 && (
          <div className="mb-8">
            <ProgrammeFilter programmes={programmes} current={programme} />
          </div>
        )}

        {result.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No roll of honour entries found.{programme ? ' Try clearing the filter.' : ''}
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {result.items.map((item) => (
                <div key={item.id} className="border border-gray-200 overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-brand-navy line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-brand-yellow font-medium mt-1">{item.programme}</p>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>CGPA: {item.cgpa.toFixed(2)}</span>
                      <span>{item.graduatingYear}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath="/about/roll-of-honour"
              extraParams={programme ? { programme } : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
