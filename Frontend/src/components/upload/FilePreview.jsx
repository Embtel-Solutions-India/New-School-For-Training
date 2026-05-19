import { IconButton, Tooltip } from "@mui/material";
import { ExternalLink, FileText, Image, Trash2, Video, Archive } from "lucide-react";

const FileIcon = ({ type }) => {
  const cls = "text-violet-300";
  if (!type || type === "video") return <Video size={14} className={cls} />;
  if (type === "link" || type?.startsWith("image/")) return <Image size={14} className={cls} />;
  if (type === "download" && type?.includes("zip")) return <Archive size={14} className={cls} />;
  return <FileText size={14} className={cls} />;
};

/**
 * Displays a single already-saved file (from lesson.resources[]).
 * Props: { title, url, type, onRemove }
 */
const FilePreview = ({ title, url, type, onRemove }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">

    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/15">
      <FileIcon type={type} />
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-white/80 truncate">{title}</p>
      <p className="text-[10px] text-emerald-400">Saved</p>
    </div>

    <div className="flex shrink-0 gap-0.5">
      <Tooltip title="Open">
        <IconButton size="small" component="a" href={url} target="_blank" rel="noopener noreferrer"
          sx={{ color: "rgba(255,255,255,0.4)", p: "3px" }}>
          <ExternalLink size={11} />
        </IconButton>
      </Tooltip>
      {onRemove && (
        <Tooltip title="Remove">
          <IconButton size="small" onClick={onRemove}
            sx={{ color: "rgba(239,68,68,0.5)", p: "3px", "&:hover": { color: "#f87171" } }}>
            <Trash2 size={11} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  </div>
);

export default FilePreview;
