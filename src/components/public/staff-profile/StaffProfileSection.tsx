import Link from 'next/link';
import type { StaffType } from '@prisma/client';
import { Prose } from '@/components/public/Prose';
import { formatDate } from '@/lib/format-date';
import { StudentThesesByYear } from '@/components/public/staff-profile/StudentThesesByYear';
import {
  getPublicTributesForStaff,
  listPublicProjectsForStaff,
  listPublicResearchOutputsForStaff,
  listPublicTeachingForStaff,
  listPublicThesesForStaff,
} from '@/server/public/queries/peoplePublic';
import {
  type StaffProfileTab,
  normalizeStaffProfileTab,
} from '@/components/public/staff-profile/tabConfig';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeHtml(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function ProfileTextBlock({ value }: { value: string }) {
  if (looksLikeHtml(value)) {
    return <Prose html={value} />;
  }
  return <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{value}</p>;
}

function buildTabHref(staffSlug: string, tab: StaffProfileTab, page?: number) {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (page && page > 1) {
    params.set('page', String(page));
  }
  return `/people/staff/${staffSlug}?${params.toString()}`;
}

function SectionPager({
  staffSlug,
  tab,
  prevPage,
  nextPage,
  currentPage,
}: {
  staffSlug: string;
  tab: StaffProfileTab;
  prevPage?: number;
  nextPage?: number;
  currentPage: number;
}) {
  if (!prevPage && !nextPage) return null;

  return (
    <div className="mt-6 flex items-center justify-between pt-4">
      {prevPage ? (
        <Link
          href={buildTabHref(staffSlug, tab, prevPage)}
          className="border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-gray-500">Page {currentPage}</span>
      {nextPage ? (
        <Link
          href={buildTabHref(staffSlug, tab, nextPage)}
          className="border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export async function StaffProfileSection({
  staffId,
  staffSlug,
  tab,
  isInMemoriam,
  staffType,
  page,
  bioHtml,
  education,
  researchInterests,
  membershipOfProfessionalOrganizations,
  submitted,
}: {
  staffId: string;
  staffSlug: string;
  tab: StaffProfileTab;
  isInMemoriam: boolean;
  staffType: StaffType;
  page: number;
  bioHtml: string | null;
  education: string | null;
  researchInterests: string | null;
  membershipOfProfessionalOrganizations: string | null;
  submitted: boolean;
}) {
  const activeTab = normalizeStaffProfileTab(tab, { isInMemoriam, staffType });

  if (activeTab === 'bio') {
    const sections = [
      { title: 'Bio', content: bioHtml },
      { title: 'Education', content: education },
      { title: 'Research Interests', content: researchInterests },
      {
        title: 'Membership of Professional Organizations',
        content: membershipOfProfessionalOrganizations,
      },
    ].filter((section) => Boolean(section.content?.trim()));

    return (
      <section className="bg-white p-6">
        {sections.length > 0 ? (
          <div className="space-y-8">
            {sections.map((section) => (
              <article key={section.title} className="space-y-3">
                <h3 className="text-lg font-semibold text-brand-navy">{section.title}</h3>
                <ProfileTextBlock value={section.content!.trim()} />
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No profile information available yet.</p>
        )}
      </section>
    );
  }

  if (activeTab === 'research-outputs') {
    const data = await listPublicResearchOutputsForStaff(staffId, { page, pageSize: 8 });
    return (
      <section className="bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-600">No research outputs available.</p>
        ) : (
          <div className="space-y-4 divide-x divider-gray-200">
            {data.items.map((output) => {
              const citation = [
                output.authors,
                output.year ? `(${output.year})` : null,
                output.title,
                output.sourceTitle || output.venue,
              ]
                .filter(Boolean)
                .join('. ');

              return (
                <article key={output.id} className="">
                  <p className="text-sm leading-6 text-gray-800">{citation}</p>
                </article>
              );
            })}
            <SectionPager
              staffSlug={staffSlug}
              tab={activeTab}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              currentPage={data.page}
            />
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'projects') {
    const data = await listPublicProjectsForStaff(staffId, { page, pageSize: 8 });
    return (
      <section className="border border-gray-200 bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-600">No projects available.</p>
        ) : (
          <div className="space-y-4">
            {data.items.map((project) => (
              <article key={project.id} className="border border-gray-200 p-4">
                <h3 className="font-semibold text-brand-navy">{project.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {project.status}
                  {project.startYear ? ` • ${project.startYear}` : ''}
                  {project.endYear ? ` - ${project.endYear}` : ''}
                </p>
                {project.descriptionHtml && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-700">
                    {stripHtml(project.descriptionHtml)}
                  </p>
                )}
              </article>
            ))}
            <SectionPager
              staffSlug={staffSlug}
              tab={activeTab}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              currentPage={data.page}
            />
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'student-theses') {
    const data = await listPublicThesesForStaff(staffId, { page: 1, pageSize: 200 });
    return (
      <section className="border border-gray-200 bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-600">No student theses available.</p>
        ) : (
          <StudentThesesByYear items={data.items} />
        )}
      </section>
    );
  }

  if (activeTab === 'teaching') {
    const data = await listPublicTeachingForStaff(staffId, { page, pageSize: 8 });
    return (
      <section className="border border-gray-200 bg-white p-6">
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-600">No teaching records available.</p>
        ) : (
          <div className="space-y-4">
            {data.items.map((record) => (
              <article key={record.id} className="border border-gray-200 p-4">
                <h3 className="font-semibold text-brand-navy">
                  {record.courseCode ? `${record.courseCode} - ${record.title}` : record.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {[record.sessionYear, record.semester].filter(Boolean).join(' • ')}
                </p>
              </article>
            ))}
            <SectionPager
              staffSlug={staffSlug}
              tab={activeTab}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              currentPage={data.page}
            />
          </div>
        )}
      </section>
    );
  }

  if (!isInMemoriam) {
    return (
      <section className="border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">No biography available yet.</p>
      </section>
    );
  }

  const data = await getPublicTributesForStaff(staffId, { page, pageSize: 8 });

  return (
    <section className="space-y-6 border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-brand-navy">Tributes</h2>
        <Link
          href={`/people/staff/${staffSlug}/tributes/new`}
          className="border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
        >
          Add Tribute
        </Link>
      </div>

      {submitted && (
        <div className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Tribute submitted successfully. It will appear after moderation.
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-navy">Biography</h3>
        {data.biography ? (
          <div className="border border-gray-200 p-4">
            <h4 className="mb-2 font-semibold text-brand-navy">{data.biography.title}</h4>
            <Prose html={data.biography.bodyHtml} className="prose-sm" />
          </div>
        ) : (
          <p className="text-sm text-gray-600">No biography published yet.</p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-navy">Public Tributes</h3>
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-600">No tributes yet.</p>
        ) : (
          <div className="space-y-4">
            {data.items.map((testimonial) => (
              <article key={testimonial.id} className="border border-gray-200 p-4">
                <header className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{testimonial.name}</span>
                  {testimonial.relationship ? ` (${testimonial.relationship})` : ''}
                  {` • ${formatDate(testimonial.submittedAt)}`}
                </header>
                <p className="line-clamp-3 text-sm text-gray-700">
                  {stripHtml(testimonial.tributeHtml)}
                </p>
              </article>
            ))}
            <SectionPager
              staffSlug={staffSlug}
              tab={activeTab}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              currentPage={data.page}
            />
          </div>
        )}
      </div>
    </section>
  );
}
