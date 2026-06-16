import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const metadata = {
  title: "Signup Successful - Elite World Services",
};

export default function SignupSuccessPage({
  params,
}: {
  params: { internId: string };
}) {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-2xl px-6">
        <div className="rounded-xl border border-brand-success/30 bg-brand-success/10 p-8 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-success text-2xl">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-brand-text">
            Signup Successful!
          </h1>
          <p className="mt-4 text-brand-muted">
            Welcome to the Elite World Services Internship Portal
          </p>

          <div className="my-8 rounded-lg bg-brand-surface p-6">
            <p className="text-xs uppercase tracking-widest text-brand-muted">
              Your Intern ID
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-brand-text">
              {params.internId}
            </p>
            <p className="mt-4 text-sm text-brand-muted">
              Save this ID for future reference
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-brand-surface p-6 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-brand-success">✓</span>
              <div>
                <p className="font-semibold text-brand-text">
                  Email Verified
                </p>
                <p className="text-sm text-brand-muted">
                  Your email address has been verified
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-brand-warning">⏳</span>
              <div>
                <p className="font-semibold text-brand-text">
                  Awaiting Admin Approval
                </p>
                <p className="text-sm text-brand-muted">
                  An admin will review and activate your account soon. You'll
                  receive an email confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-brand-info">ℹ</span>
              <div>
                <p className="font-semibold text-brand-text">
                  What's Next?
                </p>
                <p className="text-sm text-brand-muted">
                  Once approved, you can log in and access study materials,
                  track your progress, and stay connected with your mentor.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/intern/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
