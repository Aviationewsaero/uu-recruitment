import Link from "next/link";
import { requireRole } from "@/lib/auth-user";
import { MaterialForm } from "../MaterialForm";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage() {
  await requireRole("SUPER_ADMIN");

  return (
    <div className="p-8">
      <header className="mb-6">
        <Link href="/admin/materials" className="text-sm text-brand-blue hover:underline">
          ← Back to Materials
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-brand-text">Create Study Module</h1>
      </header>

      <MaterialForm />
    </div>
  );
}
