import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { revalidatePath } from 'next/cache';
import { saveUpload } from '@/lib/uploadStorage';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const staffId = session.user?.staffId;

    if (!staffId) {
      return NextResponse.json(
        { error: 'No staff record found for this session.' },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: MAX_SIZE });
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const ext = validated.format.ext;

    // Sanitize filename: use staffId + timestamp
    const filename = `${staffId}-${Date.now()}.${ext}`;

    const { url: publicUrl } = await saveUpload({
      folder: 'avatars',
      filename,
      buffer: validated.buffer,
    });

    await prisma.staff.update({
      where: { id: staffId },
      data: { profileImageUrl: publicUrl },
    });

    revalidatePath('/dashboard/profile/overview');
    revalidatePath('/dashboard/admin/staff');

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return NextResponse.json(
        {
          error:
            'Upload storage is not writable on this server. Set UPLOADS_DIR to a writable persistent directory.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload.' },
      { status: 500 },
    );
  }
}
