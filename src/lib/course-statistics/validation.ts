import { z } from 'zod';

const nonNegativeStudentCountSchema = z.number().int().min(0).max(100000);

export const courseStatisticsSubmissionRowSchema = z
  .object({
    courseCode: z.string().trim().min(3).max(20),
    courseTitle: z.string().trim().min(1).max(200),
    numberOfPhysicsStudents: nonNegativeStudentCountSchema,
    numberOfFacultyStudents: nonNegativeStudentCountSchema,
    numberOfOtherStudents: nonNegativeStudentCountSchema,
    totalNumberOfStudents: nonNegativeStudentCountSchema,
  })
  .refine(
    (value) =>
      value.totalNumberOfStudents ===
      value.numberOfPhysicsStudents + value.numberOfFacultyStudents + value.numberOfOtherStudents,
    {
      message: 'Total students must equal Physics + Faculty + Other.',
      path: ['totalNumberOfStudents'],
    },
  );

export const courseStatisticsSubmissionPayloadSchema = z.object({
  coordinatorName: z.string().trim().min(1).max(120),
  rows: z.array(courseStatisticsSubmissionRowSchema).min(1).max(40),
});

export type CourseStatisticsSubmissionInput = z.infer<
  typeof courseStatisticsSubmissionPayloadSchema
>;
