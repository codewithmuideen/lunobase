"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <LogoMark className="mx-auto size-12" />
        <h1 className="mt-6 font-display text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-slate">We&apos;ve been notified. Please try again.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">Ref: {error.digest}</p>}
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
