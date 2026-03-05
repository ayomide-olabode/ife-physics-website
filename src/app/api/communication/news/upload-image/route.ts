import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '.prisma/client';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const session = await requireAuth();
  await requireGlobalRole(session, ScopedRole.EDITOR);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'File too large. Maximum size is 2MB.' },
        { status: 400 },
      );
    }

    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'news');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/news/${filename}`;
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
