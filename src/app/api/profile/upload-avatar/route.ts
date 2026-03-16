import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 2MB.' },
        { status: 400 },
      );
    }

    // Determine extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Sanitize filename: use staffId + timestamp
    const filename = `${staffId}-${Date.now()}.${ext}`;

    // Save to public/uploads/avatars
    const uploadsDir = path.join(process.cwd(), 'public/uploads/avatars');

    // Ensure directory exists just in case
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    // Update database
    const publicUrl = `/uploads/avatars/${filename}`;

    await prisma.staff.update({
      where: { id: staffId },
      data: { profileImageUrl: publicUrl },
    });

    revalidatePath('/dashboard/profile/overview');
    revalidatePath('/dashboard/admin/staff');

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload.' },
      { status: 500 },
    );
  }
}
