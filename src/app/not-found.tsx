import { LogoMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div aria-hidden className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
      <div aria-hidden className="bg-radial-brand absolute inset-0" />
      <div className="relative text-center">
        <LogoMark className="mx-auto size-14" />
        <p className="mt-8 font-display text-8xl font-extrabold tracking-tight text-white/10">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">This page drifted off-chain</h1>
        <p className="mt-3 text-slate">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back home</ButtonLink>
          <ButtonLink href="/markets" variant="secondary">
            View markets
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
