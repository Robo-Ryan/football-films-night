export type Video = {
  id: string;
  uploader_name: string;
  storage_path: string;
  video_url: string;
  position: number;
  duration?: number;
  thumbnail_url?: string;
  created_at?: Date | { toDate(): Date };
};
