import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { saveUpload } from '@/lib/uploadStorage';
import { ScopedRole } from '.prisma/client';
import { NextResponse } from 'next/server';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: MAX_SIZE });
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const ext = validated.format.ext;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { url } = await saveUpload({
      folder: 'news',
      filename,
      buffer: validated.buffer,
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('Upload failed:', error);
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Upload storage is not writable on this server. Set UPLOADS_DIR to a writable persistent directory.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
