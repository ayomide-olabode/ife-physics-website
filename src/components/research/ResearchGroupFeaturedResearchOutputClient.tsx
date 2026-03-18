'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';
import { setFeaturedResearchOutput } from '@/server/actions/researchFeaturedResearchOutput';
import { GroupEligibleResearchOutput } from '@/server/queries/researchGroupPublicationsFromMembers';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Props {
  groupId: string;
  initialFeaturedOutputId: string | null;
  eligibleResearchOutputs: GroupEligibleResearchOutput[];
}

export function ResearchGroupFeaturedResearchOutputClient({
  groupId,
  initialFeaturedOutputId,
  eligibleResearchOutputs,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(initialFeaturedOutputId || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const researchOutputId = selectedId === 'none' ? null : selectedId;
      const res = await setFeaturedResearchOutput({ groupId, researchOutputId });
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Featured research output updated.');
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setSelectedId('none');
  };

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4 max-w-2xl mt-8">
      <div>
        <h3 className="text-lg font-semibold">Research Outputs (Group Members)</h3>
        <p className="text-sm text-muted-foreground">
          Select one research output to feature for this research group. This will be highlighted on
          the group overview page.
        </p>
      </div>

      {eligibleResearchOutputs.length === 0 ? (
        <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
          <p>No research outputs found for group members.</p>
          <p className="mt-1">
            Once members add research outputs with linked staff authors, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[400px] overflow-y-auto pr-2 pb-2">
            <RadioGroup value={selectedId} onValueChange={setSelectedId} className="space-y-3">
              <div className="flex items-start space-x-3 mb-4 hidden">
                <RadioGroupItem value="none" id="pub-none" />
                <Label htmlFor="pub-none" className="text-sm font-medium">
                  None
                </Label>
              </div>
              {eligibleResearchOutputs.map((pub) => (
                <div key={pub.id} className="flex items-start space-x-3 border-b pb-3 items-center">
                  <RadioGroupItem value={pub.id} id={`pub-${pub.id}`} className="mt-1" />
                  <Label
                    htmlFor={`pub-${pub.id}`}
                    className="flex flex-col gap-1 cursor-pointer w-full"
                  >
                    <span className="font-semibold text-sm leading-tight">{pub.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {pub.year || 'N/A'} • {pub.type.replace(/_/g, ' ')} •{' '}
                      {pub.sourceTitle || 'Unknown source'}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSubmitting || selectedId === (initialFeaturedOutputId || 'none')}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Selection
            </Button>
            {selectedId !== 'none' && (
              <Button type="button" variant="outline" onClick={handleClear} disabled={isSubmitting}>
                Clear featured
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
