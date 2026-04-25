import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ListFilesRequest,
} from "@/lib/types";
import { getFileList } from "@/lib/api";
import { getFileTypeFromKey } from "@/lib/utils/file";
import { useFileUIStore } from "./ui";
import { FileItem, FileMetadata, trashPrefix, FileType, TRASH_EXPIRATION_TTL } from "@shared/types";
import { storeKey } from "..";

type FileBucket = {
  items: FileItem[];
  cursor?: string;
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  queryKey?: string;
};

type FileListQuery = Omit<ListFilesRequest, "fileType" | "limit" | "cursor">;

/**
 * 按文件名合并本地和服务端文件列表
 */
function mergeByName(local: FileItem[], remote: FileItem[]): FileItem[] {
  const map = new Map<string, FileItem>();
  for (const item of local) map.set(item.name, item);
  for (const item of remote) map.set(item.name, item);
  return Array.from(map.values());
}

function mergeUploadedFirst(uploaded: FileItem[], existing: FileItem[]): FileItem[] {
  const uploadedNames = new Set(uploaded.map((item) => item.name));
  const sortedUploaded = [...uploaded].sort(
    (a, b) => (b.metadata?.uploadedAt ?? 0) - (a.metadata?.uploadedAt ?? 0),
  );
  return [
    ...sortedUploaded,
    ...existing.filter((item) => !uploadedNames.has(item.name)),
  ];
}

interface FileDataState {
  activeType: FileType;
  buckets: Record<FileType, FileBucket>;

  // actions
  setActiveType: (type: FileType) => Promise<void>;
  fetchNextPage: (query?: FileListQuery) => Promise<void>;
  fetchBucket: (type: FileType, query?: FileListQuery) => Promise<void>;
  
  addFileLocal: (file: FileItem, fileType: FileType) => void;
  addFilesLocal: (files: FileItem[], fileType: FileType) => void;
  deleteFilesLocal: (names: string[]) => void;
  deleteFilesLocalByType: (names: string[], type: FileType) => void;
  moveToTrashLocal: (file: FileItem) => Promise<void>;
  restoreFromTrashLocal: (file: FileItem) => Promise<void>;
  updateFileMetadata: (name: string, metadata: FileMetadata) => void;
}

const emptyBucket = (): FileBucket => ({
  items: [],
  cursor: undefined,
  hasMore: true,
  loading: false,
  error: false,
  queryKey: undefined,
});

function getQueryKey(type: FileType, limit: number, query?: FileListQuery) {
  return JSON.stringify({
    type,
    limit,
    search: query?.search ?? "",
    liked: query?.liked ?? "",
    tags: query?.tags ?? "",
    dateStart: query?.dateStart ?? "",
    dateEnd: query?.dateEnd ?? "",
    sortType: query?.sortType ?? "",
    sortOrder: query?.sortOrder ?? "",
  });
}

export const useFileDataStore = create<FileDataState>()(
  persist(
    (set, get) => ({
      activeType: FileType.Image,
      buckets: {
        [FileType.Image]: emptyBucket(),
        [FileType.Audio]: emptyBucket(),
        [FileType.Video]: emptyBucket(),
        [FileType.Document]: emptyBucket(),
        [FileType.Trash]: emptyBucket(),
      },

      setActiveType: async (type) => {
        set({ activeType: type });

        // 如果从未加载过数据，触发一次分页加载
        const bucket = get().buckets[type];
        if (bucket.cursor === undefined) {
          await get().fetchNextPage();
        }
      },

      fetchNextPage: async (query) => {
        const { activeType } = get();
        await get().fetchBucket(activeType, query);
      },

      fetchBucket: async (type, query) => {
        const { buckets } = get();
        const bucket = buckets[type];
        const { itemsPerPage } = useFileUIStore.getState();
        const queryKey = getQueryKey(type, itemsPerPage, query);
        const shouldReset = bucket.queryKey !== queryKey;
        const currentBucket = shouldReset ? emptyBucket() : bucket;

        if ((!shouldReset && bucket.loading) || !currentBucket.hasMore) return;

        set((state) => ({
          buckets: {
            ...state.buckets,
            [type]: { ...currentBucket, loading: true, error: false, queryKey },
          },
        }));

        try {
          const params: ListFilesRequest = { 
            fileType: type,
            limit: itemsPerPage.toString(),
            ...query,
          };
          if (currentBucket.cursor) params.cursor = currentBucket.cursor;

          const data = await getFileList(params);

          set((state) => {
            const prev = state.buckets[type];
            if (prev.queryKey !== queryKey) return state;
            return {
              buckets: {
                ...state.buckets,
                [type]: {
                  items: currentBucket.cursor !== undefined ? mergeByName(prev.items, data.keys) : data.keys,
                  cursor: data.cursor,
                  hasMore: !data.list_complete,
                  loading: false,
                  error: false,
                  queryKey,
                },
              },
            };
          });
        } catch (error) {
          console.error(`Failed to fetch bucket ${type}:`, error);
          set((state) => ({
            buckets: {
              ...state.buckets,
              [type]: state.buckets[type].queryKey === queryKey
                ? { ...state.buckets[type], loading: false, error: true, queryKey }
                : state.buckets[type],
            },
          }));
        }
      },

      addFileLocal: (file, fileType) => {
        get().addFilesLocal([file], fileType);
      },

      addFilesLocal: (files, fileType) => {
        if (files.length === 0) return;
        set((state) => ({
          buckets: {
            ...state.buckets,
            [fileType]: {
              ...state.buckets[fileType],
              items: mergeUploadedFirst(files, state.buckets[fileType].items),
            },
          },
        }));
      },

      moveToTrashLocal: async (file: FileItem) => {
        const fileType = getFileTypeFromKey(file.name);
        get().deleteFilesLocalByType([file.name], fileType);
        file.name = trashPrefix + file.name;
        // expiration 为绝对时间戳（秒）
        file.expiration = Math.floor(Date.now() / 1000) + TRASH_EXPIRATION_TTL;
        get().addFileLocal(file, FileType.Trash);
      },

      restoreFromTrashLocal: async (file: FileItem) => {
        const originalKey = file.name.startsWith(trashPrefix)
          ? file.name.slice(trashPrefix.length)
          : file.name;
        const originalType = getFileTypeFromKey(originalKey);
        get().deleteFilesLocalByType([file.name], FileType.Trash);
        file.name = originalKey;
        get().addFileLocal(file, originalType);
      },

      deleteFilesLocal: (names: string[]) =>
        set((state) => {
          // 1. 更新 buckets
          const newBuckets = Object.entries(state.buckets).reduce((acc, [type, bucket]) => {
            acc[type as FileType] = {
              ...bucket,
              items: bucket.items.filter((item) => !names.includes(item.name)),
            };
            return acc;
          }, {} as Record<FileType, FileBucket>);

          // 2. 同步清理 selection
          const { selectedKeys } = useFileUIStore.getState();
          const newSelectedKeys = Object.entries(selectedKeys).reduce((acc, [type, keys]) => {
            acc[type as FileType] = keys.filter((key) => !names.includes(key));
            return acc;
          }, {} as Record<FileType, string[]>);
          useFileUIStore.setState({ selectedKeys: newSelectedKeys });

          return { buckets: newBuckets };
        }),

      deleteFilesLocalByType: (names: string[], type: FileType) =>
        set((state) => {
          // 1. 更新指定类型的 bucket
          const newBuckets = {
            ...state.buckets,
            [type]: {
              ...state.buckets[type],
              items: state.buckets[type].items.filter((item) => !names.includes(item.name)),
            },
          };

          // 2. 同步清理该类型的 selection
          const { selectedKeys } = useFileUIStore.getState();
          const currentSelection = selectedKeys[type] || [];
          const newSelectedKeys = {
            ...selectedKeys,
            [type]: currentSelection.filter((key) => !names.includes(key)),
          };
          useFileUIStore.setState({ selectedKeys: newSelectedKeys });

          return { buckets: newBuckets };
        }),

      updateFileMetadata: (name, metadata) =>
        set((state) => {
          const newBuckets = Object.entries(state.buckets).reduce((acc, [type, bucket]) => {
            acc[type as FileType] = {
              ...bucket,
              items: bucket.items.map((item) =>
                item.name === name ? { ...item, metadata } : item
              ),
            };
            return acc;
          }, {} as Record<FileType, FileBucket>);
          return { buckets: newBuckets };
        }),
    }),
    {
      name: storeKey.FileData,
      partialize: (state) => ({
        activeType: state.activeType,
      }),
    }
  )
);

export const useActiveBucket = () =>
  useFileDataStore((s) => s.buckets[s.activeType]);

export const useActiveItems = () =>
  useFileDataStore((s) => s.buckets[s.activeType].items);

export const useBucketItems = (type: FileType) =>
  useFileDataStore((s) => s.buckets[type].items);

/** 获取所有 buckets（用于跨类型操作） */
export const useFileBuckets = () =>
  useFileDataStore((s) => s.buckets);
