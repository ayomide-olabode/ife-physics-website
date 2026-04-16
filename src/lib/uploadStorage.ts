import 'server-only';

import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const DEFAULT_UPLOADS_DIR = 'public/uploads';

const EXT_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function cleanRoot(input: string): string {
  const value = input.trim();
  return value.length > 0 ? value : DEFAULT_UPLOADS_DIR;
}

export function getUploadsRootDir(): string {
  const configured = cleanRoot(process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR);
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function assertSafeSegment(segment: string): void {
  if (!segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\')) {
    throw new Error('Invalid upload path segment.');
  }
}

export function sanitizeUploadSegments(segments: string[]): string[] {
  return segments.map((segment) => {
    assertSafeSegment(segment);
    return segment;
  });
}

export function buildUploadUrl(...segments: string[]): string {
  const clean = segments.map((segment) => {
    assertSafeSegment(segment);
    return encodeURIComponent(segment);
  });
  return `/uploads/${clean.join('/')}`;
}

export function resolveUploadDiskPath(...segments: string[]): string {
  const clean = sanitizeUploadSegments(segments);
  return path.join(getUploadsRootDir(), ...clean);
}

export async function saveUpload(params: {
  folder: string;
  filename: string;
  buffer: Buffer;
}): Promise<{ url: string; diskPath: string }> {
  const diskPath = resolveUploadDiskPath(params.folder, params.filename);
  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, params.buffer);

  return {
    url: buildUploadUrl(params.folder, params.filename),
    diskPath,
  };
}

export function mimeTypeForUploadPath(filePath: string): string {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return EXT_MIME_MAP[ext] || 'application/octet-stream';
}

export function legacyPublicUploadsRootDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}
