import { NextRequest, NextResponse } from 'next/server';
import { listPublicRecentOutputsForGroup } from '@/server/public/queries/researchPublic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') ?? undefined;
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);

  const data = await listPublicRecentOutputsForGroup(groupId, {
    page: Number.isNaN(page) ? 1 : page,
    pageSize: 10,
    q,
  });

  return NextResponse.json(data);
}
