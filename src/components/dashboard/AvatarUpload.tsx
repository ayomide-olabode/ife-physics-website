'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toastSuccess, toastError } from '@/lib/toast';
import { Camera, Loader2 } from 'lucide-react';

export function AvatarUpload({
  currentImageUrl,
  fallbackText,
}: {
  currentImageUrl?: string | null;
  fallbackText: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional frontend validation
    if (file.size > 2 * 1024 * 1024) {
      toastError('File is too large. Maximum size is 2MB.');
      // Reset input
      e.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toastSuccess('Profile picture updated!');
      router.refresh();
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'An unexpected error occurred during upload.',
      );
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentImageUrl || undefined} />
        <AvatarFallback className="text-xl bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500">
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">JPEG, PNG, or WebP. Max 2MB.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Upload Photo
          </Button>

          {currentImageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={true}
              title="Deleting photo is not supported in this version"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
