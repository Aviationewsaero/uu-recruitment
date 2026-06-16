import Link from "next/link";
import { requireRole } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage() {
  await requireRole("SUPER_ADMIN");

  const materials = await prisma.studyMaterial.findMany({
    include: {
      _count: { select: { slides: true } },
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Study Materials</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {materials.length} module{materials.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/materials/new"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
        >
          + New Module
        </Link>
      </header>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-bg text-left text-xs uppercase tracking-widest text-brand-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Slides</th>
              <th className="px-4 py-3">Target Depts</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                  No study materials yet.{" "}
                  <Link href="/admin/materials/new" className="text-brand-blue hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id} className="hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-brand-text">
                    <Link
                      href={`/admin/materials/${material.id}`}
                      className="text-brand-blue hover:underline"
                    >
                      {material.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {material.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-brand-green/15 px-3 py-1 text-brand-green-dark">
                      {material._count.slides}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {material.audienceDepartments
                      ? material.audienceDepartments.replace(/,/g, ", ")
                      : "All"}
                  </td>
                  <td className="px-4 py-3">
                    {material.isActive ? (
                      <span className="text-green-600">✓ Active</span>
                    ) : (
                      <span className="text-gray-400">✗ Archived</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link
                      href={`/admin/materials/${material.id}`}
                      className="text-brand-blue hover:underline text-xs"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
