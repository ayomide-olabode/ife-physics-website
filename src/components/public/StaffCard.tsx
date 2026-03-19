import Image from 'next/image';
import Link from 'next/link';
import { Building2, Mail } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { formatFullNameWithMiddleInitial } from '@/lib/name';
import type { PublicPeopleCardItem } from '@/server/public/queries/peoplePublic';

function formatAffiliation(item: PublicPeopleCardItem): string | null {
  if (!item.secondaryAffiliation) return null;

  const { name, acronym } = item.secondaryAffiliation;
  if (!acronym) return name;
  return `${name} (${acronym})`;
}

export function StaffCard({ item }: { item: PublicPeopleCardItem }) {
  const personName = formatFullNameWithMiddleInitial({
    firstName: item.firstName,
    middleName: item.middleName,
    lastName: item.lastName,
  });

  const heading = [item.title, personName].filter(Boolean).join(' ').trim() || item.institutionalEmail;
  const affiliation = formatAffiliation(item);
  const isMemoriam = item.isInMemoriam || item.staffStatus === 'IN_MEMORIAM';
  const memoriamMeta =
    isMemoriam && (item.dateOfBirth || item.dateOfDeath)
      ? `Born ${formatDate(item.dateOfBirth)}, Died ${formatDate(item.dateOfDeath)}`
      : null;

  return (
    <article className="group flex h-full flex-col border border-gray-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] border-b border-gray-200 bg-gray-100">
        {item.profileImageUrl ? (
          <Image
            src={item.profileImageUrl}
            alt={heading}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-gray-500">
            No Image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-sm text-gray-700">
        <h2 className="text-lg font-bold leading-snug text-brand-navy">
          <Link
            href={`/people/staff/${item.computedStaffSlug}`}
            className="transition group-hover:underline group-hover:underline-offset-4"
          >
            {heading}
          </Link>
        </h2>

        <p className="text-sm text-gray-600">
          {[item.academicRank, item.designation].filter(Boolean).join(', ') || '—'}
        </p>

        {memoriamMeta && <p className="text-sm text-gray-600">{memoriamMeta}</p>}

        <p className="text-sm text-gray-600">{item.primaryResearchGroup?.name ?? 'Research group not specified'}</p>

        <p className="flex items-start gap-2 text-sm text-gray-600">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{affiliation ?? 'Secondary affiliation not specified'}</span>
        </p>

        <p className="mt-auto flex items-start gap-2 text-sm text-gray-700">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
          <a href={`mailto:${item.institutionalEmail}`} className="break-all hover:underline">
            {item.institutionalEmail}
          </a>
        </p>
      </div>
    </article>
  );
}
