import { InternLoginForm } from "./InternLoginForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const reason = sp.reason ? (sp.reason as string) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-navy to-brand-navy/80 px-6 py-10">
      <InternLoginForm reason={reason} />
    </main>
  );
}
