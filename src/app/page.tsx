'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col justify-center items-center space-y-4">
      <h1 className="text-4xl font-bold text-blue-600">Tailwind CSS & shadcn/ui are Working!</h1>
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
        This is a minimal verification page.
      </p>
      <Link href="/login">Login</Link>

      <Link href="/register">Register</Link>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Open Smoke Test Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>The shadcn/ui Dialog component renders correctly.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
