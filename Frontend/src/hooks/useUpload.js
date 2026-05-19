import { useCallback, useRef, useState } from "react";
import {
  deleteUploadedFile,
  MULTIPART_THRESHOLD,
  requestPresignedUrl,
  uploadToS3,
  uploadToS3Multipart,
} from "../services/uploadService";

/**
 * Upload state machine for a list of files.
 * Each file entry: { id, file, name, type, size, status, progress, url, fileKey, resourceType, error }
 * status: "pending" | "uploading" | "success" | "cancelled" | "error"
 */
export const useUpload = ({ courseId, lessonId } = {}) => {
  const [files, setFiles] = useState([]);
  const abortRefs = useRef({});

  const updateFile = useCallback((id, patch) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const doUpload = useCallback(async (item) => {
    updateFile(item.id, { status: "uploading" });
    const controller = new AbortController();
    abortRefs.current[item.id] = controller;

    try {
      let fileKey, fileUrl, resourceType;

      if (item.file.size >= MULTIPART_THRESHOLD) {
        // Large file — use multipart upload (avoids 5 GB single-PUT limit, better progress)
        ({ fileKey, fileUrl, resourceType } = await uploadToS3Multipart({
          file: item.file,
          courseId,
          lessonId,
          onProgress: (p) => updateFile(item.id, { progress: p }),
          signal: controller.signal,
        }));
      } else {
        const result = await requestPresignedUrl({
          fileName: item.file.name,
          fileType: item.file.type,
          fileSize: item.file.size,
          courseId,
          lessonId,
        });

        await uploadToS3({
          presignedUrl: result.presignedUrl,
          file: item.file,
          onProgress: (p) => updateFile(item.id, { progress: p }),
          signal: controller.signal,
        });

        fileKey = result.fileKey;
        fileUrl = result.fileUrl;
        resourceType = result.resourceType;
      }

      updateFile(item.id, { status: "success", progress: 100, url: fileUrl, fileKey, resourceType });
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
        updateFile(item.id, { status: "cancelled", progress: 0 });
      } else {
        updateFile(item.id, { status: "error", error: err?.response?.data?.message || err.message || "Upload failed" });
      }
    }
  }, [courseId, lessonId, updateFile]);

  const upload = useCallback((acceptedFiles) => {
    setFiles((prev) => {
      // Deduplicate: skip files already queued with same name + size
      const existingKeys = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const deduped = acceptedFiles.filter(
        (file) => !existingKeys.has(`${file.name}:${file.size}`)
      );

      const newItems = deduped.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        status: "pending",
        progress: 0,
        url: null,
        fileKey: null,
        resourceType: null,
        error: null,
      }));

      newItems.forEach((item) => doUpload(item));
      return [...prev, ...newItems];
    });
  }, [doUpload]);

  const cancel = useCallback((id) => {
    abortRefs.current[id]?.abort();
  }, []);

  const retry = useCallback((id) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (!item) return prev;
      doUpload({ ...item, status: "pending", progress: 0, error: null });
      return prev.map((f) => f.id === id ? { ...f, status: "pending", progress: 0, error: null } : f);
    });
  }, [doUpload]);

  const remove = useCallback(async (id) => {
    cancel(id);
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.fileKey) {
        deleteUploadedFile(item.fileKey).catch(() => {});
      }
      return prev.filter((f) => f.id !== id);
    });
  }, [cancel]);

  const clear = useCallback(() => {
    setFiles([]);
  }, []);

  const successFiles = files.filter((f) => f.status === "success");

  return { files, successFiles, upload, cancel, retry, remove, clear };
};
