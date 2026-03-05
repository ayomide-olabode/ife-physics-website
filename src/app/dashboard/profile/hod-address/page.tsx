import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function Page() {
  const session = await requireAuth();
  const staffId = session.user?.staffId;

  if (!staffId) {
    notFound();
  }

  const isHod = await prisma.leadershipTerm.findFirst({
    where: {
      staffId,
      role: 'HOD',
      endDate: null,
    },
  });

  if (!isHod) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">HOD Address</h1>
      <p className="text-muted-foreground">
        Manage the HOD welcome address displayed on the homepage.
      </p>
    </main>
  );
}
