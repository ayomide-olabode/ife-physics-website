import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  legacyPublicUploadsRootDir,
  mimeTypeForUploadPath,
  resolveUploadDiskPath,
  sanitizeUploadSegments,
} from '@/lib/uploadStorage';

export const runtime = 'nodejs';

async function readFromCandidates(segments: string[]) {
  const safeSegments = sanitizeUploadSegments(segments);
  const primaryPath = resolveUploadDiskPath(...safeSegments);
  const legacyPath = path.join(legacyPublicUploadsRootDir(), ...safeSegments);
  const candidates = [primaryPath];

  if (legacyPath !== primaryPath) {
    candidates.push(legacyPath);
  }

  for (const candidate of candidates) {
    try {
      const buffer = await readFile(candidate);
      return { buffer, filePath: candidate };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') continue;
      throw error;
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  try {
    const { segments } = await params;

    if (!Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const file = await readFromCandidates(segments);
    if (!file) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeTypeForUploadPath(file.filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Uploads file serve error:', error);
    return NextResponse.json({ error: 'Failed to load upload.' }, { status: 500 });
  }
}
