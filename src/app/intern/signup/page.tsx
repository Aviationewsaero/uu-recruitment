import { InternSignupFlow } from "./InternSignupFlow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata = {
  title: "Intern Signup - UU Aviation Portal",
};

export default function InternSignupPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-3xl px-6">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-brand-muted">
            Uttaranchal University Aviation Internship
          </p>
          <h1 className="mt-1 text-3xl font-bold text-brand-text">
            Internship Portal Signup
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Complete your profile to join the UU Aviation internship program.
            Takes ~5 minutes.
          </p>
        </header>
        <InternSignupFlow />
      </div>
    </main>
  );
}
