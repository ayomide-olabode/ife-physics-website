'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StudyOptionLinkModal } from '@/components/academics/StudyOptionLinkModal';
import { PGStudyOptionFormClient } from '@/components/academics/PGStudyOptionFormClient';
import { PGCourseMapper } from '@/components/academics/PGCourseMapper';
import { ProgramStudyOptionUnlinkButton } from '@/components/academics/ProgramStudyOptionUnlinkButton';

interface MappedCourse {
  id: string;
  code: string;
  title: string;
}

interface SelectedOptionData {
  programStudyOptionId: string;
  id: string;
  name: string;
  about: string;
  mappedCourses: MappedCourse[];
}

interface ListData {
  items: { id: string; name: string; createdAt: Date }[];
  total: number;
  page: number;
  pageSize: number;
}

interface Props {
  programmeCode: ProgrammeCode;
  listData: ListData;
  selectedOptionData?: SelectedOptionData | null;
  q: string;
}

export function PGStudyOptionsPanel({ programmeCode, listData, selectedOptionData, q }: Props) {
  const router = useRouter();
  const code = programmeCode.toLowerCase();
  const totalPages = Math.ceil(listData.total / listData.pageSize);

  if (selectedOptionData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Edit Study Option</h2>
            <p className="text-sm text-muted-foreground">{selectedOptionData.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/postgraduate/${code}/overview`)}
            >
              &larr; Back to List
            </Button>
            <ProgramStudyOptionUnlinkButton
              programmeCode={programmeCode}
              level="POSTGRADUATE"
              programStudyOptionId={selectedOptionData.programStudyOptionId}
            />
          </div>
        </div>

        <PGStudyOptionFormClient
          programmeCode={programmeCode}
          initialData={{
            id: selectedOptionData.id,
            name: selectedOptionData.name,
            about: selectedOptionData.about,
          }}
        />

        <div className="border-t pt-6">
          <PGCourseMapper
            programmeCode={programmeCode}
            studyOptionId={selectedOptionData.id}
            mappedCourses={selectedOptionData.mappedCourses}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Postgraduate Study Options</h2>
          <p className="text-sm text-muted-foreground">
            Manage study options specifically mapped to this programme.
          </p>
        </div>
        <StudyOptionLinkModal programmeCode={programmeCode} level="POSTGRADUATE" />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  No study options found.
                </TableCell>
              </TableRow>
            ) : (
              listData.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/dashboard/postgraduate/${code}/overview?studyOptionId=${item.id}&page=${listData.page}&q=${encodeURIComponent(q)}`}
                      >
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={listData.page <= 1}
            asChild={listData.page > 1}
          >
            {listData.page > 1 ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${listData.page - 1}`}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {listData.page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={listData.page >= totalPages}
            asChild={listData.page < totalPages}
          >
            {listData.page < totalPages ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${listData.page + 1}`}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
