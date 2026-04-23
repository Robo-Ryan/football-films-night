"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVideos } from "@/lib/firebase";
import type { Video } from "@/lib/types";

const SPEEDS = [0.2, 0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function WatchPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getVideos().then((data) => {
      setVideos((data as Video[]) ?? []);
      setLoading(false);
    });
  }, []);

  const current = videos[currentIndex] ?? null;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(0);
    setIsPlaying(false);
    v.playbackRate = speed;
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= videos.length) return;
      setCurrentIndex(idx);
    },
    [videos.length]
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    else await el.requestFullscreen().catch(() => {});
  }, []);

  // Auto-advance when a clip ends
  const handleEnded = () => {
    if (currentIndex < videos.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      // Small delay so state updates before play
      setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "ArrowLeft" && !e.shiftKey) {
        e.preventDefault();
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, v.currentTime - 1 / 30);
      } else if (e.key === "ArrowRight" && !e.shiftKey) {
        e.preventDefault();
        const v = videoRef.current;
        if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 1 / 30);
      } else if (e.key === "ArrowLeft" && e.shiftKey) goTo(currentIndex - 1);
      else if (e.key === "ArrowRight" && e.shiftKey) goTo(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen, goTo, currentIndex]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading clips…</div>
      </main>
    );
  }

  if (videos.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-center">
          <div className="text-4xl mb-3">🎬</div>
          <div className="text-lg font-semibold">No clips in the queue</div>
          <div className="text-sm mt-1">Clips uploaded during films night will appear here.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <header className="mb-4 pt-2 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Films Night — Replay</h1>
          <p className="text-white/60 text-sm">
            {currentIndex + 1} / {videos.length} · {current?.uploader_name}
          </p>
        </div>
        <div className="text-white/50 text-xs hidden md:block">
          Space play · ← → frame · Shift+← → clip · F fullscreen
        </div>
      </header>

      {/* Player */}
      <div
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        {current && (
          <video
            ref={videoRef}
            key={current.id}
            src={current.video_url}
            className="w-full h-full object-contain bg-black"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration || 0);
              e.currentTarget.playbackRate = speed;
            }}
            tabIndex={-1}
            playsInline
            autoPlay
          />
        )}

        {/* Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
          <div className="text-white font-semibold mb-2 text-lg">
            {current?.uploader_name}'s clip
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white/80 tabular-nums text-sm">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="scrub flex-1"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (videoRef.current) videoRef.current.currentTime = t;
                setCurrentTime(t);
              }}
            />
            <span className="text-white/80 tabular-nums text-sm">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 text-sm"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="px-5 py-2 rounded bg-white text-black font-semibold text-sm"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex === videos.length - 1}
                className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 text-sm"
              >
                Next →
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 text-sm"
              >
                Fullscreen
              </button>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs font-semibold tabular-nums ${
                    speed === s ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clip list */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">All clips</h2>
        <ul className="flex flex-col gap-2">
          {videos.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                  i === currentIndex
                    ? "bg-yellow-400/15 border border-yellow-400"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="w-16 h-9 rounded overflow-hidden bg-white/10 shrink-0">
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">▶</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-sm">{v.uploader_name}</div>
                  {v.duration && (
                    <div className="text-xs text-white/50">
                      {Math.floor(v.duration / 60)}:{String(Math.floor(v.duration % 60)).padStart(2, "0")}
                    </div>
                  )}
                </div>
                <div className="text-white/40 text-sm tabular-nums">{i + 1}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
