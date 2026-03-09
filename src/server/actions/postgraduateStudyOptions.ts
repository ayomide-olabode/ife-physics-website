'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ProgrammeCode } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const studyOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  about: z.string().max(4000).optional(),
});

type StudyOptionInput = z.infer<typeof studyOptionSchema>;

export async function updatePostgraduateStudyOption(
  programmeCode: ProgrammeCode,
  id: string,
  data: StudyOptionInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = studyOptionSchema.parse(data);

    const existing = await prisma.studyOption.findFirst({
      where: {
        id,
        deletedAt: null,
        programs: { some: { programmeCode, level: 'POSTGRADUATE' } },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Study option not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : '');

    await prisma.studyOption.update({
      where: { id },
      data: {
        name: validated.name,
        about: normalize(validated.about),
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'PG_STUDY_OPTION_UPDATED',
      entityType: 'StudyOption',
      entityId: id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/study-options`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update study option' };
  }
}
