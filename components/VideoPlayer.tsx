"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/types";

const SPEEDS = [0.2, 0.5, 0.75, 1, 1.25, 1.5, 2];

type Props = {
  src: string | null;
  title?: string;
  videos?: Video[];
  currentId?: string | null;
  onSelect?: (id: string) => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, title, videos = [], currentId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentIndex = videos.findIndex((v) => v.id === currentId);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo = currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  // Reset player state when the source changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [src]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await el.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "ArrowLeft" && !e.shiftKey) {
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, v.currentTime - 2);
      } else if (e.key === "ArrowRight" && !e.shiftKey) {
        const v = videoRef.current;
        if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 2);
      } else if ((e.key === "ArrowRight" && e.shiftKey) || e.key === "n") {
        if (nextVideo && onSelect) onSelect(nextVideo.id);
      } else if ((e.key === "ArrowLeft" && e.shiftKey) || e.key === "p") {
        if (prevVideo && onSelect) onSelect(prevVideo.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen, nextVideo, prevVideo, onSelect]);

  const btnBase = isFullscreen ? "px-5 py-3 text-lg rounded" : "px-4 py-2 text-sm rounded";

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: isFullscreen ? undefined : "16/9" }}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration || 0);
            e.currentTarget.playbackRate = speed;
          }}
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60 min-h-[300px]">
          Select a video from the queue to start.
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent ${
          isFullscreen ? "p-6" : "p-3"
        }`}
      >
        {title && (
          <div className={`text-white font-semibold mb-2 ${isFullscreen ? "text-2xl" : "text-sm"}`}>
            {title}
          </div>
        )}

        {/* Scrub bar */}
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-white/80 tabular-nums ${isFullscreen ? "text-base" : "text-xs"}`}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            className="scrub flex-1"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(currentTime, duration || 0)}
            onChange={handleScrub}
            disabled={!src}
          />
          <span className={`text-white/80 tabular-nums ${isFullscreen ? "text-base" : "text-xs"}`}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Prev — only show in fullscreen */}
            {isFullscreen && (
              <button
                type="button"
                onClick={() => prevVideo && onSelect?.(prevVideo.id)}
                disabled={!prevVideo}
                className={`${btnBase} bg-white/10 text-white hover:bg-white/20 disabled:opacity-30`}
                title="Previous (Shift+← or P)"
              >
                ← Prev
              </button>
            )}

            <button
              type="button"
              onClick={togglePlay}
              disabled={!src}
              className={`${btnBase} bg-white text-black font-semibold disabled:opacity-40`}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            {/* Next — only show in fullscreen */}
            {isFullscreen && (
              <button
                type="button"
                onClick={() => nextVideo && onSelect?.(nextVideo.id)}
                disabled={!nextVideo}
                className={`${btnBase} bg-white/10 text-white hover:bg-white/20 disabled:opacity-30`}
                title="Next (Shift+→ or N)"
              >
                Next →
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`${btnBase} bg-white/10 text-white hover:bg-white/20`}
            >
              {isFullscreen ? "Exit Full" : "Fullscreen"}
            </button>
          </div>

          {/* Speed buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                disabled={!src}
                className={`rounded font-semibold tabular-nums transition disabled:opacity-40 ${
                  isFullscreen ? "px-3 py-2 text-base" : "px-2 py-1 text-xs"
                } ${
                  speed === s
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Fullscreen keyboard hint */}
        {isFullscreen && (
          <div className="mt-3 text-white/40 text-sm">
            Shift+← prev · Shift+→ next · ← → skip 2s · Space play/pause
          </div>
        )}
      </div>
    </div>
  );
}
