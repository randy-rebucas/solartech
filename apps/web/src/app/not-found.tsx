'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg bg-gradient-solar text-white font-medium hover:opacity-90"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
