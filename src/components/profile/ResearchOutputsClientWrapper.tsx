'use client';

import { useState } from 'react';
import { ResearchOutputEditor } from './ResearchOutputEditor';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyResearchOutput } from '@/server/actions/profileResearchOutputs';
import { toastSuccess, toastError } from '@/lib/toast';
import { ResearchOutputType } from '@prisma/client';

type OutputFormData = {
  type?: ResearchOutputType;
  title: string;
  year: string;
  venue: string;
  url: string;
  doi: string;
};

type OutputEditorProps = {
  id: string;
} & Partial<OutputFormData>;

export function ResearchOutputsClientWrapper({
  children,
}: {
  children: (props: {
    onAdd: () => void;
    onEdit: (id: string, data: OutputFormData) => void;
    onDelete: (id: string) => void;
  }) => React.ReactNode;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<OutputEditorProps | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = () => {
    setEditorData(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (id: string, data: OutputFormData) => {
    setEditorData({ id, ...data });
    setEditorOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await deleteMyResearchOutput(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Output deleted successfully.');
      }
    } catch (e) {
      toastError('An unexpected error occurrred.');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      {children({ onAdd: handleAdd, onEdit: handleEdit, onDelete: handleDeleteRequest })}

      <ResearchOutputEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={editorData}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Research Output?"
        description="Are you sure you want to remove this publication from your profile? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
