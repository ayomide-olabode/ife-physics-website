import Image from 'next/image';

interface CurrentHodProps {
  firstName: string | null;
  lastName: string | null;
  academicRank: string | null;
  profileImageUrl: string | null;
  startYear: number;
  hodAddress: { title: string; body: string } | null;
}

export function CurrentHodSection({ hod }: { hod: CurrentHodProps }) {
  const name = [hod.firstName, hod.lastName].filter(Boolean).join(' ');
  const fullName = [hod.academicRank, hod.firstName, hod.lastName].filter(Boolean).join(' ');

  return (
    <section className="mb-16">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: photo + caption */}
        <div className="flex-shrink-0">
          <div className="relative w-64 h-72 bg-gray-100">
            {hod.profileImageUrl ? (
              <Image
                src={hod.profileImageUrl}
                alt={name}
                fill
                sizes="256px"
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
          </div>
          {/* Caption under image */}
          <div className="mt-3">
            <h3 className="text-lg font-semibold text-brand-navy">{fullName}</h3>
            <p className="text-sm text-gray-500">Head, {hod.startYear} –</p>
          </div>
        </div>

        {/* Right: address content */}
        <div className="flex-1">
          {hod.hodAddress ? (
            <>
              <h2 className="text-2xl font-serif font-bold text-brand-navy mb-4">
                {hod.hodAddress.title}
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {hod.hodAddress.body}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No address available.</p>
          )}
        </div>
      </div>
    </section>
  );
}
