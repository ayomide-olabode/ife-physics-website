import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/guards';
import { isResearchLeadForGroup, isSuperAdmin } from '@/lib/rbac';
import { validateImageUpload } from '@/lib/security/imageUpload';
import { saveUpload } from '@/lib/uploadStorage';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const groupIdRaw = formData.get('groupId');
    const groupId = typeof groupIdRaw === 'string' && groupIdRaw.trim() ? groupIdRaw.trim() : null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const validated = await validateImageUpload(file, { maxSizeBytes: MAX_SIZE });
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    }

    const canBypass = isSuperAdmin(session);
    if (!canBypass) {
      if (!groupId) {
        return NextResponse.json(
          { ok: false, error: 'Only Super Admin can upload before group creation.' },
          { status: 403 },
        );
      }

      const isLead = await isResearchLeadForGroup(session, groupId);
      if (!isLead) {
        return NextResponse.json(
          { ok: false, error: 'Not authorized to upload for this research group.' },
          { status: 403 },
        );
      }
    }

    const safeGroupId = (groupId || 'new').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeGroupId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${validated.format.ext}`;
    const { url } = await saveUpload({
      folder: 'research-groups',
      filename,
      buffer: validated.buffer,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('Research group hero upload error:', error);
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
