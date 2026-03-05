'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getResourceById } from '@/server/queries/resources';
import { Loader2, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PublishStatus } from '@prisma/client';

export function ResourcePreviewModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [data, setData] = useState<{
    title: string;
    description: string | null;
    linkUrl: string | null;
    fileUrl: string | null;
    category: string | null;
    status: PublishStatus;
    createdAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      try {
        const item = await getResourceById(itemId);
        if (item) {
          setData(item);
        }
      } catch (err) {
        console.error('Failed to fetch resource details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [itemId]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Resource</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-muted-foreground">Resource not found.</div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{data.title}</h3>
                {data.category && (
                  <span className="inline-block px-2 py-0.5 mt-1 rounded text-xs font-medium bg-muted text-muted-foreground border">
                    {data.category}
                  </span>
                )}
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="bg-muted/50 p-4 rounded-md border">
              <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {data.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-foreground">Attached Assets</h4>

              {data.linkUrl && (
                <a
                  href={data.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 text-sm text-primary hover:bg-primary/5 rounded-md border bg-card transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium truncate">{data.linkUrl}</span>
                </a>
              )}

              {data.fileUrl && (
                <a
                  href={data.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 text-sm text-primary hover:bg-primary/5 rounded-md border bg-card transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium truncate">View Uploaded PDF Document</span>
                </a>
              )}
            </div>

            <div className="text-xs text-muted-foreground flex justify-between pt-4 border-t">
              <span>Added: {new Date(data.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
