'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ProgrammeCode, Prisma } from '@prisma/client';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { logAudit } from '@/lib/audit';

const courseSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(12, 'Code must be at most 12 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Code must contain only letters and numbers')
    .transform((v) => v.toUpperCase()),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000).optional(),
  prerequisites: z.string().max(500).optional(),
  L: z.coerce.number().int().min(0).max(10),
  T: z.coerce.number().int().min(0).max(10),
  P: z.coerce.number().int().min(0).max(10),
  U: z.coerce.number().int().min(0).max(10),
  status: z.enum(['CORE', 'RESTRICTED']),
});

type CourseInput = z.infer<typeof courseSchema>;

export async function createCourseForProgramme(programmeCode: ProgrammeCode, data: CourseInput) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = courseSchema.parse(data);

    // Resolve the programme
    const program = await prisma.academicProgram.findUnique({
      where: {
        programmeCode_level: {
          programmeCode,
          level: 'UNDERGRADUATE',
        },
      },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: 'Programme not found' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    // Upsert: if the code already exists in the same programme scope, update instead
    const existing = await prisma.course.findUnique({
      where: { code: validated.code },
      select: { id: true, programId: true },
    });

    let course;
    if (existing) {
      // Conflict: course exists but belongs to a different programme
      if (existing.programId !== program.id) {
        return {
          success: false,
          error: `Course ${validated.code} already exists under a different programme.`,
        };
      }

      // Same programme scope → update
      course = await prisma.course.update({
        where: { id: existing.id },
        data: {
          title: validated.title,
          description: normalize(validated.description),
          prerequisites: normalize(validated.prerequisites),
          L: validated.L,
          T: validated.T,
          P: validated.P,
          U: validated.U,
          status: validated.status,
        },
      });
    } else {
      course = await prisma.course.create({
        data: {
          code: validated.code,
          title: validated.title,
          description: normalize(validated.description),
          prerequisites: normalize(validated.prerequisites),
          L: validated.L,
          T: validated.T,
          P: validated.P,
          U: validated.U,
          status: validated.status,
          programId: program.id,
        },
      });
    }

    await logAudit({
      actorId: session.user?.userId || '',
      action: existing ? 'COURSE_UPDATED' : 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course.id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`);
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('courses');

    return { success: true, courseId: course.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create course' };
  }
}

export async function updateCourseForProgramme(
  programmeCode: ProgrammeCode,
  id: string,
  data: CourseInput,
) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, 'ACADEMIC_COORDINATOR');

    const validated = courseSchema.parse(data);

    // Ensure the course belongs to this programme
    const existing = await prisma.course.findFirst({
      where: {
        id,
        program: {
          programmeCode,
          level: 'UNDERGRADUATE',
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: 'Course not found in this programme' };
    }

    const normalize = (val?: string) => (val && val.trim() !== '' ? val : null);

    const course = await prisma.course.update({
      where: { id },
      data: {
        code: validated.code,
        title: validated.title,
        description: normalize(validated.description),
        prerequisites: normalize(validated.prerequisites),
        L: validated.L,
        T: validated.T,
        P: validated.P,
        U: validated.U,
        status: validated.status,
      },
    });

    await logAudit({
      actorId: session.user?.userId || '',
      action: 'COURSE_UPDATED',
      entityType: 'Course',
      entityId: course.id,
      snapshot: { programmeCode, ...validated },
    });

    revalidatePath(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/courses`);
    // @ts-expect-error Next Canary Type definition bug
    revalidateTag('courses');

    return { success: true, courseId: course.id };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A course with this code already exists.' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update course' };
  }
}

export async function lookupCourseByCode({
  programmeCode,
  codePrefix,
}: {
  programmeCode: ProgrammeCode;
  codePrefix: string;
}) {
  return prisma.course.findMany({
    where: {
      code: { startsWith: codePrefix, mode: 'insensitive' },
      program: {
        programmeCode,
        level: 'UNDERGRADUATE',
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
    take: 10,
    orderBy: { code: 'asc' },
  });
}

export async function getCourseByExactCode({ code }: { code: string }) {
  return prisma.course.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      prerequisites: true,
      L: true,
      T: true,
      P: true,
      U: true,
      status: true,
      programId: true,
    },
  });
}
