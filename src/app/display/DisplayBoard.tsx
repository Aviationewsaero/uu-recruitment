"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Room = {
  id: string;
  roomNumber: string;
  displayName: string;
  currentToken: {
    tokenNumber: number;
    studentName: string;
    status: string;
  } | null;
};

export function DisplayBoard({
  rooms,
  upcoming,
  waitingCount,
}: {
  rooms: Room[];
  upcoming: number[];
  waitingCount: number;
}) {
  const router = useRouter();

  // Poll for updates every 3 seconds (mock mode). In prod swap to Supabase Realtime.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [router]);

  // Auto-hide cursor on idle (kiosk feel)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      document.body.style.cursor = "auto";
      clearTimeout(t);
      t = setTimeout(() => (document.body.style.cursor = "none"), 3000);
    };
    window.addEventListener("mousemove", reset);
    reset();
    return () => {
      window.removeEventListener("mousemove", reset);
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-dark to-[#0b1e4d] text-white overflow-hidden">
      {/* Header */}
      <header className="px-12 py-6 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Elite World Services
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            UU Aviation Recruitment 2026
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            In queue
          </p>
          <p className="mt-1 text-4xl font-bold text-brand-green tabular-nums">
            {waitingCount}
          </p>
        </div>
      </header>

      {/* Room grid */}
      <main className="px-12 py-10">
        <div
          className={`grid gap-6 ${
            rooms.length <= 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
          }`}
        >
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </main>

      {/* Upcoming ticker */}
      <footer className="absolute bottom-0 inset-x-0 border-t border-white/10 bg-black/30 px-12 py-5">
        <div className="flex items-center gap-6">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            Up next
          </span>
          <ul className="flex gap-3 flex-wrap">
            {upcoming.length === 0 ? (
              <li className="text-white/40 text-sm">No tokens waiting</li>
            ) : (
              upcoming.map((n) => (
                <li
                  key={n}
                  className="rounded-md bg-white/10 px-4 py-2 text-2xl font-bold tabular-nums"
                >
                  #{n}
                </li>
              ))
            )}
          </ul>
        </div>
      </footer>
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  const isLive =
    room.currentToken?.status === "CALLED" ||
    room.currentToken?.status === "IN_PROGRESS";

  return (
    <div
      className={`rounded-2xl border ${
        isLive
          ? "border-brand-green bg-brand-green/5 shadow-[0_0_60px_-15px_rgba(34,197,94,0.5)]"
          : "border-white/10 bg-white/[0.03]"
      } p-8 transition-all`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          {room.displayName}
        </p>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/20 px-3 py-1 text-xs font-medium text-brand-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
            Now serving
          </span>
        )}
      </div>

      {room.currentToken ? (
        <div className="mt-6">
          <p className="text-[10rem] leading-none font-bold tabular-nums text-brand-green">
            #{room.currentToken.tokenNumber}
          </p>
          <p className="mt-4 text-xl font-medium text-white/85 truncate">
            {room.currentToken.studentName}
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-[7rem] leading-none font-bold text-white/20">—</p>
          <p className="mt-4 text-base text-white/40">Room ready</p>
        </div>
      )}
    </div>
  );
}
