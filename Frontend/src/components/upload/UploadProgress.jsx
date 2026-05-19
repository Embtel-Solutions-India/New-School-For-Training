import { LinearProgress, IconButton, Tooltip } from "@mui/material";
import { CheckCircle2, FileText, RefreshCw, Trash2, Video, X, Image, Archive } from "lucide-react";

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const FileIcon = ({ type }) => {
  const cls = "text-violet-300";
  if (type?.startsWith("video/")) return <Video size={14} className={cls} />;
  if (type?.startsWith("image/")) return <Image size={14} className={cls} />;
  if (type === "application/zip" || type === "application/x-zip-compressed") return <Archive size={14} className={cls} />;
  return <FileText size={14} className={cls} />;
};

const statusColor = (status) => {
  switch (status) {
    case "uploading": return "#a78bfa";
    case "success":   return "#86efac";
    case "error":     return "#f87171";
    case "cancelled": return "#94a3b8";
    default:          return "#94a3b8";
  }
};

const statusLabel = (file) => {
  switch (file.status) {
    case "pending":   return "Waiting…";
    case "uploading": return `${file.progress}%`;
    case "success":   return "Uploaded";
    case "cancelled": return "Cancelled";
    case "error":     return file.error || "Failed";
    default:          return "";
  }
};

const UploadProgress = ({ file, onCancel, onRetry, onRemove }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">

    {/* Icon */}
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/15">
      {file.status === "success"
        ? <CheckCircle2 size={14} className="text-emerald-400" />
        : <FileIcon type={file.type} />}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-white/80 truncate">{file.name}</p>
      <div className="mt-0.5 flex items-center gap-2">
        {file.status === "uploading" && (
          <LinearProgress
            variant="determinate"
            value={file.progress}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: "#a78bfa", borderRadius: 2 },
            }}
          />
        )}
        <span className="text-[10px] shrink-0" style={{ color: statusColor(file.status) }}>
          {statusLabel(file)}
        </span>
        {file.status !== "uploading" && (
          <span className="text-[10px] text-white/25 shrink-0">{formatBytes(file.size)}</span>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="flex shrink-0 gap-0.5">
      {file.status === "uploading" && (
        <Tooltip title="Cancel">
          <IconButton size="small" onClick={() => onCancel(file.id)}
            sx={{ color: "rgba(255,255,255,0.35)", p: "3px", "&:hover": { color: "#f87171" } }}>
            <X size={11} />
          </IconButton>
        </Tooltip>
      )}
      {file.status === "error" && (
        <Tooltip title="Retry">
          <IconButton size="small" onClick={() => onRetry(file.id)}
            sx={{ color: "#a78bfa", p: "3px" }}>
            <RefreshCw size={11} />
          </IconButton>
        </Tooltip>
      )}
      {(file.status === "success" || file.status === "error" || file.status === "cancelled") && (
        <Tooltip title="Remove">
          <IconButton size="small" onClick={() => onRemove(file.id)}
            sx={{ color: "rgba(239,68,68,0.5)", p: "3px", "&:hover": { color: "#f87171" } }}>
            <Trash2 size={11} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  </div>
);

export default UploadProgress;
