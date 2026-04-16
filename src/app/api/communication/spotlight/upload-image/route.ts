import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { saveUpload } from '@/lib/uploadStorage';
import { ScopedRole } from '.prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, ScopedRole.EDITOR);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: 2 * 1024 * 1024 });
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const ext = validated.format.ext;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const { url: fileUrl } = await saveUpload({
      folder: 'spotlight',
      filename,
      buffer: validated.buffer,
    });

    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: unknown) {
    console.error('Spotlight image upload error:', err);
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return NextResponse.json(
        {
          error:
            'Upload storage is not writable on this server. Set UPLOADS_DIR to a writable persistent directory.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
