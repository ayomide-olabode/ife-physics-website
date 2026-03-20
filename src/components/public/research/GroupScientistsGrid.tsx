import Image from 'next/image';
import { formatPublicStaffName } from '@/lib/publicName';

type Scientist = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  academicRank: string | null;
  designation: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
};

export function GroupScientistsGrid({ scientists }: { scientists: Scientist[] }) {
  if (scientists.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-sm text-gray-500 rounded-none">
        No scientists are currently listed for this group.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scientists.map((scientist) => {
        const name = formatPublicStaffName(scientist);
        return (
          <article
            key={scientist.id}
            className="border border-gray-200 bg-white rounded-none overflow-hidden"
          >
            <div className="relative h-56 bg-gray-100">
              {scientist.profileImageUrl ? (
                <Image
                  src={scientist.profileImageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-brand-navy font-semibold">{name}</h3>
              {scientist.academicRank && (
                <p className="text-sm text-gray-700 leading-snug">{scientist.academicRank}</p>
              )}
              {scientist.designation && (
                <p className="text-sm text-gray-600 leading-snug">{scientist.designation}</p>
              )}
              <a
                href={`mailto:${scientist.institutionalEmail}`}
                className="inline-block text-sm text-brand-navy hover:underline break-all"
              >
                {scientist.institutionalEmail}
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
