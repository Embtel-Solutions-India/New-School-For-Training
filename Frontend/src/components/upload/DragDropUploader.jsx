import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useUpload } from "../../hooks/useUpload";
import UploadProgress from "./UploadProgress";
import FilePreview from "./FilePreview";
import MediaPreview from "./MediaPreview";

const ACCEPTED = {
  "video/mp4": [],
  "video/webm": [],
  "video/quicktime": [],
  "video/x-msvideo": [],
  "application/pdf": [],
  "application/msword": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "application/vnd.ms-powerpoint": [],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
  "application/zip": [],
  "application/x-zip-compressed": [],
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/gif": [],
};

const isVideoType = (type) => type?.startsWith("video/");

/**
 * DragDropUploader — embedded inside the Lesson dialog.
 *
 * Props:
 *   courseId          — required for presigned URL generation
 *   lessonId          — optional (undefined for new lessons)
 *   onVideoUploaded   — (url, fileKey) => void — called when a video is successfully uploaded
 *   onResourceUploaded— ({ title, type, url }) => void — called for non-video files
 *   onResourceRemoved — (url) => void — called when a resource file is removed
 *   savedResources    — existing resources[]: [{ _id, title, type, url }] to show as FilePreview
 */
const DragDropUploader = ({
  courseId,
  lessonId,
  onVideoUploaded,
  onResourceUploaded,
  onResourceRemoved,
  savedResources = [],
}) => {
  const { files, upload, cancel, retry, remove } = useUpload({ courseId, lessonId });

  const onDrop = useCallback((accepted) => {
    upload(accepted);
  }, [upload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 10,
  });

  // Notify parent when a file reaches "success" state
  useEffect(() => {
    files.forEach((f) => {
      if (f.status === "success" && f.url && !f._notified) {
        f._notified = true;
        if (isVideoType(f.type)) {
          onVideoUploaded?.(f.url, f.fileKey);
        } else {
          onResourceUploaded?.({
            title: f.name,
            type: f.resourceType || "download",
            url: f.url,
          });
        }
      }
    });
  }, [files, onVideoUploaded, onResourceUploaded]);

  const handleRemoveUploaded = async (id) => {
    const file = files.find((f) => f.id === id);
    if (file?.status === "success" && isVideoType(file.type)) {
      onVideoUploaded?.(null, null);
    } else if (file?.status === "success" && file.url) {
      onResourceRemoved?.(file.url);
    }
    await remove(id);
  };

  return (
    <div className="space-y-2">

      {/* DROP ZONE */}
      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer
          transition-all duration-200 select-none
          ${isDragActive
            ? "border-violet-400 bg-violet-500/10"
            : "border-white/15 bg-white/2 hover:border-white/30 hover:bg-white/4"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload size={22} className={`mx-auto mb-2 transition-colors ${isDragActive ? "text-violet-400" : "text-white/30"}`} />
        <p className={`text-sm font-medium transition-colors ${isDragActive ? "text-violet-300" : "text-white/50"}`}>
          {isDragActive ? "Drop files here…" : "Drag & drop files or click to browse"}
        </p>
        <p className="mt-1 text-[11px] text-white/25">
          Videos (5 GB) · PDFs (50 MB) · Docs · PPT · ZIP · Images
        </p>
      </div>

      {/* ACTIVE UPLOADS */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <UploadProgress
              key={f.id}
              file={f}
              onCancel={cancel}
              onRetry={retry}
              onRemove={handleRemoveUploaded}
            />
          ))}
        </div>
      )}

      {/* PREVIEW — newly uploaded media (video / image / PDF) */}
      {files.some((f) => f.status === "success" && (f.type?.startsWith("video/") || f.type?.startsWith("image/") || f.type === "application/pdf")) && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider px-0.5">Preview</p>
          {files
            .filter((f) => f.status === "success" && (f.type?.startsWith("video/") || f.type?.startsWith("image/") || f.type === "application/pdf"))
            .map((f) => (
              <MediaPreview key={f.id} url={f.url} type={f.type} fileName={f.name} />
            ))}
        </div>
      )}

      {/* SAVED RESOURCES (existing on the lesson) */}
      {savedResources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider px-0.5">Saved resources</p>
          {savedResources.map((r) => (
            <FilePreview
              key={r._id || r.url}
              title={r.title}
              url={r.url}
              type={r.type}
              onRemove={() => onResourceRemoved?.(r.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropUploader;
