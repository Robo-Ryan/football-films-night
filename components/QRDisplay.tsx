"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export default function QRDisplay() {
  const [uploadUrl, setUploadUrl] = useState<string>("");

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setUploadUrl(`${base}/upload`);
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
      {uploadUrl ? <QRCodeSVG value={uploadUrl} size={160} /> : <div className="w-40 h-40" />}
      <div className="text-black text-xs text-center max-w-[160px]">
        Scan to add your clips
      </div>
      {uploadUrl && (
        <a
          href={uploadUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-black/60 underline truncate max-w-[160px]"
        >
          {uploadUrl}
        </a>
      )}
    </div>
  );
}
