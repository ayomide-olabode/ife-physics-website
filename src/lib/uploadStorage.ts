import 'server-only';

import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const DEFAULT_UPLOADS_DIR = 'public/uploads';
const FALLBACK_UPLOADS_DIR = '/tmp/uploads';

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

function toAbsolute(root: string): string {
  return path.isAbsolute(root) ? root : path.join(process.cwd(), root);
}

function resolveConfiguredUploadsRootSetting(): string {
  if (process.env.UPLOADS_DIR?.trim()) {
    return cleanRoot(process.env.UPLOADS_DIR);
  }

  // In many serverless runtimes only /tmp is writable.
  if (process.env.NODE_ENV === 'production') {
    return FALLBACK_UPLOADS_DIR;
  }

  return DEFAULT_UPLOADS_DIR;
}

export function getUploadsRootDir(): string {
  return toAbsolute(resolveConfiguredUploadsRootSetting());
}

function getFallbackUploadsRootDir(): string {
  return toAbsolute(FALLBACK_UPLOADS_DIR);
}

function isRecoverableWriteError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  return code === 'EROFS' || code === 'EACCES' || code === 'EPERM' || code === 'ENOENT';
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

export function getUploadReadRootDirs(): string[] {
  return Array.from(
    new Set([getUploadsRootDir(), legacyPublicUploadsRootDir(), getFallbackUploadsRootDir()]),
  );
}

export async function saveUpload(params: {
  folder: string;
  filename: string;
  buffer: Buffer;
}): Promise<{ url: string; diskPath: string }> {
  const cleanSegments = sanitizeUploadSegments([params.folder, params.filename]);
  const roots = Array.from(new Set([getUploadsRootDir(), getFallbackUploadsRootDir()]));
  let lastError: unknown;

  for (const root of roots) {
    const diskPath = path.join(root, ...cleanSegments);
    try {
      await mkdir(path.dirname(diskPath), { recursive: true });
      await writeFile(diskPath, params.buffer);

      return {
        url: buildUploadUrl(params.folder, params.filename),
        diskPath,
      };
    } catch (error) {
      lastError = error;
      if (!isRecoverableWriteError(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Failed to save upload.');
}

export function mimeTypeForUploadPath(filePath: string): string {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return EXT_MIME_MAP[ext] || 'application/octet-stream';
}

export function legacyPublicUploadsRootDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}
