"use client";

import { useCallback, useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import QueueList from "@/components/QueueList";
import QRDisplay from "@/components/QRDisplay";
import { supabase, BUCKET } from "@/lib/supabase";
import type { Video } from "@/lib/types";

export default function HostPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = videos.find((v) => v.id === currentId) ?? null;

  const handleSelect = (id: string) => setCurrentId(id);

  const handleDelete = async (id: string) => {
    const target = videos.find((v) => v.id === id);
    if (!target) return;

    // Optimistic UI update.
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (currentId === id) setCurrentId(null);

    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) {
      setError(error.message);
      loadQueue();
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    const byId = new Map(videos.map((v) => [v.id, v]));
    const reordered = orderedIds
      .map((id, idx) => {
        const v = byId.get(id);
        return v ? { ...v, position: idx } : null;
      })
      .filter((v): v is Video => v !== null);
    setVideos(reordered);

    const updates = reordered.map((v) =>
      supabase.from("videos").update({ position: v.position }).eq("id", v.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) {
      setError(firstError.error.message);
      loadQueue();
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear the entire queue? This deletes all uploaded clips.")) return;
    const paths = videos.map((v) => v.storage_path);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("videos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setVideos([]);
    setCurrentId(null);
  };

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Films Night</h1>
          <p className="text-white/60 text-sm">Team film review. Queue it up.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadQueue}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm"
          >
            {loading ? "Refreshing…" : "Refresh queue"}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={videos.length === 0}
            className="px-3 py-2 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-40 text-sm"
          >
            Clear all
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <section>
          <VideoPlayer
            src={current?.video_url ?? null}
            title={current ? `${current.uploader_name}'s clip` : undefined}
          />
          <div className="mt-3 text-sm text-white/60">
            Keyboard: <span className="text-white/80">Space</span> play/pause ·{" "}
            <span className="text-white/80">F</span> fullscreen ·{" "}
            <span className="text-white/80">← →</span> skip 2s
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="flex gap-4">
            <QRDisplay />
            <div className="flex-1 text-sm text-white/70">
              <div className="font-semibold text-white mb-1">How it works</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Teammate scans the QR code</li>
                <li>Enters name, picks clips</li>
                <li>Hit <span className="text-white/80">Refresh queue</span></li>
                <li>Drag to reorder, × to remove</li>
              </ol>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Queue ({videos.length})</h2>
            </div>
            <QueueList
              videos={videos}
              currentId={currentId}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
