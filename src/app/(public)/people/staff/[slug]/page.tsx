import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Prose } from '@/components/public/Prose';
import { getPublicStaffBySlug } from '@/server/public/queries/peoplePublic';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';

type TabKey = 'tributes' | 'bio' | 'research' | 'projects' | 'teaching' | 'theses';

function parseTab(value?: string): TabKey | undefined {
  if (!value) return undefined;
  if (value === 'tributes') return 'tributes';
  if (value === 'bio') return 'bio';
  if (value === 'research') return 'research';
  if (value === 'projects') return 'projects';
  if (value === 'teaching') return 'teaching';
  if (value === 'theses') return 'theses';
  return undefined;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; submitted?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const staff = await getPublicStaffBySlug(slug);

  if (!staff) {
    notFound();
  }

  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  const name =
    formatFullName({
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
    }) || staff.institutionalEmail;
  const displayName = [staff.academicRank, name].filter(Boolean).join(' ').trim();

  const baseTabs: Array<{ key: Exclude<TabKey, 'tributes'>; label: string }> = [
    { key: 'bio', label: 'Bio' },
    { key: 'research', label: 'Research' },
    { key: 'projects', label: 'Projects' },
    { key: 'teaching', label: 'Teaching' },
    { key: 'theses', label: 'Theses' },
  ];

  const tabs: Array<{ key: TabKey; label: string }> = isInMemoriam
    ? [{ key: 'tributes', label: 'Tributes' }, ...baseTabs]
    : baseTabs;

  const requestedTab = parseTab(query.tab);
  const tabKeys = new Set<TabKey>(tabs.map((tab) => tab.key));
  const defaultTab: TabKey = requestedTab && tabKeys.has(requestedTab) ? requestedTab : tabs[0].key;
  const submitted = query.submitted === '1';

  return (
    <main className="container mx-auto space-y-8 px-4 py-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-muted-foreground">
          {staff.designation || staff.staffType.replace(/_/g, ' ')}
          {staff.researchArea ? ` • ${staff.researchArea}` : ''}
        </p>
        {isInMemoriam && (
          <p className="text-sm text-muted-foreground">
            In Memoriam
            {staff.dateOfBirth ? ` • Born: ${formatDate(staff.dateOfBirth)}` : ''}
            {staff.dateOfDeath ? ` • Died: ${formatDate(staff.dateOfDeath)}` : ''}
          </p>
        )}
      </section>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-md border data-[state=active]:border-primary"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isInMemoriam && (
          <TabsContent value="tributes" className="space-y-8 pt-4">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Departmental Tribute</h2>
              {staff.tribute ? (
                <div className="space-y-3 rounded-md border bg-card p-5">
                  <h3 className="text-lg font-semibold">{staff.tribute.title}</h3>
                  <Prose html={staff.tribute.bodyHtml} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  A departmental tribute has not been published yet.
                </p>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Testimonials</h2>
                <Link href={`/people/staff/${slug}/tributes/new`}>
                  <Button variant="outline" size="sm">
                    Add tribute
                  </Button>
                </Link>
              </div>

              {submitted && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Tribute submitted successfully. It will appear after moderation.
                </div>
              )}

              {staff.testimonials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No testimonials available yet.</p>
              ) : (
                <div className="space-y-4">
                  {staff.testimonials.map((testimonial) => (
                    <article key={testimonial.id} className="rounded-md border bg-card p-5">
                      <header className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">{testimonial.name}</span>
                        <span className="text-muted-foreground">({testimonial.relationship})</span>
                        <span className="text-muted-foreground">•</span>
                        <time className="text-muted-foreground">
                          {formatDate(testimonial.submittedAt)}
                        </time>
                      </header>
                      <Prose html={testimonial.tributeHtml} className="prose-sm" />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        )}

        <TabsContent value="bio" className="space-y-4 pt-4">
          {staff.bio ? (
            <Prose html={staff.bio} />
          ) : (
            <p className="text-sm text-muted-foreground">No biography available.</p>
          )}
        </TabsContent>

        <TabsContent value="research" className="space-y-4 pt-4">
          {staff.researchOutputs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No research outputs available.</p>
          ) : (
            <div className="space-y-3">
              {staff.researchOutputs.map((output) => (
                <article key={output.id} className="rounded-md border bg-card p-4">
                  <h3 className="font-semibold">{output.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {output.type.replace(/_/g, ' ')}
                    {output.year ? ` • ${output.year}` : ''}
                    {output.venue ? ` • ${output.venue}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 pt-4">
          {staff.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects available.</p>
          ) : (
            <div className="space-y-3">
              {staff.projects.map((project) => (
                <article key={project.id} className="rounded-md border bg-card p-4">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.status}
                    {project.startYear ? ` • ${project.startYear}` : ''}
                    {project.endYear ? ` - ${project.endYear}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teaching" className="space-y-4 pt-4">
          {staff.teaching.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teaching records available.</p>
          ) : (
            <div className="space-y-3">
              {staff.teaching.map((record) => (
                <article key={record.id} className="rounded-md border bg-card p-4">
                  <h3 className="font-semibold">
                    {record.courseCode} - {record.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {record.sessionYear}
                    {record.semester ? ` • ${record.semester}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="theses" className="space-y-4 pt-4">
          {staff.thesesSupervised.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No thesis supervision records available.
            </p>
          ) : (
            <div className="space-y-3">
              {staff.thesesSupervised.map((thesis) => (
                <article key={thesis.id} className="rounded-md border bg-card p-4">
                  <h3 className="font-semibold">{thesis.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {thesis.studentName || 'Unknown student'}
                    {thesis.programme ? ` • ${thesis.programme}` : ''}
                    {thesis.year ? ` • ${thesis.year}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
