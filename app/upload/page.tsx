"use client";

import { useEffect, useState } from "react";
import { getVideos, addVideo, uploadFile } from "@/lib/firebase";

type FileStatus = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function UploadPage() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("films-night-name");
    if (saved) setName(saved);
  }, []);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles(picked.map((file) => ({ file, status: "pending" })));
    setDoneCount(0);
  };

  const addMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked.map<FileStatus>((file) => ({ file, status: "pending" }))]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || files.length === 0) return;

    localStorage.setItem("films-night-name", trimmed);
    setSubmitting(true);

    // Find the highest position so new uploads go to the end of the queue.
    const all = await getVideos();
    const maxPos = all.reduce(
      (max, v) => Math.max(max, (v as any)?.position ?? 0),
      -1
    );
    let nextPos = maxPos + 1;

    let successCount = 0;
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;

      updated[i] = { ...entry, status: "uploading" };
      setFiles([...updated]);

      try {
        const ext = entry.file.name.split(".").pop() || "mp4";
        const safeName = trimmed.replace(/[^a-z0-9-]+/gi, "_").toLowerCase();
        const path = `${Date.now()}-${safeName}-${i}.${ext}`;

        const videoUrl = await uploadFile(entry.file, path);

        await addVideo({
          uploader_name: trimmed,
          storage_path: path,
          video_url: videoUrl,
          position: nextPos,
        });

        nextPos += 1;
        successCount += 1;
        updated[i] = { ...entry, status: "done" };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updated[i] = { ...entry, status: "error", error: msg };
      }
      setFiles([...updated]);
    }

    setDoneCount(successCount);
    setSubmitting(false);
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-bold">Add your clips</h1>
        <p className="text-white/60 text-sm mt-1">
          Films night queue. Upload as many clips as you want.
        </p>
      </header>

      {allDone && !submitting ? (
        <div className="rounded-lg bg-green-500/20 border border-green-500/40 p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-lg font-semibold">Uploaded {doneCount} clip{doneCount === 1 ? "" : "s"}</div>
          <div className="text-white/70 text-sm mt-1 mb-4">
            You're in the queue. Go find a seat.
          </div>
          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setDoneCount(0);
            }}
            className="px-4 py-2 rounded bg-white text-black font-semibold"
          >
            Add more
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Ryan M."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50"
              disabled={submitting}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Videos</span>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handlePick}
              disabled={submitting}
              className="block w-full text-sm text-white/80 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-white/90 file:cursor-pointer"
            />
            <span className="text-xs text-white/50">Pick multiple at once from your gallery.</span>
          </label>

          {files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((f, i) => (
                <li
                  key={`${f.file.name}-${i}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">{f.file.name}</div>
                    <div className="text-xs text-white/50">
                      {(f.file.size / (1024 * 1024)).toFixed(1)} MB
                      {f.status === "uploading" && " · uploading…"}
                      {f.status === "done" && " · uploaded ✓"}
                      {f.status === "error" && ` · ${f.error}`}
                    </div>
                  </div>
                  {f.status === "done" ? (
                    <span className="text-green-400">✓</span>
                  ) : f.status === "error" ? (
                    <span className="text-red-400">!</span>
                  ) : (
                    !submitting && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-white/40 hover:text-white/80 px-2"
                      >
                        ✕
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}

          {files.length > 0 && !submitting && !allDone && (
            <label className="text-sm text-white/70 cursor-pointer">
              <span className="underline">+ Add more videos</span>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={addMore}
                className="hidden"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={submitting || files.length === 0 || !name.trim()}
            className="w-full px-4 py-4 rounded-lg bg-yellow-400 text-black font-bold text-lg disabled:opacity-40"
          >
            {submitting
              ? "Uploading…"
              : `Upload ${files.length} clip${files.length === 1 ? "" : "s"}`}
          </button>
        </form>
      )}
    </main>
  );
}
