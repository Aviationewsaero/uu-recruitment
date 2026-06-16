import Link from "next/link";
import { requireActiveIntern } from "@/lib/auth-intern";
import { prisma } from "@/lib/prisma";
import { NotepadEditor } from "./NotepadEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notepad - Intern Portal",
};

export default async function NotepadPage() {
  const { intern } = await requireActiveIntern();

  // Fetch or create notepad
  let notepad = await prisma.internNotepad.findUnique({
    where: { internId: intern.id },
  });

  if (!notepad) {
    notepad = await prisma.internNotepad.create({
      data: {
        internId: intern.id,
        content: "",
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-surface px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <Link href="/intern/dashboard" className="text-sm text-brand-blue hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-brand-text">Your Notepad</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Take notes during your internship. Auto-saves every 30 seconds.
            </p>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <NotepadEditor initialContent={notepad.content} internId={intern.id} />
        </div>
      </main>
    </div>
  );
}
