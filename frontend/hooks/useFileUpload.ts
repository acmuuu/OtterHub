"use client";

import { useCallback, useRef, useState } from "react";
import {
  getUploadChunkProgress,
  uploadChunkInit,
  uploadChunkWithProgress,
  uploadFileWithProgress,
} from "@/lib/api";
import {
  buildTmpFileKey,
  formatFileSize,
  getFileType,
  processBatch,
  getMissingChunkIndices,
  scanFiles,
} from "@/lib/utils";
import { useFileDataStore } from "@/stores/file";
import { nsfwDetector } from "@/lib/nsfw-detector";
import { toast } from "sonner";
import {
  FileItem,
  FileTag,
  MAX_CHUNK_SIZE,
  MAX_FILENAME_LENGTH,
  MAX_FILE_SIZE,
} from "@shared/types";
import { useGeneralSettingsStore } from "@/stores/general-store";
import { MAX_CONCURRENTS } from "@/lib/types";

export function useFileUpload() {
  const addFileLocal = useFileDataStore((s) => s.addFileLocal);
  const { nsfwDetection, defaultUploadTags } = useGeneralSettingsStore();
  const [isFileDrag, setIsFileDrag] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      if (!fileArray.length) return;

      const processedFiles = fileArray.map((file) => {
        if (file.name.length <= MAX_FILENAME_LENGTH) return file;

        const extIndex = file.name.lastIndexOf(".");
        const ext = extIndex !== -1 ? file.name.substring(extIndex) : "";
        const nameWithoutExt =
          extIndex !== -1 ? file.name.substring(0, extIndex) : file.name;

        const truncatedName = nameWithoutExt.substring(
          0,
          MAX_FILENAME_LENGTH - ext.length,
        );
        const newName = truncatedName + ext;

        return new File([file], newName, {
          type: file.type,
          lastModified: file.lastModified,
        });
      });

      const uploadProgressMap: Record<string, number> = {};
      setUploadProgress({});

      let successCount = 0;
      const failed: string[] = [];

      const uploadNormalFile = async (file: File) => {
        const tmpKey = buildTmpFileKey(file);
        uploadProgressMap[tmpKey] = 0;
        setUploadProgress({ ...uploadProgressMap });

        try {
          const isUnsafe = nsfwDetection
            ? await nsfwDetector.isUnsafeImg(file)
            : false;
          const key = await uploadFileWithProgress(
            file,
            { nsfw: isUnsafe, tags: defaultUploadTags },
            (p) => {
              uploadProgressMap[tmpKey] = p.percent;
              setUploadProgress({ ...uploadProgressMap });
            },
          );

          uploadProgressMap[tmpKey] = 100;
          setUploadProgress({ ...uploadProgressMap });

          const fileItem: FileItem = {
            name: key,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: Date.now(),
              liked: false,
              tags: isUnsafe ? [FileTag.NSFW] : [],
            },
          };

          addFileLocal(fileItem, getFileType(file.type, file.name));
          successCount++;
        } catch (err) {
          failed.push(`${file.name}: ${(err as Error).message}`);
        } finally {
          setTimeout(() => {
            delete uploadProgressMap[tmpKey];
            setUploadProgress({ ...uploadProgressMap });
          }, 400);
        }
      };

      const uploadChunkedFile = async (file: File) => {
        if (file.size >= MAX_FILE_SIZE) {
          toast.warning(`文件大小超过 ${formatFileSize(MAX_FILE_SIZE)}`);
          return;
        }

        const tmpKey = buildTmpFileKey(file);
        uploadProgressMap[tmpKey] = 0;
        setUploadProgress({ ...uploadProgressMap });

        let stopPolling = false;

        try {
          const fileType = getFileType(file.type, file.name);
          const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);

          const key = await uploadChunkInit({
            fileType,
            fileName: file.name,
            fileSize: file.size,
            totalChunks,
            tags: defaultUploadTags,
          });

          const missing = getMissingChunkIndices(totalChunks);
          const uploadedBytesByChunk = new Map<number, number>();
          let uploadedBytesTotal = 0;
          let uploadDone = false;
          let processingComplete = false;
          let lastProcessingPercent = 0;

          const processingStartAt = Date.now();
          const maxProcessingMs = Math.max(
            5 * 60 * 1000,
            totalChunks * 90 * 1000,
          );

          const pollProcessing = async () => {
            while (!processingComplete && !stopPolling) {
              if (uploadDone && Date.now() - processingStartAt > maxProcessingMs) {
                throw new Error("后端处理超时，请稍后刷新页面查看结果");
              }

              try {
                const progress = await getUploadChunkProgress(key);
                const processingPercent =
                  progress.total > 0
                    ? Math.min(
                        100,
                        Math.round((progress.uploaded / progress.total) * 100),
                      )
                    : 0;

                lastProcessingPercent = processingPercent;

                if (uploadDone) {
                  uploadProgressMap[tmpKey] = progress.complete
                    ? 100
                    : Math.min(99, processingPercent);
                  setUploadProgress({ ...uploadProgressMap });
                }

                if (progress.complete) {
                  processingComplete = true;
                  return;
                }
              } catch {
                // keep polling
              }

              await new Promise((r) => setTimeout(r, 1200));
            }
          };

          const pollPromise = pollProcessing();

          const uploadOne = async (idx: number) => {
            const start = idx * MAX_CHUNK_SIZE;
            const end = Math.min(start + MAX_CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const chunkSize = end - start;

            await uploadChunkWithProgress(key, idx, chunk, (p) => {
              const loaded = Math.min(p.loaded, chunkSize);
              const prev = uploadedBytesByChunk.get(idx) || 0;
              if (loaded === prev) return;

              uploadedBytesByChunk.set(idx, loaded);
              uploadedBytesTotal += loaded - prev;

              uploadProgressMap[tmpKey] = Math.min(
                99,
                Math.round((uploadedBytesTotal / file.size) * 100),
              );
              setUploadProgress({ ...uploadProgressMap });
            });

            const prev = uploadedBytesByChunk.get(idx) || 0;
            if (prev < chunkSize) {
              uploadedBytesByChunk.set(idx, chunkSize);
              uploadedBytesTotal += chunkSize - prev;
            }

            uploadProgressMap[tmpKey] = Math.min(
              99,
              Math.round((uploadedBytesTotal / file.size) * 100),
            );
            setUploadProgress({ ...uploadProgressMap });
          };

          await processBatch(missing, uploadOne, undefined, MAX_CONCURRENTS);
          uploadDone = true;

          uploadProgressMap[tmpKey] = Math.min(
            99,
            Math.max(
              uploadProgressMap[tmpKey] || 0,
              lastProcessingPercent || 0,
            ),
          );
          setUploadProgress({ ...uploadProgressMap });

          await pollPromise;
          stopPolling = true;

          const fileItem: FileItem = {
            name: key,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: Date.now(),
              liked: false,
              tags: [],
            },
          };

          addFileLocal(fileItem, fileType);
          successCount++;
        } catch (err) {
          failed.push(`${file.name}: ${(err as Error).message}`);
        } finally {
          stopPolling = true;
          setTimeout(() => {
            delete uploadProgressMap[tmpKey];
            setUploadProgress({ ...uploadProgressMap });
          }, 400);
        }
      };

      await processBatch(
        processedFiles,
        (file) =>
          file.size > MAX_CHUNK_SIZE
            ? uploadChunkedFile(file)
            : uploadNormalFile(file),
        undefined,
        MAX_CONCURRENTS,
      );

      if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 个文件`);
      }

      if (failed.length) {
        toast.error(`${failed.length}个文件上传失败`, {
          description: failed.join(", "),
        });
      }
    },
    [addFileLocal, nsfwDetection, defaultUploadTags],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      if (!fileArray.length) return;
      processFiles(fileArray);
    },
    [processFiles],
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) void handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles],
  );

  const onMainDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDrag(true);
  }, []);

  const onMainDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDrag(false);
  }, []);

  const onMainDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDrag(false);
      if (e.dataTransfer.items) {
        const files = await scanFiles(e.dataTransfer.items);
        handleFiles(files);
      } else {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  return {
    fileInputRef,
    uploadProgress,
    isFileDrag,
    openFileDialog,
    onInputChange,
    onMainDragOver,
    onMainDragLeave,
    onMainDrop,
  };
}
