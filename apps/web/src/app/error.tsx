'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Something went wrong!</h1>
        <p className="text-muted-foreground mb-6">{error.message || 'An unexpected error occurred. Please try again.'}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-lg bg-gradient-solar text-white font-medium hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
