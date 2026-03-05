import prisma from '@/lib/prisma';

export async function getProfileCompleteness(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      firstName: true,
      lastName: true,
      institutionalEmail: true,
      profileImageUrl: true,
    },
  });

  if (!staff) {
    return {
      isComplete: false,
      missingRequired: ['firstName', 'lastName'],
      missingRecommended: ['profileImageUrl'],
      displayName: 'Unknown User',
    };
  }

  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  if (!staff.firstName) missingRequired.push('First Name');
  if (!staff.lastName) missingRequired.push('Last Name');

  if (!staff.profileImageUrl) missingRecommended.push('Profile Photo');

  const isComplete = missingRequired.length === 0;

  // Fallback to email if first/last name not present
  const displayName =
    staff.firstName || staff.lastName
      ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim()
      : staff.institutionalEmail || 'Unknown User';

  return {
    isComplete,
    missingRequired,
    missingRecommended,
    displayName,
  };
}
