import { RegistrationFlow } from "./RegistrationFlow";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-2xl px-6">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-brand-muted">
            UU Aviation Recruitment 2026
          </p>
          <h1 className="mt-1 text-3xl font-bold text-brand-text">
            Student Registration
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            One-time registration. Takes ~3 minutes. You&apos;ll receive a token
            number and digital admit card by email.
          </p>
        </header>
        <RegistrationFlow />
      </div>
    </main>
  );
}
