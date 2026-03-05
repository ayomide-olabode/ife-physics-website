import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireGlobalRole } from '@/lib/guards';
import { ScopedRole } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await requireGlobalRole(session, ScopedRole.EDITOR);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF documents are allowed.' },
        { status: 400 },
      );
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public/uploads/resources');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.pdf`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/resources/${filename}`;

    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: unknown) {
    console.error('Resource file upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
