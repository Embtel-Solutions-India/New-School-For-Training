import { FileText, Image as ImageIcon } from "lucide-react";

/**
 * MediaPreview — shows a preview for a successfully uploaded file.
 * Supports: video (mp4/webm/mov), image (jpeg/png/webp), PDF (embed), generic (icon).
 * Props: { url, type, fileName }
 */
const MediaPreview = ({ url, type, fileName }) => {
  if (!url) return null;

  if (type?.startsWith("video/")) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <video
          src={url}
          controls
          className="w-full max-h-48 object-contain"
          preload="metadata"
        />
        <p className="px-3 py-1.5 text-[10px] text-white/35 truncate">{fileName}</p>
      </div>
    );
  }

  if (type?.startsWith("image/")) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
        <img
          src={url}
          alt={fileName}
          className="w-full max-h-40 object-cover"
          loading="lazy"
        />
        <p className="px-3 py-1.5 text-[10px] text-white/35 truncate">{fileName}</p>
      </div>
    );
  }

  if (type === "application/pdf") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/15">
          <FileText size={14} className="text-red-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/70 truncate">{fileName}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            Open PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/15">
        <ImageIcon size={14} className="text-violet-300" />
      </div>
      <p className="text-xs font-medium text-white/70 truncate">{fileName}</p>
    </div>
  );
};

export default MediaPreview;
