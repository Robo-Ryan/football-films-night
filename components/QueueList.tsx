"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Video } from "@/lib/types";

type Props = {
  videos: Video[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
};

function formatDuration(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Row({
  video,
  index,
  isCurrent,
  onSelect,
  onDelete,
}: {
  video: Video;
  index: number;
  isCurrent: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const durationLabel = video.duration ? formatDuration(video.duration) : null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border ${
        isCurrent
          ? "border-yellow-400 bg-yellow-400/10"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <button
        type="button"
        className="text-white/40 hover:text-white/80 cursor-grab active:cursor-grabbing px-1 shrink-0"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <div className="text-white/50 tabular-nums w-5 text-sm shrink-0">{index + 1}.</div>

      {/* Thumbnail */}
      <div className="w-16 h-9 rounded overflow-hidden bg-white/10 shrink-0 relative">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">
            ▶
          </div>
        )}
        {durationLabel && (
          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 leading-4 rounded-tl">
            {durationLabel}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate text-sm">{video.uploader_name}</div>
        {durationLabel && (
          <div className="text-xs text-white/50">{durationLabel}</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(video.id)}
        className={`px-3 py-1 rounded text-sm font-semibold shrink-0 ${
          isCurrent
            ? "bg-yellow-400 text-black"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {isCurrent ? "Playing" : "Play"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Remove ${video.uploader_name}'s clip from the queue?`)) {
            onDelete(video.id);
          }
        }}
        className="px-2 py-1 rounded text-sm bg-red-500/20 text-red-300 hover:bg-red-500/30 shrink-0"
        aria-label="Delete"
      >
        ✕
      </button>
    </li>
  );
}

export default function QueueList({
  videos,
  currentId,
  onSelect,
  onDelete,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = videos.map((v) => v.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  if (videos.length === 0) {
    return (
      <div className="text-white/50 text-sm border border-dashed border-white/10 rounded-lg p-6 text-center">
        No clips yet. Scan the QR code with your phone to add some.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {videos.map((v, i) => (
            <Row
              key={v.id}
              video={v}
              index={i}
              isCurrent={v.id === currentId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
