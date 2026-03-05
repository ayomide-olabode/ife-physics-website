'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, Trash2, FileText, ExternalLink } from 'lucide-react';
import { toastError } from '@/lib/toast';

interface ResourceFileUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export function ResourceFileUploader({ value, onChange, onRemove }: ResourceFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toastError('Invalid file type (PDF only).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('File size exceeds 5MB limit.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/content/resources/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.ok && data.url) {
        onChange(data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch {
      toastError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // reset input
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="flex items-center justify-between p-4 rounded-md border bg-muted/30">
          <div className="flex items-center gap-3 overflow-hidden text-sm">
            <div className="bg-primary/10 p-2 rounded-md">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="truncate">
              <p className="font-medium truncate" title={value}>
                {value.split('/').pop()}
              </p>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-0.5"
              >
                View File <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isUploading}
            className="text-destructive shrink-0 hover:text-destructive hover:bg-destructive/10"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full rounded-md border-2 border-dashed bg-muted/50 hover:bg-muted/80 transition-colors p-6">
          <label className="flex flex-col items-center justify-center w-full cursor-pointer">
            <div className="flex flex-col items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-2" />
              ) : (
                <FileUp className="w-6 h-6 text-muted-foreground mb-2" />
              )}
              <p className="space-y-1 text-center">
                <span className="text-sm font-semibold block">Click to upload document</span>
                <span className="text-xs text-muted-foreground block">
                  PDF files only (max 5MB)
                </span>
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
