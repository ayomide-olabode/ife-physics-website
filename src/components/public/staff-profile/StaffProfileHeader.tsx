import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Mail } from 'lucide-react';
import { formatPublicStaffName } from '@/lib/publicName';
import type { PublicStaffProfile } from '@/server/public/queries/peoplePublic';

function formatYear(date: Date | null): string | null {
  return date ? String(date.getUTCFullYear()) : null;
}

export function StaffProfileHeader({ staff }: { staff: PublicStaffProfile }) {
  const fullName = formatPublicStaffName({
    firstName: staff.firstName,
    middleName: staff.middleName,
    lastName: staff.lastName,
  });
  const heading = [staff.title, fullName].filter(Boolean).join(' ').trim() || staff.institutionalEmail;
  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  const birthYear = isInMemoriam ? formatYear(staff.dateOfBirth) : null;
  const deathYear = isInMemoriam ? formatYear(staff.dateOfDeath) : null;
  const memorialYears =
    birthYear && deathYear ? `${birthYear} – ${deathYear}` : deathYear ?? birthYear ?? null;

  return (
    <section className="grid grid-cols-1 gap-6 border border-gray-200 bg-white p-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          {isInMemoriam ? 'In Memoriam' : 'Faculty Profile'}
        </p>
        <h1 className="text-3xl font-serif font-bold text-brand-navy">{heading}</h1>

        {isInMemoriam ? (
          <>
            {memorialYears ? <p className="text-sm text-gray-600">{memorialYears}</p> : null}

            <div className="mt-2 border-t border-gray-200 pt-3 space-y-2">
              {staff.academicRank ? <p className="text-sm text-gray-700">{staff.academicRank}</p> : null}

              {staff.primaryResearchGroup && (
                <p className="text-sm text-gray-700">
                  Research Group:{' '}
                  <Link
                    href={`/research/${staff.primaryResearchGroup.slug}`}
                    className="font-semibold text-brand-navy hover:underline"
                  >
                    {staff.primaryResearchGroup.name}
                  </Link>
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {(staff.academicRank || staff.designation) && (
              <p className="text-sm text-gray-700">
                {[staff.academicRank, staff.designation].filter(Boolean).join(', ')}
              </p>
            )}

            {staff.primaryResearchGroup && (
              <p className="text-sm text-gray-700">
                Research Group:{' '}
                <Link
                  href={`/research/${staff.primaryResearchGroup.slug}`}
                  className="font-semibold text-brand-navy hover:underline"
                >
                  {staff.primaryResearchGroup.name}
                </Link>
              </p>
            )}

            <p className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${staff.institutionalEmail}`} className="break-all hover:underline">
                {staff.institutionalEmail}
              </a>
            </p>
          </>
        )}

        {(staff.googleScholarUrl || staff.orcidUrl) && (
          <div
            className={`flex flex-wrap items-center gap-3 text-sm text-gray-700 ${isInMemoriam ? 'mt-2 border-t border-gray-200 pt-3' : 'pt-1'}`}
          >
            {staff.googleScholarUrl && (
              <a
                href={staff.googleScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-navy hover:underline"
              >
                Google Scholar
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {staff.orcidUrl && (
              <a
                href={staff.orcidUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-navy hover:underline"
              >
                ORCID
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="h-fit border border-gray-200 bg-gray-100">
        {staff.profileImageUrl ? (
          <Image
            src={staff.profileImageUrl}
            alt={heading}
            width={520}
            height={520}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm font-semibold uppercase tracking-wide text-gray-500">
            No Image
          </div>
        )}
      </div>
    </section>
  );
}
